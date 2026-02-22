# Task 15: PDF Payslip Generation Integration

## Overview
This task involved implementing a high-fidelity, bilingual PDF payslip generation system for historical payroll runs. The primary goal was to allow managers to print/download beautifully formatted A4 slips where each page is split into two halves (one employee per half-A4), supporting both English and Arabic with perfect RTL alignment and accurate financial breakdowns.

## 1. Library Selection: `react-to-print`
### Strategy
Instead of using complex PDF primitive libraries (like `react-pdf/renderer`) which often struggle with complex Arabic RTL joining and font embedding, we chose **`react-to-print`**.
- **Reasoning**: It leverages the browser's own rendering engine and Chakra UI's CSS to ensure 100% fidelity to the premium design system. It provides native, flawless Arabic RTL support without the need for custom font kit wrappers.

## 2. Technical Implementation

### A. Print Template (`PayslipsPrintTemplate.tsx`)
Created a dedicated, hidden-rendered component that handles the A4 layout:
- **Grid Layout**: Uses a `210mm x 297mm` container with a `50%` height split for each slip.
- **Dynamic Content**:
    - **Header**: SKYCOURT branding with localized titles.
    - **Employee Details**: Displays name, job title, and the specific payroll period.
    - **Financial Breakdown**: A localized grid showing:
        - **Basic Salary**: The fixed package amount.
        - **Net Salary**: Highlighted in green with a border.
        - **Itemized Ledger**: A breakdown section that always shows **Overtime**, **Bonus**, **Deduction**, and **Advance**, even if the value is zero, to ensure layout consistency.
    - **Snapshotted Accuracy**: The logic doesn't just show integers; it multiplies raw units (Hours/Days) by the `hourlyRate` and `dailyRate` (calculated from Basic Salary) stored in the slip record at the time of closing. This ensures historical accuracy even if an employee's salary changes later.

### B. RTL & Localization
- **Bi-directional Support**: The template detects the current `i18n` language and automatically applies `dir="rtl"` and mirrored CSS layouts.
- **Numbers & Symbols**: Implemented `dir="ltr"` for financial figures within Arabic mode to ensure signs like `+` and `-` and currency symbols remain correctly aligned with the numbers.
- **Units**: Transaction rows now display raw units in parentheses (e.g., `(5 Hours)`) to provide total transparency to the employee.

### C. UI Integration
- **Payroll Page**: Updated the History tab to include a "Print Payslips" button on each closed run card.
- **HistoryRunCard**: Modularized the card to handle its own print reference and trigger the print dialog using `useReactToPrint`.

## 3. Files Modified/Created
- `src/components/payroll/PayslipsPrintTemplate.tsx`: Core A4 layout and PDF logic.
- `src/pages/Payroll.tsx`: Integration of the print trigger and card refactor.
- `src/services/payroll.service.ts`: Updated `getHistory` to expand transaction relations for detailed breakdowns.
- `public/locales/en/payroll.json` & `public/locales/ar/payroll.json`: Added comprehensive `payslip` and `units` translation namespaces.

## 4. Verification Results
- [x] A4 Split: Confirmed exactly 2 slips per page with a dashed cut-line.
- [x] Arabic RTL: Confirmed layouts flip correctly and Arabic text joins perfectly.
- [x] Snapshot Accuracy: Tested with Overtime (Hours) and Deductions (Days); cash values match the `Net Salary` delta exactly.
- [x] Empty States: Transactions with $0 value now show explicitly instead of disappearing.
- [x] Official Stamp: Positioned correctly in both LTR and RTL modes.

---
