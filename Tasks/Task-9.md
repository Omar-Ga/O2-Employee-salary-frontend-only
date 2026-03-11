# Task 9: Payroll Live Preview — Show Projected Salaries Before Closing

## Goal
Wire up the **Payroll page's "Current Run" tab** to display a **live preview** of what each employee's net salary would be if payroll were closed right now — by fetching employees + their open transactions and computing projections on the frontend.

## Status: `COMPLETED`
## Complexity: 🟡 Medium

---

## Why This Comes Before Close Month
The live preview is what the user sees and validates *before* they click "Close Month". It must be working and visually correct first. This is purely a frontend computation — no new backend endpoint is needed.

---

## Scope

### 9.1 — Verify `payrollService.calculateSlip()` 
The existing `src/services/payroll.service.ts` already has a `calculateSlip()` function that takes an employee and their transactions and computes:
- `overtimeAmount`, `bonusAmount`, `deductionAmount`, `advanceAmount`
- `netSalary = basicSalary + (overtime + bonus) - (deduction + advance)`

This is a **pure frontend computation** for the live preview. Verify it works correctly with real data.

> ⚠️ Note: The existing `toCash()` function in `payroll.service.ts` uses `monthlySalary / 30` for daily rate, but the operational guide says it should be `monthlySalary / 27`. This should be corrected using a constant from `src/lib/constants.ts`.

### 9.2 — Verify Data Fetching on Payroll Page
The `Payroll.tsx` page needs to:
1. Fetch all active employees via `employeeService.getAllActive()`.
2. Fetch all open transactions via `transactionService.getForEmployees(employeeIds)`.
3. For each employee, call `payrollService.calculateSlip(employee, theirTransactions)` to compute the projected slip.
4. Display the results grouped by department hierarchy.

This flow likely already exists in the frontend code — verify it works with real Supabase data instead of mocks.

### 9.3 — Verify `DepartmentPayrollGroup.tsx`
Each department group card should show:
- Employee name, job title
- Basic Salary
- Additions (overtime + bonus sum)
- Deductions (deduction + advance sum)
- Net Salary

### 9.4 — Test
1. Ensure at least 2-3 employees exist with open transactions.
2. Navigate to `/payroll`.
3. The live preview should show each employee's projected net salary.
4. Verify the math: if an employee has salary 10000, overtime of 5 hours, and work_hours = 270, then overtime value = 5 × (10000/270) ≈ 185.19.

---

## Files Touched
| File | Action |
|---|---|
| `src/services/payroll.service.ts` | Fix daily rate constant (27 not 30) |
| `src/lib/constants.ts` (new) | Add `WORKING_DAYS_PER_MONTH = 27` |
| `src/pages/Payroll.tsx` | Verify live preview logic with real data |

---

## Acceptance Criteria
- [x] The Payroll page "Current Run" tab shows all active employees with their projected salaries.
- [x] Employees are grouped by parent department → sub-department.
- [x] Each card shows: basic salary, additions, deductions, net salary.
- [x] The projection math is correct (verified manually for at least one employee).
- [x] The daily rate uses the constant 27 (not 30).
- [x] Employees with no transactions show net salary = basic salary.
- [x] The projection updates if you go to Employees, add a transaction, and come back to Payroll.
- [x] No `any` types are used.

---

## Dependencies
- **Task 4** (employees are fetchable)
- **Task 7** (transactions are fetchable)
