# GA4 Dashboard Zero Data Bugfix Design

## Overview

The GA4AnalyticsDashboard component successfully authenticates with Google Analytics 4 using service account credentials (property ID 552600412) and receives HTTP 200 responses from the batchRunReports API. However, all batch report responses contain empty rows arrays (`reports[n]?.rows || []`), resulting in zero values displayed across all dashboard metrics: revenue, sales, visitors, conversion rates, acquisition channels, page views, device/browser data, and geographic data.

This bug prevents administrators from accessing analytics insights for business intelligence and decision-making. The fix must identify why batchRunReports returns empty data despite successful authentication and ensure the API returns populated reports when actual GA4 event data exists for the last 30 days.

The approach will focus on systematically verifying: (1) service account permissions in GCP IAM, (2) property ID configuration accuracy, (3) data stream setup and event tracking implementation, and (4) API request parameter correctness including date ranges, dimension/metric compatibility, and filter syntax.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when batchRunReports API calls succeed with authentication but return empty rows arrays for all batch report requests
- **Property (P)**: The desired behavior when GA4 property contains actual event data - batchRunReports should return populated rows arrays with dimension values and metric values
- **Preservation**: Existing error handling, loading states, data parsing logic, and UI behavior that must remain unchanged by the fix
- **batchRunReports**: The Google Analytics Data API v1 method that executes multiple report requests in a single batch call
- **BetaAnalyticsDataClient**: The Node.js client from `@google-analytics/data` package that authenticates and makes API requests to GA4
- **propertyId**: The GA4 property identifier (552600412) passed as `properties/${propertyId}` to the API
- **rows array**: The array of result rows returned in each report response, where each row contains dimensionValues and metricValues
- **Service Account**: The GCP IAM identity (accessoires-exclusifs@accessoires-exclusifs.iam.gserviceaccount.com) used for server-to-server authentication
- **Data Stream**: The GA4 configuration that collects events from a specific platform (web, iOS, Android)
- **Event**: A user interaction tracked in GA4 (e.g., view_item_list, add_to_cart, purchase)

## Bug Details

### Bug Condition

The bug manifests when the `/api/analytics` route successfully authenticates with GA4 credentials and calls `client.batchRunReports()`, but all report responses contain empty rows arrays. The API returns HTTP 200 with valid response structure (reports array exists), but `reports[0]?.rows`, `reports[1]?.rows`, etc. all evaluate to empty arrays `[]`, causing all dashboard metrics to display as zero.

**Formal Specification:**
```
FUNCTION isBugCondition(apiResponse)
  INPUT: apiResponse of type BatchRunReportsResponse
  OUTPUT: boolean
  
  RETURN apiResponse.statusCode == 200
         AND apiResponse.reports IS NOT NULL
         AND apiResponse.reports.length > 0
         AND FOR ALL report IN apiResponse.reports:
             (report.rows IS NULL OR report.rows.length == 0)
         AND NO error messages in apiResponse
END FUNCTION
```

### Examples

- **Funnel Events (Report 0)**: Request for eventName dimension with eventCount metric filtered to funnel events returns `reports[0]?.rows = []`, resulting in `eventCountMap` being empty and all funnel steps showing 0 events
- **Acquisition Channels (Report 2)**: Request for sessionSourceMedium dimension with activeUsers, purchaseRevenue, sessions metrics returns `reports[2]?.rows = []`, resulting in empty acquisition table with no source/medium data
- **Top Pages (Report 3)**: Request for pagePathPlusQueryString dimension with screenPageViews and activeUsers metrics returns `reports[3]?.rows = []`, resulting in no page view data displayed
- **Geographic Data (Report 5)**: Request for country and city dimensions with activeUsers and newUsers metrics returns `reports[5]?.rows = []`, resulting in empty geo table with "Aucune localisation disponible" message

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- When GA4 credentials are missing or invalid, the system must continue to return a 500 error response with message "Missing GA4 configuration variables."
- When BetaAnalyticsDataClient authentication fails, the system must continue to catch errors and return JSON response with error message and 500 status code
- When the dashboard component is loading, it must continue to display the loading spinner with "Traitement batch des rapports Google Analytics 4…" message
- When an API error occurs, the dashboard must continue to display the error UI with AlertCircle icon and error message
- The shares array must continue to return empty by design since GA4 does not support eventCount with itemName dimension
- Private key formatting must continue to replace escaped newlines (\\n) with actual newline characters before passing to BetaAnalyticsDataClient
- Batch report processing must continue to iterate through requests in chunks of 5 and aggregate all reports into a single response array
- Funnel data mapping must continue to include all six expected steps (view_item_list, view_item, add_to_cart, remove_from_cart, begin_checkout, purchase) in the response even if some steps have zero event counts

**Scope:**
All inputs and scenarios where authentication actually fails, credentials are invalid, or the API returns error responses should be completely unaffected by this fix. This includes:
- Missing environment variables scenarios
- Invalid service account credentials
- Network failures or API timeouts
- Malformed API requests that return error responses

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Service Account Permissions Insufficient**: The service account `accessoires-exclusifs@accessoires-exclusifs.iam.gserviceaccount.com` may lack the "Viewer" role or "Read & Analyze" permissions on the GA4 property 552600412 in Google Cloud IAM. Even with valid authentication, insufficient permissions cause the API to return empty data rather than an authorization error.

2. **Property ID Mismatch or Wrong Property Type**: The property ID "552600412" might be a Universal Analytics (UA) property ID rather than a GA4 property ID. GA4 property IDs typically have 9-10 digits and start with numbers like "12345678" or "23456789012", while UA properties use "UA-XXXXXX-Y" format. The API may accept the request but return empty data because the property type is incompatible with GA4 Data API.

3. **No Data Stream Configured or Events Not Tracked**: The GA4 property 552600412 may not have a properly configured data stream (web, iOS, or Android), or the website/app is not successfully sending events to GA4. Without event data collection, batchRunReports will return empty rows even though the API call succeeds. The tracking code (gtag.js with measurement ID G-LZ9Y34PNZP) may not be linked to property 552600412.

4. **Date Range Contains No Data**: The date range "30daysAgo" to "today" may be a period where no events were tracked. If the GA4 property was created recently or event tracking started less than 30 days ago, there may be insufficient historical data. This is especially likely if the property or data stream was set up after the development started.

5. **Dimension/Metric Incompatibility or Filter Issues**: The API requests may use dimension/metric combinations that are incompatible or dimension filters that exclude all data. For example, filtering for specific eventName values that were never tracked, or requesting metrics that require e-commerce events when e-commerce tracking isn't implemented. The GA4 Data API silently returns empty results for invalid queries rather than error messages.

6. **Property-Level Data Retention Settings**: The GA4 property may have data retention set to a very short period (e.g., 2 months minimum), and if combined with other issues, historical data may have been deleted before the API queries it.

## Correctness Properties

Property 1: Bug Condition - Populated Reports When Data Exists

_For any_ batchRunReports API call where the service account has proper permissions, the property ID is valid, the data stream is configured, events are being tracked, and the date range contains actual event data, the fixed implementation SHALL return report responses with non-empty rows arrays containing dimensionValues and metricValues that accurately reflect the GA4 property's event data.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

Property 2: Preservation - Error Handling and UI States Unchanged

_For any_ input where GA4 credentials are missing/invalid, authentication fails, or API returns error responses (isBugCondition returns false), the fixed code SHALL produce exactly the same behavior as the original code, preserving all error handling logic, loading states, error UI displays, and fallback behaviors including the 500 error response format and dashboard error component rendering.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct (most likely a combination of service account permissions and property configuration):

**File**: `app/api/analytics/route.ts`

**Function**: `GET` handler

**Specific Changes**:

1. **Add Diagnostic Logging**: Insert console.log statements before and after `client.batchRunReports()` to capture the raw API response, including response structure, reports array length, and whether rows arrays are empty. This will help confirm the root cause during testing.

2. **Verify Property ID Format**: Add validation to check if `propertyId` is numeric and has appropriate length for GA4 (typically 9-12 digits). Log a warning if the format seems incorrect or if it resembles a UA property ID pattern.

3. **Add Metadata Inspection**: Request the `property` metadata using GA4 Admin API or log the property string being sent to identify if the property exists and is accessible. This can be done by attempting a simpler query first (e.g., requesting only activeUsers metric with no dimensions).

4. **Enhance Error Response**: When all reports return empty rows, instead of silently returning zero data, add a conditional check that logs or returns a warning message indicating potential configuration issues: "GA4 property returned empty data - verify property ID, service account permissions, and data stream configuration."

5. **Test with Simplified Query**: Add a fallback or test query that requests only basic metrics (like activeUsers) with no dimensions or filters to isolate whether the issue is with complex queries vs. fundamental data access.

**File**: Documentation or Configuration Check (Manual Steps)

**Service Account Permissions Verification**:
1. Navigate to Google Cloud Console → IAM & Admin → IAM
2. Verify `accessoires-exclusifs@accessoires-exclusifs.iam.gserviceaccount.com` has "Viewer" role on the project
3. Navigate to Google Analytics Admin → Property Access Management
4. Verify the service account email has "Viewer" or "Administrator" role on property 552600412

**Property ID Verification**:
1. Navigate to Google Analytics Admin → Property Settings
2. Confirm the Property ID matches "552600412" exactly
3. Verify this is a GA4 property (not Universal Analytics)
4. Check the linked data streams and confirm at least one is active

**Data Stream and Event Tracking Verification**:
1. Navigate to Admin → Data Streams → Select the web/app stream
2. Verify Measurement ID (should match G-LZ9Y34PNZP from .env.local)
3. Use GA4 DebugView or Realtime report to confirm events are being received
4. Check that e-commerce events (purchase, add_to_cart, etc.) are being tracked with correct parameters

**Date Range Data Verification**:
1. Navigate to GA4 Reports → Realtime or Engagement → Events
2. Confirm events exist for the last 30 days
3. Check the "First data received" date in Property Settings to ensure data history covers 30 days

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code by inspecting the raw API responses, then verify the fix works correctly by confirming populated reports are returned when configuration issues are resolved, and verify existing error handling is preserved.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis by examining the actual API response structure, checking GCP IAM permissions, verifying property ID validity, and testing with simplified queries.

**Test Plan**: Add extensive logging to `app/api/analytics/route.ts` to capture the complete batchRunReports response. Run the API endpoint on the UNFIXED code and examine: (1) the raw response object structure, (2) whether `reports` array exists and its length, (3) whether each `report.rows` is null or empty array, (4) any error or warning fields in the response. Simultaneously verify GCP IAM permissions and GA4 property configuration manually.

**Test Cases**:
1. **Raw Response Inspection Test**: Add `console.log('BatchRunReports Response:', JSON.stringify(allReports, null, 2))` after the batch API call and examine the output in server logs (will fail/show empty rows on unfixed code)
2. **Property Metadata Test**: Make a test API call to request property metadata or a simple activeUsers metric with no dimensions to verify basic property access (will fail/return empty if property is inaccessible)
3. **Service Account Permissions Test**: Manually verify in GCP Console that the service account has "Viewer" role on the project and property (may fail/reveal missing permissions)
4. **Property ID Validation Test**: Manually check in GA4 Admin that property "552600412" exists and is a GA4 property (not UA), and that the service account email is listed in Property Access Management (may fail/reveal property mismatch)
5. **Data Stream Verification Test**: Manually check GA4 Admin → Data Streams to confirm a stream is active and Measurement ID G-LZ9Y34PNZP is correctly linked (may fail/reveal no data collection)
6. **Realtime Data Test**: Use GA4 Realtime report to confirm events are currently being received (will fail if event tracking is broken)

**Expected Counterexamples**:
- All reports return with `rows: []` or `rows: undefined` despite status 200 response
- Possible causes: service account not listed in Property Access Management, property ID is a UA property, data stream not sending events, or no historical data for the date range

### Fix Checking

**Goal**: Verify that for all API calls where the bug condition holds (authentication succeeds but configuration is correct), the fixed implementation produces populated report responses with non-empty rows arrays.

**Pseudocode:**
```
FOR ALL api_call WHERE isBugCondition(api_call.response) AND configuration_is_correct(api_call) DO
  result := GET_fixed('/api/analytics')
  ASSERT result.status == 200
  ASSERT result.data.funnel IS NOT EMPTY
  ASSERT result.data.funnel[5].step == 'purchase'
  ASSERT result.data.funnel[5].eventCount >= 0
  ASSERT IF ga4_has_purchase_events THEN result.data.funnel[5].eventCount > 0
  ASSERT result.data.acquisition.length > 0 IF ga4_has_traffic_data
  ASSERT result.data.pages.length > 0 IF ga4_has_pageview_data
END FOR
```

**Testing Approach**: After fixing configuration issues (granting service account permissions, verifying property ID, ensuring data stream is active), make API calls to `/api/analytics` and verify:
1. The response status is 200
2. The funnel array contains 6 elements with correct step names
3. At least one funnel step has eventCount > 0 (if GA4 contains event data)
4. The acquisition, pages, tech, and geo arrays are populated (if GA4 contains corresponding data)
5. Metric values (revenue, users, sessions) match values visible in GA4 UI reports

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (authentication fails, credentials missing, or API returns errors), the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL api_call WHERE NOT isBugCondition(api_call.response) DO
  // Test scenarios where credentials are invalid or missing
  ASSERT GET_original('/api/analytics', missing_credentials) = GET_fixed('/api/analytics', missing_credentials)
  ASSERT response.status == 500
  ASSERT response.error == 'Missing GA4 configuration variables.'
END FOR

FOR ALL ui_state WHERE error_occurred DO
  // Test that error UI continues to display correctly
  ASSERT dashboard_original(error_state) = dashboard_fixed(error_state)
  ASSERT error_ui.displays_AlertCircle == true
  ASSERT error_ui.shows_error_message == true
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (missing variables, invalid keys, network errors)
- It catches edge cases that manual unit tests might miss (e.g., partially invalid credentials)
- It provides strong guarantees that behavior is unchanged for all error scenarios

**Test Plan**: Observe behavior on UNFIXED code first for error scenarios (missing env vars, invalid service account key, network failures), then write property-based tests capturing that exact error handling behavior. Verify the fixed code maintains identical error responses, status codes, and UI rendering.

**Test Cases**:
1. **Missing Credentials Preservation**: Set `GOOGLE_CLIENT_EMAIL` to undefined, verify both original and fixed code return 500 error with "Missing GA4 configuration variables."
2. **Invalid Private Key Preservation**: Set `GOOGLE_PRIVATE_KEY` to an invalid key, verify both versions catch authentication error and return 500 with error message
3. **Loading State Preservation**: Verify the dashboard component displays loading spinner with "Traitement batch des rapports Google Analytics 4…" during API call in both versions
4. **Error UI Preservation**: Simulate API error and verify both versions display AlertCircle icon, error title "Synchronisation GA4 échouée", and error message with environment variable instructions
5. **Shares Array Preservation**: Verify both versions return empty shares array `[]` with comment explaining GA4 limitation
6. **Private Key Formatting Preservation**: Test that both versions correctly replace `\\n` with `\n` in the private key before creating BetaAnalyticsDataClient
7. **Batch Chunking Preservation**: Verify both versions process requests in chunks of 5 and aggregate all reports correctly

### Unit Tests

- Test service account credential validation (missing clientEmail, missing privateKey, missing propertyId)
- Test private key formatting (escaped newlines converted to actual newlines)
- Test batch chunking logic (6 requests split into 2 chunks of 5 and 1)
- Test report parsing for each report type (funnel events, funnel revenue, acquisition, pages, tech, geo)
- Test edge cases (empty reports array, null rows, missing metricValues, invalid dimension values)
- Test error handling (API throws error, invalid response format)

### Property-Based Tests

- Generate random configurations (valid/invalid credentials, present/missing env vars) and verify error handling is consistent
- Generate random API responses with varying structures (empty reports, null rows, missing fields) and verify parsing handles all cases without crashing
- Test that date range parameters are correctly formatted for various date inputs
- Test that dimension filters are correctly structured for the GA4 API (inListFilter, stringFilter)

### Integration Tests

- Test full flow: valid credentials → API call → populated reports → dashboard displays non-zero metrics
- Test error flow: invalid credentials → API call → error response → dashboard displays error UI
- Test loading flow: API call in progress → loading spinner displays → response received → spinner disappears
- Test data transformation: GA4 API response format → parsed funnel/acquisition/pages/tech/geo arrays → dashboard renders tables and charts
- Test with GA4 Demo Account property (if available) to verify against known good data
