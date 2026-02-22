# Task 17: Dashboard Deduction Rate Implementation

## Overview
This task involved replacing the static placeholder "Average Performance" stat card on the dashboard with a live, data-driven "Deduction Rate" metric. The Deduction Rate provides insight into the percentage of payroll costs lost to deductions and advances, allowing managers to track efficiency and employee financial health.

## Changes

### 1. Backend & Data Layer
- **[payroll.service.ts](file:///d:/coding/O2-Employee-salary-frontend-only/src/services/payroll.service.ts)**:
    - Extended `getLastClosedRunTotal` to return `deductionTotal` (sum of `deductionAmount` and `advanceAmount`) and `grossTotal` (sum of `basicSalary`).
    - This allows for historical trend comparison without re-querying the database.

### 2. State & Hooks
- **[useDashboardStats.ts](file:///d:/coding/O2-Employee-salary-frontend-only/src/hooks/useDashboardStats.ts)**:
    - Implemented `currentDeductionRate`: `(Current Deductions + Current Advances) / Total Gross Payroll`.
    - Implemented `deductionRateChange`: The percentage-point difference compared to the last closed payroll run.
    - Added data-gap logic: If historical data is missing (due to recent schema migrations), the trend gracefully defaults to "N/A" or "First Payout".

### 3. User Interface
- **[Dashboard.tsx](file:///d:/coding/O2-Employee-salary-frontend-only/src/pages/Dashboard.tsx)**:
    - Replaced "Avg. Performance" with the "Deduction Rate" card.
    - **Inverted Trend Logic**: Configured the dashboard to show **Red** for an increase in deduction rate and **Green** for a decrease.
    - Updated icons to use `LuTrendingDown`.

### 4. Internationalization (i18n)
- **[dashboard.json](file:///d:/coding/O2-Employee-salary-frontend-only/public/locales/en/dashboard.json)** & **[dashboard.json](file:///d:/coding/O2-Employee-salary-frontend-only/public/locales/ar/dashboard.json)**:
    - Implemented **Robust Flattening**: Created root-level keys (`deductionRateLabel`, `sinceLastDeduction`, `noDeductions`) to ensure reliable key resolution and bypass potential nesting or caching issues in the browser.

## Verification
- Verified that the "Deduction Rate" reflects current `transactions`.
- Verified trend comparison against the last closed `payroll_run`.
- Verified that trend colors respond correctly (Up = Red, Down = Green).
- Confirmed correct Arabic and English display after flattening keys.
