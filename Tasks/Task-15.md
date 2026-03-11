# Task 15: End-to-End Smoke Test — Full Payroll Cycle

## Goal
Perform a **complete end-to-end test** of the entire payroll lifecycle to verify everything works together as a cohesive system. This is not a coding task — it's a **manual QA pass**.

## Status: `COMPLETED` ✅
## Complexity: 🟡 Medium

---

## The Full Cycle Test

### Step 1: Fresh Start
- [x] Log out, clear browser storage, log back in with real credentials.
- [x] Verify session persists on refresh.

### Step 2: Department Setup
- [x] Go to Settings → Departments.
- [x] Verify the department hierarchy is displayed.
- [x] Add a new sub-department. Verify it persists.

### Step 3: Employee Creation
- [x] Go to Employees.
- [x] Add 3 employees across different departments.
- [x] Verify they appear in the correct department groups.
- [x] Verify grade auto-calculation from scores.

### Step 4: Transactions
- [x] Add an overtime transaction (5 hours) to Employee 1.
- [x] Add a bonus transaction (500 cash) to Employee 2.
- [x] Add a deduction transaction (2 days) to Employee 3.
- [x] Verify all transactions appear in each employee's drawer.
- [x] Bulk-select Employee 1 and 2 → add a bonus of 200 cash to both.
- [x] Verify both employees now have the additional bonus transaction.

### Step 5: Live Payroll Preview
- [x] Go to Payroll → "Current Run" tab.
- [x] Verify all 3 employees show with correct projected net salaries.
- [x] Manually verify the math for at least one employee.

### Step 6: Close the Month
- [x] Click "Close Month" → select current month → confirm.
- [x] Verify success toast.
- [x] Verify the run appears in History.

### Step 7: Verify Post-Close State
- [x] Go back to Payroll "Current Run" — employees should show net = basic (no open transactions).
- [x] Go to Employees → open each employee's transaction drawer — no open transactions visible.
- [x] Verify: in the database, all consumed transactions have `is_closed = true`.

### Step 8: History & Print
- [x] Go to History → click the closed run.
- [x] Verify all 3 employees' slips with correct amounts.
- [x] Click "Print Payslips" — verify print dialog opens with formatted payslips.
- [x] Click "Print Report" — verify print dialog opens with report table.

### Step 9: Revert
- [x] Click "Revert Payroll" on the run.
- [x] Verify the run is gone from History.
- [x] Verify transactions are re-opened (visible in employee drawers again).
- [x] Verify the live preview shows them again.

### Step 10: Re-Close & Delete
- [x] Close the same month again (should work since revert removed the run).
- [x] Go to History → click the run → click "Delete Payroll".
- [x] Verify the run is gone.
- [x] Verify transactions are permanently deleted (not in drawers).

### Step 11: Dashboard
- [x] Go to Dashboard.
- [x] Verify stats reflect the current state accurately.

### Step 12: Archive & Restore
- [x] Archive one employee.
- [x] Verify they disappear from Active tab and from the Payroll preview.
- [x] Close a month — verify the archived employee does NOT get a payslip.
- [x] Restore the employee — verify they're back.

---

## Acceptance Criteria
- [x] All 12 steps pass without errors, blank screens, or broken UI.
- [x] All financial calculations are correct.
- [x] All UI states are consistent with backend state.
- [x] Error handling works (try duplicate month close, invalid inputs).
- [x] Session management works (refresh doesn't log out, logout redirects to login).

---

## Dependencies
- **All previous tasks (1–14)** must be completed.

