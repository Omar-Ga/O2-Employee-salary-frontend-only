# Task 10: Close Month — The Core Payroll Run (Supabase Edge Function)

## Goal
Implement the **"Close Month"** operation as a **Supabase Edge Function** that atomically processes payroll: creates the run, generates slips, marks transactions as closed, and updates totals. Wire the frontend's "Close Payroll" button to call this function.

## Status: `COMPLETED`
## Complexity: 🔴 Hard

---

## Why an Edge Function?
Per the migration guide's architectural laws:
- The operation MUST be **atomic** (`BEGIN...COMMIT` transaction)
- The operation MUST compute salaries **server-side** (the frontend's projection is just an estimate)
- All multi-step writes must happen in a single transaction block

Supabase Edge Functions (or a PostgreSQL function called via RPC) can achieve this. An `rpc` call to a PostgreSQL function is the simplest approach for atomicity.

---

## Scope

### 10.1 — Create a PostgreSQL Function: `close_payroll_run(p_period TEXT)`

This function performs the entire close-month operation atomically:

```
1. Validate `p_period` is provided (non-empty).
2. Check no existing `payroll_runs` record has this `period`. If exists → raise exception.
3. Fetch all employees where `is_archived = false`.
4. Fetch all transactions where `is_closed = false` AND `employee_id` IN (active employee IDs).
5. Insert a new `payroll_runs` record with the given period → capture `run_id`.
6. For each active employee:
   a. Compute hourlyRate = monthly_salary / work_hours
   b. Compute dailyRate = monthly_salary / 30
   c. For each of their open transactions, compute cash value based on unit.
   d. Sum by category: overtime, bonus, deduction, advance.
   e. netSalary = basic_salary + (overtime + bonus) - (deduction + advance)
   f. INSERT into payroll_slips (with denormalized employee_name, employee_job_title).
   g. Accumulate run totals.
7. UPDATE all consumed transactions: SET is_closed = true.
8. UPDATE the payroll_runs record with totals (total_basic, total_net, total_deductions, employee_count).
9. RETURN the run_id.
```

All steps inside a single `BEGIN...COMMIT` block (implicit in a PL/pgSQL function).

### 10.2 — Wire Frontend `payrollService.closeMonth()`
- `closeMonth(period)` → `supabase.rpc('close_payroll_run', { p_period: period })`.
- On success, return `{ success: true, runId }`.
- On error (e.g., duplicate month), surface the error message to the user via toast.

### 10.3 — Verify the Close Month Dialog
On the Payroll page:
1. Click "Close Month".
2. A dialog appears with a month/year picker (defaulting to current month).
3. Click "Close Payroll".
4. The API is called.
5. On success: the page refreshes and the run appears in the History tab.
6. On duplicate attempt: a clear error message is shown.

### 10.4 — Test Atomicity
- Manually verify: after a successful close, all consumed transactions have `is_closed = true`.
- Manually verify: the `payroll_slips` records exist with correct math.
- Manually verify: the `payroll_runs` totals are correct.

---

## Files Touched
| File | Action |
|---|---|
| Supabase Migration | Create `close_payroll_run` PL/pgSQL function |
| `src/services/payroll.service.ts` | Wire `closeMonth()` to `supabase.rpc()` |

---

## Acceptance Criteria
- [x] Clicking "Close Month" → confirming → triggers the server-side payroll run.
- [x] A `payroll_runs` record is created with the correct period and totals.
- [x] One `payroll_slips` record is created per active employee.
- [x] Each slip has correct `basic_salary`, `overtime_amount`, `bonus_amount`, `deduction_amount`, `advance_amount`, `net_salary`.
- [x] Each slip has denormalized `employee_name` and `employee_job_title`.
- [x] All consumed transactions are marked `is_closed = true`.
- [x] Attempting to close the same month twice returns a clear error (unique constraint on period).
- [x] The entire operation is atomic — if any step fails, nothing is persisted.
- [x] The frontend shows a success toast and navigates to history on completion.
- [x] No `any` types are used.

---

## Dependencies
- **Task 2** (all tables exist)
- **Task 4** (employees are fetchable)
- **Task 7** (transactions exist to be consumed)
- **Task 9** (live preview works — so the user knows what to expect before closing)
