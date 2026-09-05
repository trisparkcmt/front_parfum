# Bugfix Requirements Document

## Introduction

The GA4AnalyticsDashboard component displays zero data for all metrics (revenue, sales, conversions, visitors, funnel events, acquisition channels, pages, devices, and geo data) despite having properly configured Google Analytics 4 credentials. The dashboard loads successfully without throwing errors or displaying error messages to the user, but all charts, tables, and KPI cards remain empty with zero values.

This bug prevents administrators from viewing critical analytics data needed for business decisions, e-commerce funnel analysis, and ROI tracking. The issue manifests when the dashboard fetches data from the `/api/analytics` route, which uses the Google Analytics Data API v1 with service account authentication to batch-process six reports covering funnel events, acquisition, pages, devices, and geo metrics.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the GA4AnalyticsDashboard component loads and the `/api/analytics` route is called THEN the system returns empty reports with zero rows despite valid credentials being configured

1.2 WHEN the API route constructs batch report requests for funnel events, acquisition channels, pages, tech/devices, and geo data THEN the system receives responses with empty `rows` arrays resulting in all metrics displaying as zero

1.3 WHEN the dashboard processes the API response data THEN the system displays Revenue: 0 FCFA, Sales: 0, Conversion: 0%, Visitors: 0, AOV: 0 FCFA in KPI cards

1.4 WHEN the dashboard attempts to render the funnel chart THEN the system displays an empty bar chart with no event counts for view_item_list, view_item, add_to_cart, begin_checkout, or purchase events

1.5 WHEN the dashboard attempts to populate acquisition channels, pages, devices, and geo tables THEN the system displays empty tables or "No channels available", "No pages available", "No locations available" messages

1.6 WHEN API batch requests fail to retrieve data from GA4 property '552600412' THEN the system does not display error messages to the user and silently returns zero values

### Expected Behavior (Correct)

2.1 WHEN the GA4AnalyticsDashboard component loads and the `/api/analytics` route is called with valid credentials and property ID THEN the system SHALL successfully retrieve real GA4 data from the last 30 days with non-empty report rows

2.2 WHEN the API route constructs batch report requests for funnel events, acquisition channels, pages, tech/devices, and geo data with correct dimensions, metrics, and filters THEN the system SHALL receive responses containing actual tracking data rows

2.3 WHEN the dashboard processes the API response data with populated rows THEN the system SHALL display accurate non-zero metrics for Revenue, Sales, Conversion Rate, Visitors, and AOV in KPI cards reflecting real analytics

2.4 WHEN the dashboard renders the funnel chart with valid event data THEN the system SHALL display a populated bar chart showing actual event counts for all funnel steps (view_item_list, view_item, add_to_cart, begin_checkout, purchase)

2.5 WHEN the dashboard populates acquisition channels, pages, devices, and geo tables with real data THEN the system SHALL display actual source/medium combinations, page paths, device categories, browsers, countries, and cities with their respective metrics

2.6 WHEN API requests encounter authentication errors, permission issues, or invalid property IDs THEN the system SHALL display clear error messages indicating the specific failure (e.g., "Service account lacks permissions", "Invalid GA4 property ID", "Authentication failed")

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the dashboard displays the error state for API failures THEN the system SHALL CONTINUE TO show the error card with AlertCircle icon, error title, error message, and environment variable hints

3.2 WHEN the dashboard is in loading state during API calls THEN the system SHALL CONTINUE TO display the spinner with "Traitement batch des rapports Google Analytics 4…" loading message

3.3 WHEN the user clicks "View all browsers", "View all channels", "View all pages", or "View all locations" buttons THEN the system SHALL CONTINUE TO open the appropriate modal with expanded data

3.4 WHEN the dashboard receives data with some empty sections (e.g., no shares data) THEN the system SHALL CONTINUE TO gracefully handle missing sections and display available data for other reports

3.5 WHEN the user switches between French and English languages THEN the system SHALL CONTINUE TO display all labels, headers, and messages in the selected language

3.6 WHEN the API route formats the GOOGLE_PRIVATE_KEY by replacing `\\n` with actual newlines THEN the system SHALL CONTINUE TO perform this transformation for proper service account authentication

3.7 WHEN the dashboard calculates derived metrics (conversion rate, AOV) from funnel data THEN the system SHALL CONTINUE TO use the same formulas and display zero for division-by-zero cases

3.8 WHEN the API route batches requests in chunks of 5 to avoid rate limits THEN the system SHALL CONTINUE TO execute batch requests sequentially and aggregate all reports
