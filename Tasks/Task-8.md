# Task 8: Bulk Transactions — Apply One Transaction to Multiple Employees

## Goal
Wire up the **bulk transaction** flow where a user selects multiple employees via checkboxes, clicks "Add Transaction" from the floating action bar, and applies the same transaction to all selected employees at once.

## Status: `COMPLETED`
## Complexity: 🟢 Easy

---

## Scope

### 8.1 — Implement `transaction.service.createBulk()`
- `createBulk(data[])` → Insert multiple transaction records in a single batch.
- Use `supabase.from('transactions').insert(dataArray).select()` to batch insert.
- Each entry in the array has a different `employee_id` but the same `category`, `type`, `amount`, `unit`.

### 8.2 — Verify Bulk Selection UI
On the Employees page:
1. Checkboxes appear on employee cards.
2. Selecting 1+ employees shows the floating action bar at the bottom.
3. Clicking "Add Transaction" in the action bar opens the Transaction Drawer in **bulk mode**.

### 8.3 — Verify Bulk Drawer Behavior
In bulk mode:
- The existing transactions list is **hidden** (since it's per-employee specific).
- The projection banner shows a summary like "This bonus will be applied to N employees".
- Submitting creates one transaction per selected employee.

### 8.4 — Test
1. Select 3 employees.
2. Open the transaction drawer from the action bar.
3. Add an overtime transaction of 5 hours.
4. Submit.
5. Verify that 3 separate transaction records were created in the Supabase `transactions` table, one per employee.

---

## Files Touched
| File | Action |
|---|---|
| `src/services/transaction.service.ts` | Implement `createBulk()` |
| `src/components/transactions/TransactionDrawer.tsx` | Verify bulk mode works |

---

## Acceptance Criteria
- [x] Selecting multiple employees shows the floating action bar.
- [x] Opening the drawer from the bar triggers bulk mode (no existing transactions list shown).
- [x] Submitting creates one transaction per selected employee in the database.
- [x] All created transactions have `is_closed = false`.
- [x] A success toast confirms the number of transactions created.
- [x] The employee selection is cleared after successful submission.
- [x] No `any` types are used.

---

## Dependencies
- **Task 7** (single transaction creation works)
