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

    // Vercel sometimes injects literal surrounding quotes into the env var string
    let formattedPrivateKey = privateKey;
    if (formattedPrivateKey.startsWith('"') && formattedPrivateKey.endsWith('"')) {
      formattedPrivateKey = formattedPrivateKey.slice(1, -1);
    }
    // Handle both literal '\n' string and actual newlines
    formattedPrivateKey = formattedPrivateKey.split('\\n').join('\n');

    const client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: clientEmail.trim(),
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
      // 2. Acquisition Channels
      {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionSourceMedium' }],
        metrics: [
          { name: 'activeUsers' },
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
      // 6. Country totals for the interactive world map
      {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'country' }, { name: 'countryId' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'newUsers' },
        ],
        orderBys: [
          {
            metric: { metricName: 'activeUsers' },
            desc: true,
          },
        ],
      },
    ];

    const chunkSize = 5;
    const allReports: any[] = [];
    for (let i = 0; i < requests.length; i += chunkSize) {
      const chunk: any[] = requests.slice(i, i + chunkSize);
      const batchResult: any = await (client.batchRunReports({
        property: `properties/${propertyId}`,
        requests: chunk,
      } as any) as any);
      const batchResponse: any = Array.isArray(batchResult) ? batchResult[0] : batchResult;
      allReports.push(...(batchResponse.reports || []));
    }

    const reports = allReports;

    // DEBUG: Log the raw response structure
    console.log('=== GA4 API Debug ===');
    console.log('Total reports received:', reports.length);
    console.log('Report 0 (Funnel Events) structure:', JSON.stringify(reports[0], null, 2));
    console.log('Report 0 rows count:', reports[0]?.rows?.length || 0);
    console.log('Report 1 (Acquisition) rows count:', reports[1]?.rows?.length || 0);
    console.log('Report 2 (Pages) rows count:', reports[2]?.rows?.length || 0);
    console.log('Report 3 (Tech) rows count:', reports[3]?.rows?.length || 0);
    console.log('Report 4 (Geo) rows count:', reports[4]?.rows?.length || 0);
    console.log('Report 5 (Country totals) rows count:', reports[5]?.rows?.length || 0);

    // Parse Report 0: Funnel Event Counts
    const funnelEventRows = reports[0]?.rows || [];
    const eventCountMap: Record<string, number> = {};
    funnelEventRows.forEach((row: any) => {
      const step = row.dimensionValues?.[0]?.value || '';
      const eventCount = parseInt(row.metricValues?.[0]?.value || '0', 10);
      console.log(`Funnel step: ${step}, eventCount: ${eventCount}`);
      eventCountMap[step] = eventCount;
    });

    // Build funnel data
    const expectedSteps = ['view_item_list', 'view_item', 'add_to_cart', 'remove_from_cart', 'begin_checkout', 'purchase'];
    const completeFunnel = expectedSteps.map(stepName => {
      const eventCount = eventCountMap[stepName] || 0;
      // Approximate sessions/users from eventCount for conversion rate calculation
      const sessions = eventCount;
      const conversionRate = sessions > 0 ? (eventCount / sessions) * 100 : 0;

      return {
        step: stepName,
        eventCount,
        conversionRate,
        totalUsers: eventCount,
      };
    });

    // Parse Report 1: Acquisition Channels
    const acqRows = reports[1]?.rows || [];
    const acquisition = acqRows.map((row: any) => {
      let sourceMedium = row.dimensionValues?.[0]?.value || '(direct) / (none)';
      if (sourceMedium === '(not set)') sourceMedium = 'Inconnu';
      
      return {
        sourceMedium,
        users: parseInt(row.metricValues?.[0]?.value || '0', 10),
        sessions: parseInt(row.metricValues?.[1]?.value || '0', 10),
      };
    });

    // Parse Report 2: Top Pages
    const pageRows = reports[2]?.rows || [];
    const pages = pageRows.map((row: any) => {
      let path = row.dimensionValues?.[0]?.value || '/';
      if (path === '(not set)') path = 'Inconnu';
      
      return {
        path,
        views: parseInt(row.metricValues?.[0]?.value || '0', 10),
        users: parseInt(row.metricValues?.[1]?.value || '0', 10),
      };
    });

    // Parse Report 3: Tech & Devices
    const techRows = reports[3]?.rows || [];
    const tech = techRows.map((row: any) => {
      let device = row.dimensionValues?.[0]?.value || 'desktop';
      let browser = row.dimensionValues?.[1]?.value || 'Chrome';
      
      if (device === '(not set)') device = 'Inconnu';
      if (browser === '(not set)') browser = 'Inconnu';
      
      return {
        device,
        browser,
        users: parseInt(row.metricValues?.[0]?.value || '0', 10),
        sessions: parseInt(row.metricValues?.[1]?.value || '0', 10),
      };
    });

    // Parse Report 4: Geo
    const geoRows = reports[4]?.rows || [];
    const geo = geoRows
      .map((row: any) => {
        let country = row.dimensionValues?.[0]?.value || 'Inconnu';
        let city = row.dimensionValues?.[1]?.value || 'Inconnu';
        
        if (country === '(not set)') country = 'Inconnu';
        if (city === '(not set)') city = 'Inconnu';

        return {
          country,
          city,
          users: parseInt(row.metricValues?.[0]?.value || '0', 10),
          newUsers: parseInt(row.metricValues?.[1]?.value || '0', 10),
        };
      })
      // Optional: If you prefer to completely hide unknown locations, 
      // you could uncomment the following filter:
      // .filter((item) => item.country !== 'Inconnu');

    // Parse Report 5: Country totals used by the map
    const countryRows = reports[5]?.rows || [];
    const countryGeo = countryRows
      .map((row: any) => {
        let country = row.dimensionValues?.[0]?.value || 'Inconnu';
        const countryId = row.dimensionValues?.[1]?.value || '';

        if (country === '(not set)') country = 'Inconnu';

        return {
          country,
          countryId: countryId.toLowerCase(),
          users: parseInt(row.metricValues?.[0]?.value || '0', 10),
          newUsers: parseInt(row.metricValues?.[1]?.value || '0', 10),
        };
      })
      .filter((item: { countryId: string }) => item.countryId);

    const responseData = {
      funnel: completeFunnel,
      acquisition,
      pages,
      tech,
      geo,
      countryGeo,
      // GA4 does not support eventCount with the itemName dimension.
      shares: [],
    };

    console.log('Final response summary:');
    console.log('- Funnel steps:', completeFunnel.length);
    console.log('- Acquisition channels:', acquisition.length);
    console.log('- Pages:', pages.length);
    console.log('- Tech entries:', tech.length);
    console.log('- Geo locations:', geo.length);
    console.log('- Country totals:', countryGeo.length);
    console.log('=== End GA4 Debug ===');

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error fetching GA4 report batch:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
