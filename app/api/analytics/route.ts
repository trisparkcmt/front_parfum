import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const propertyId = process.env.GA_PROPERTY_ID;

    if (!clientEmail || !privateKey || !propertyId) {
      return NextResponse.json(
        { error: 'Missing GA4 configuration variables.' },
        { status: 500 }
      );
    }

    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    const client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: clientEmail,
        private_key: formattedPrivateKey,
      },
    });

    const requests = [
      // 1. Funnel Event Counts (eventCount by eventName)
      {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'eventName' }],
        metrics: [
          { name: 'eventCount' },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            inListFilter: {
              values: ['view_item_list', 'view_item', 'add_to_cart', 'remove_from_cart', 'begin_checkout', 'purchase'],
            },
          },
        },
      },
      // 2. Funnel Revenue (purchaseRevenue by eventName - only for purchase)
      {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'eventName' }],
        metrics: [
          { name: 'purchaseRevenue' },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: {
              matchType: 'EXACT',
              value: 'purchase',
            },
          },
        },
      },
      // 3. Acquisition Channels
      {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionSourceMedium' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'purchaseRevenue' },
          { name: 'sessions' },
        ],
        orderBys: [
          {
            metric: { metricName: 'activeUsers' },
            desc: true,
          },
        ],
        limit: 10,
      },
      // 3. Top Pages
      {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pagePathPlusQueryString' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'activeUsers' },
        ],
        orderBys: [
          {
            metric: { metricName: 'screenPageViews' },
            desc: true,
          },
        ],
        limit: 15,
      },
      // 4. Tech & Devices
      {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'deviceCategory' }, { name: 'browser' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
        ],
      },
      // 5. Geo
      {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'country' }, { name: 'city' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'newUsers' },
        ],
      },
    ];

    const chunkSize = 5;
    const allReports: any[] = [];
    for (let i = 0; i < requests.length; i += chunkSize) {
      const chunk = requests.slice(i, i + chunkSize);
      const [batchResponse] = await client.batchRunReports({
        property: `properties/${propertyId}`,
        requests: chunk,
      });
      allReports.push(...(batchResponse.reports || []));
    }

    const reports = allReports;

    // Parse Report 0: Funnel Event Counts
    const funnelEventRows = reports[0]?.rows || [];
    const eventCountMap: Record<string, number> = {};
    funnelEventRows.forEach((row: any) => {
      const step = row.dimensionValues?.[0]?.value || '';
      const eventCount = parseInt(row.metricValues?.[0]?.value || '0', 10);
      eventCountMap[step] = eventCount;
    });

    // Parse Report 1: Funnel Revenue (purchase only)
    const funnelRevenueRows = reports[1]?.rows || [];
    let purchaseRevenue = 0;
    if (funnelRevenueRows.length > 0) {
      purchaseRevenue = parseFloat(funnelRevenueRows[0]?.metricValues?.[0]?.value || '0');
    }

    // Build funnel data
    const expectedSteps = ['view_item_list', 'view_item', 'add_to_cart', 'remove_from_cart', 'begin_checkout', 'purchase'];
    const completeFunnel = expectedSteps.map(stepName => {
      const eventCount = eventCountMap[stepName] || 0;
      const revenue = stepName === 'purchase' ? purchaseRevenue : 0;
      // Approximate sessions/users from eventCount for conversion rate calculation
      const sessions = eventCount;
      const conversionRate = sessions > 0 ? (eventCount / sessions) * 100 : 0;

      return {
        step: stepName,
        eventCount,
        revenue,
        sales: stepName === 'purchase' ? eventCount : 0,
        conversionRate,
        totalUsers: eventCount,
      };
    });

    // Parse Report 2: Acquisition Channels
    const acqRows = reports[2]?.rows || [];
    const acquisition = acqRows.map((row: any) => ({
      sourceMedium: row.dimensionValues?.[0]?.value || '(direct) / (none)',
      users: parseInt(row.metricValues?.[0]?.value || '0', 10),
      revenue: parseFloat(row.metricValues?.[1]?.value || '0'),
      sessions: parseInt(row.metricValues?.[2]?.value || '0', 10),
    }));

    // Parse Report 3: Top Pages
    const pageRows = reports[3]?.rows || [];
    const pages = pageRows.map((row: any) => ({
      path: row.dimensionValues?.[0]?.value || '/',
      views: parseInt(row.metricValues?.[0]?.value || '0', 10),
      users: parseInt(row.metricValues?.[1]?.value || '0', 10),
    }));

    // Parse Report 4: Tech & Devices
    const techRows = reports[4]?.rows || [];
    const tech = techRows.map((row: any) => ({
      device: row.dimensionValues?.[0]?.value || 'desktop',
      browser: row.dimensionValues?.[1]?.value || 'Chrome',
      users: parseInt(row.metricValues?.[0]?.value || '0', 10),
      sessions: parseInt(row.metricValues?.[1]?.value || '0', 10),
    }));

    // Parse Report 5: Geo
    const geoRows = reports[5]?.rows || [];
    const geo = geoRows.map((row: any) => ({
      country: row.dimensionValues?.[0]?.value || 'Unknown',
      city: row.dimensionValues?.[1]?.value || 'Unknown',
      users: parseInt(row.metricValues?.[0]?.value || '0', 10),
      newUsers: parseInt(row.metricValues?.[1]?.value || '0', 10),
    }));

    return NextResponse.json({
      funnel: completeFunnel,
      acquisition,
      pages,
      tech,
      geo,
      // GA4 does not support eventCount with the itemName dimension.
      shares: [],
    });
  } catch (error: any) {
    console.error('Error fetching GA4 report batch:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
