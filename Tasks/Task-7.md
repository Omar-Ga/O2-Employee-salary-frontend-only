# Task 7: Transaction Engine — Single Employee Transactions (Create, View, Delete)

## Goal
Wire up the **Transaction Drawer** so that a user can **add a transaction** (overtime, bonus, deduction, advance) to a single employee, **view existing open transactions**, and **delete** individual transactions.

## Status: `COMPLETE`
## Complexity: 🟡 Medium

---

## Scope

### 7.1 — Rewrite `src/services/transaction.service.ts`

Replace all mock methods:

- `getAll(page, perPage, employeeId?)` → Fetch transactions, optionally filtered by `employeeId`.
- `getOpen(page, perPage)` → Fetch all transactions where `is_closed = false`.
- `getForEmployees(employeeIds)` → Fetch all open transactions for a list of employee IDs. Used by the payroll live preview.
  ```ts
  supabase.from('transactions')
    .select('*')
    .in('employee_id', employeeIds)
    .eq('is_closed', false)
  ```
- `create(data)` → Insert a single transaction record.
- `delete(id)` → Hard-delete a transaction by ID.

### 7.2 — Column Mapping
Database columns: `employee_id`, `is_closed`.
Frontend expects: `employeeId`, `isClosed`.
Apply the same mapping strategy used in previous tasks.

### 7.3 — Verify Transaction Drawer — Single Employee Mode
The component is `src/components/transactions/TransactionDrawer.tsx`.

Test flow:
1. On the Employees page, click the ⋮ menu on an employee card → "Add Transaction".
2. The drawer opens showing the employee's name and current basic salary.
3. Select a category (Overtime / Bonus / Deduction / Advance).
4. Enter an amount and select a unit (hours / days / cash).
5. The **live projection** shows the estimated net salary impact (this is a frontend-only calculation — no backend call).
6. Submit the transaction.
7. The transaction appears in the "existing open transactions" list at the bottom of the drawer.

### 7.4 — Verify Viewing Open Transactions
- The bottom half of the drawer shows all open transactions (`is_closed = false`) for that employee.
- Each shows category icon, amount, and unit.

### 7.5 — Verify Deleting a Transaction
- Click the trash icon on a transaction in the drawer.
- The transaction is permanently deleted from Supabase.
- It disappears from the list immediately.

---

## Files Touched
| File | Action |
|---|---|
| `src/services/transaction.service.ts` | Full rewrite with Supabase calls |
| `src/components/transactions/TransactionDrawer.tsx` | Verify integration (likely minimal changes) |

---

## Acceptance Criteria
- [x] Opening the Transaction Drawer for an employee shows their name and basic salary.
- [x] Selecting a category and submitting creates a transaction record in Supabase.
- [x] The new transaction appears in the drawer's "open transactions" list immediately.
- [x] The transaction record has correct `employee_id`, `category`, `type`, `amount`, `unit`, `is_closed = false`.
- [x] The `type` field is correctly derived: `overtime` and `bonus` → `addition`; `deduction` and `advance` → `deduction`.
- [x] The live salary projection updates in real-time as the user types (frontend-only, no API call).
- [x] Deleting a transaction removes it from Supabase and the UI.
- [x] Error handling: failed creates/deletes show error toasts.
- [x] No `any` types are used.

---

## Dependencies
- **Task 5** (employees exist to attach transactions to)
- **Task 2** (transactions table exists)
