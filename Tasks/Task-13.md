# Task 13: Print Templates — Payslips & Payroll Report

## Goal
Verify and wire up the **Print Payslips** (2-per-A4 page) and **Print Report** (landscape A4 table) templates so they work with real data from a closed payroll run.

## Status: `DONE`
## Complexity: 🟢 Easy

---

## Scope

### 13.1 — Verify Payslips Print Template
Component: `src/components/payroll/PayslipsPrintTemplate.tsx`

- This template generates individual payslips laid out 2 per A4 page.
- It reads from the `payroll_slips` data for a given run.
- Each payslip shows: employee name, job title, department, basic salary, overtime, bonus, deduction, advance, net salary.
- Data comes from the `getRunSlips()` service call (Task 11).
- Verify the `react-to-print` integration triggers the browser print dialog correctly.

### 13.2 — Verify Payroll Report Print Template
Component: `src/components/payroll/PayrollReportPrintTemplate.tsx`

- This template generates a landscape-format A4 table summarizing the entire payroll run.
- All employees listed in rows with columns for each salary component.
- Department grouping may apply.
- Same data source as the payslip template.

### 13.3 — Test
1. Close a month (or use an existing closed run).
2. Go to History → click the run → click "Print Payslips".
3. The browser print dialog should open with correctly formatted payslips.
4. Click "Print Report".
5. The browser print dialog should open with the landscape summary table.

---

## Files Touched
| File | Action |
|---|---|
| `src/components/payroll/PayslipsPrintTemplate.tsx` | Verify with real data |
| `src/components/payroll/PayrollReportPrintTemplate.tsx` | Verify with real data |

---

## Acceptance Criteria
- [x] "Print Payslips" opens the browser print dialog with correctly formatted 2-per-page payslips.
- [x] Each payslip shows the correct employee name, job title, salary components, and net salary.
- [x] "Print Report" opens the browser print dialog with a landscape table of all employees.
- [x] The report table totals match the `payroll_runs` record totals.
- [x] Both templates use the denormalized `employee_name` and `employee_job_title` from the slips (not live employee data).

---

## Dependencies
- **Task 11** (run detail + slips are fetchable)
