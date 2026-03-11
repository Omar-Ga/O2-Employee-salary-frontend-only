# Task 6: Employee Management — Edit, Archive & Restore

## Goal
Complete the remaining employee CRUD: **editing an existing employee**, **archiving** (soft delete), and **restoring** from the Archived tab.

## Status: `COMPLETED`
## Complexity: 🟢 Easy

---

## Scope

### 6.1 — Implement `employee.service.update()`
- `update(id, data)` → `supabase.from('employees').update(mappedData).eq('id', id).select().single()`.
- Map `camelCase` fields to `snake_case`.
- On success, return the updated employee.

### 6.2 — Implement `employee.service.softDelete()`
- `softDelete(id)` → `supabase.from('employees').update({ is_archived: true, archive_date: new Date().toISOString() }).eq('id', id).select().single()`.

### 6.3 — Implement `employee.service.restore()`
- `restore(id)` → `supabase.from('employees').update({ is_archived: false, archive_date: null }).eq('id', id).select().single()`.

### 6.4 — Verify Edit Flow
1. Click the "Edit" button on an employee card.
2. The drawer opens pre-populated with the employee's existing data.
3. Change one or more fields.
4. Submit.
5. The employee card updates immediately with the new data.

### 6.5 — Verify Archive Flow
1. Click the "Archive" action on an employee card.
2. Confirm the action (if a confirmation dialog exists).
3. The employee disappears from the "Active" tab.
4. Switch to the "Archived" tab.
5. The employee appears there.

### 6.6 — Verify Restore Flow
1. On the "Archived" tab, click "Restore" on an archived employee.
2. The employee disappears from the Archived tab.
3. Switch to "Active" — the employee is back.

---

## Files Touched
| File | Action |
|---|---|
| `src/services/employee.service.ts` | Implement `update()`, `softDelete()`, `restore()` |

---

## Acceptance Criteria
- [x] Editing an employee persists changes to Supabase and updates the UI.
- [x] Archiving an employee sets `is_archived = true` and removes them from the Active tab.
- [x] Archived employees appear in the "Archived" tab.
- [x] Restoring an employee sets `is_archived = false` and moves them back to Active.
- [x] Archived employees do NOT appear in the Active employee list.
- [x] All operations show success/error toasts.
- [x] No `any` types are used.

---

## Dependencies
- **Task 5** (employee creation works — we need employees to edit/archive)
