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

    const [batchResponse] = await client.batchRunReports({
      property: `properties/${propertyId}`,
      requests: [
        // 1. Funnel & KPI Totals
        {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'eventName' }],
          metrics: [
            { name: 'purchaseRevenue' },
            { name: 'eventCount' },
            { name: 'activeUsers' },
            { name: 'sessions' },
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
        // 2. Acquisition Channels
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
      ],
    });

    const reports = batchResponse.reports || [];

    // Parse Report 1: Funnel
    const funnelRows = reports[0]?.rows || [];
    const funnelData = funnelRows.map((row: any) => {
      const step = row.dimensionValues?.[0]?.value || '';
      const revenue = parseFloat(row.metricValues?.[0]?.value || '0');
      const eventCount = parseInt(row.metricValues?.[1]?.value || '0', 10);
      const totalUsers = parseInt(row.metricValues?.[2]?.value || '0', 10);
      const sessions = parseInt(row.metricValues?.[3]?.value || '0', 10);
      const conversionRate = sessions > 0 ? (eventCount / sessions) * 100 : 0;

      return {
        step,
        eventCount,
        revenue,
        sales: step === 'purchase' ? eventCount : 0,
        conversionRate,
        totalUsers,
      };
    });

    // Ensure all expected funnel steps are present
    const expectedSteps = ['view_item_list', 'view_item', 'add_to_cart', 'remove_from_cart', 'begin_checkout', 'purchase'];
    const completeFunnel = expectedSteps.map(stepName => {
      const found = funnelData.find(d => d.step === stepName);
      if (found) return found;
      return {
        step: stepName,
        eventCount: 0,
        revenue: 0,
        sales: 0,
        conversionRate: 0,
        totalUsers: 0,
      };
    });

    // Parse Report 2: Acquisition Channels
    const acqRows = reports[1]?.rows || [];
    const acquisition = acqRows.map((row: any) => ({
      sourceMedium: row.dimensionValues?.[0]?.value || '(direct) / (none)',
      users: parseInt(row.metricValues?.[0]?.value || '0', 10),
      revenue: parseFloat(row.metricValues?.[1]?.value || '0'),
      sessions: parseInt(row.metricValues?.[2]?.value || '0', 10),
    }));

    // Parse Report 3: Top Pages
    const pageRows = reports[2]?.rows || [];
    const pages = pageRows.map((row: any) => ({
      path: row.dimensionValues?.[0]?.value || '/',
      views: parseInt(row.metricValues?.[0]?.value || '0', 10),
      users: parseInt(row.metricValues?.[1]?.value || '0', 10),
    }));

    // Parse Report 4: Tech & Devices
    const techRows = reports[3]?.rows || [];
    const tech = techRows.map((row: any) => ({
      device: row.dimensionValues?.[0]?.value || 'desktop',
      browser: row.dimensionValues?.[1]?.value || 'Chrome',
      users: parseInt(row.metricValues?.[0]?.value || '0', 10),
      sessions: parseInt(row.metricValues?.[1]?.value || '0', 10),
    }));

    // Parse Report 5: Geo
    const geoRows = reports[4]?.rows || [];
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
    });
  } catch (error: any) {
    console.error('Error fetching GA4 report batch:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
