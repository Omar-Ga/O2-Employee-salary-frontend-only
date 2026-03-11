# Task 11: Payroll History — View Past Runs & Run Detail

## Goal
Wire up the **Payroll History tab** to display a paginated list of past closed payroll runs, and allow clicking a run to see its full breakdown (all slips grouped by department).

## Status: `COMPLETED`
## Complexity: 🟢 Easy

---

## Scope

### 11.1 — Implement `payrollService.getRuns()`
- `getRuns(page, perPage)` → Fetch `payroll_runs` ordered by `date DESC` with pagination.
- Return shape: `ListResult<PayrollRun>` with `{ page, perPage, totalItems, totalPages, items }`.
- Use Supabase `.range()` and `{ count: 'exact' }`.

### 11.2 — Implement `payrollService.getRunSlips()`
- `getRunSlips(runId)` → Fetch all `payroll_slips` where `payroll_run_id = runId`.
- Return as `PayrollSlip[]`.
- These slips contain denormalized `employee_name` and `employee_job_title` — no need to join employees.

### 11.3 — Verify History Tab (Run List)
Navigate to `/payroll` → "History" tab:
- Displays paginated cards for each past run.
- Each card shows: period (e.g., "March 2026"), run date, totalBasic, totalNet, employeeCount, "Closed" badge.
- Pagination works (10 per page).

### 11.4 — Verify Run Detail View
Click a run card:
- Shows full breakdown grouped by department hierarchy (same layout as live preview).
- Each employee slip card shows: name, job title, basic salary, overtime, bonus, deduction, advance, net salary.
- The component is `src/components/payroll/HistoricalDepartmentPayrollGroup.tsx`.

### 11.5 — Verify Detail View Header Buttons
The detail view should show:
- **Print Payslips** button (functionality tested in Task 13)
- **Print Report** button (functionality tested in Task 13)
- **Revert Payroll** button (functionality tested in Task 12)
- **Delete Payroll** button (functionality tested in Task 12)
- Revert and Delete should only be visible if the run is within 10 days of creation.

---

## Files Touched
| File | Action |
|---|---|
| `src/services/payroll.service.ts` | Implement `getRuns()`, `getRunSlips()` |
| `src/pages/Payroll.tsx` | Verify history tab integration |

---

## Acceptance Criteria
- [x] The History tab shows a list of past payroll runs.
- [x] Each run card shows period, date, totalBasic, totalNet, employeeCount.
- [x] Clicking a run card shows the full slip breakdown grouped by department.
- [x] Each slip shows employee name, job title, basic salary, all components, net salary.
- [x] Pagination works correctly.
- [x] Runs are ordered by date (newest first).
- [x] "Revert" and "Delete" buttons appear only for runs < 10 days old.
- [x] No `any` types are used.

---

## Dependencies
- **Task 10** (at least one payroll run must have been closed to see history)
