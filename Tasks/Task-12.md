# Task 12: Revert & Delete Payroll Run (Supabase RPC Functions)

## Goal
Implement the **Revert Payroll** and **Delete Payroll** operations as atomic PostgreSQL functions, and wire the frontend buttons in the run detail view to call them.

## Status: `DONE`
## Complexity: 🔴 Hard

---

## Scope

### 12.1 — Create PostgreSQL Function: `revert_payroll_run(p_run_id UUID)`

Atomic operation:
```
1. Fetch the payroll_runs record by p_run_id.
2. Check that created_at is within the last 10 days. If older → raise exception.
3. Fetch all payroll_slips for this run.
4. For each slip, collect the transaction IDs from the slip's `transactions` array.
5. UPDATE all those transactions: SET is_closed = false (re-open them).
6. DELETE the payroll_runs record (CASCADE will auto-delete all slips).
7. RETURN the count of transactions restored.
```

### 12.2 — Create PostgreSQL Function: `delete_payroll_run(p_run_id UUID)`

Atomic operation (same as revert except step 5):
```
1. Fetch the payroll_runs record by p_run_id.
2. Check that created_at is within the last 10 days. If older → raise exception.
3. Fetch all payroll_slips for this run.
4. For each slip, collect the transaction IDs from the slip's `transactions` array.
5. DELETE all those transactions permanently (instead of re-opening them).
6. DELETE the payroll_runs record (CASCADE will auto-delete all slips).
7. RETURN the count of transactions deleted.
```

### 12.3 — Wire Frontend Service Methods
- `payrollService.revertRun(runId)` → `supabase.rpc('revert_payroll_run', { p_run_id: runId })`.
- `payrollService.deleteRun(runId)` → `supabase.rpc('delete_payroll_run', { p_run_id: runId })`.
- On success, invalidate the payroll runs query cache.
- On error, show the error message via toast.

### 12.4 — Verify Revert Flow
1. Close a month (Task 10).
2. Go to History → click the run → click "Revert Payroll".
3. Confirm the action.
4. The run disappears from History.
5. Navigate to Employees → open a transaction drawer for an employee who had transactions.
6. The transactions that were consumed are now "open" again and visible in the drawer.
7. The Payroll live preview shows them again.

### 12.5 — Verify Delete Flow
1. Close a month.
2. Go to History → click the run → click "Delete Payroll".
3. Confirm the action.
4. The run disappears from History.
5. The consumed transactions are **permanently gone** — they do NOT reappear in the drawer.

### 12.6 — Verify 10-Day Window Enforcement
- Create a run, then manually backdate its `created_at` to > 10 days ago.
- Attempt to revert or delete → should fail with a clear error message.
- The Revert/Delete buttons should also be hidden in the UI for old runs.

---

## Files Touched
| File | Action |
|---|---|
| Supabase Migration | Create `revert_payroll_run` and `delete_payroll_run` PL/pgSQL functions |
| `src/services/payroll.service.ts` | Wire `revertRun()` and `deleteRun()` |

---

## Acceptance Criteria
- [x] Reverting a run deletes the run + slips and re-opens all consumed transactions.
- [x] Deleting a run deletes the run + slips + consumed transactions permanently.
- [x] Both operations are atomic (all-or-nothing).
- [x] Both operations enforce the 10-day window (server-side check, not just frontend).
- [x] The frontend shows confirmation dialogs before revert/delete.
- [x] Success/error toasts are shown.
- [x] After revert, the live preview on the Payroll page reflects the restored transactions.
- [x] After delete, transactions are gone from everywhere.
- [x] No `any` types are used.

---

## Dependencies
- **Task 10** (a payroll run must exist to revert/delete)
- **Task 11** (history view must work to navigate to a run)
