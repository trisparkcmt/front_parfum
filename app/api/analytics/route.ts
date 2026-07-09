import { NextResponse } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

export async function GET() {
  const propertyId = process.env.GA_PROPERTY_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  // Fallback mock data for testing or when credentials are not yet set
  if (!propertyId || !clientEmail || !privateKey) {
    console.warn("[GA4 API] Google Analytics credentials or property ID are missing in environment. Returning mock data.");
    
    // Generate mock data for the last 7 days
    const mockData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD format
      
      // Random but realistic looking active users & views
      const users = Math.floor(Math.random() * 40) + 90;
      const views = Math.floor(users * (Math.random() * 1.2 + 2));
      
      return {
        date: dateStr,
        users,
        views,
      };
    });

    return NextResponse.json({ data: mockData, isMock: true });
  }

  try {
    const analyticsClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
    });

    const [response] = await analyticsClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [
        { name: "activeUsers" },
        { name: "screenPageViews" }
      ],
      dimensions: [{ name: "date" }],
    });

    const chartData = response.rows?.map((row) => ({
      date: row.dimensionValues?.[0]?.value || "",
      users: Number(row.metricValues?.[0]?.value) || 0,
      views: Number(row.metricValues?.[1]?.value) || 0,
    })) || [];

    // Sort by date YYYYMMDD ascending
    chartData.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ data: chartData, isMock: false });
  } catch (error: any) {
    console.error("Analytics Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics", message: error.message }, { status: 500 });
  }
}
