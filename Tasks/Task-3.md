# Task 3: Department Management — Settings Page CRUD

## Goal
Wire up the **Settings → Departments** tab so that departments are fetched from Supabase and displayed. CRUD operations (create, rename, delete, reorder) work against the real database.

## Status: `COMPLETED`
## Complexity: 🟢 Easy

---

## Why This Is Third
Departments must exist and be fetchable before employees can be created (since employees require a `department` FK). This also validates that the Supabase client, RLS policies, and the service-layer architecture all work end-to-end for the first time.

---

## Scope

### 3.1 — Rewrite `src/services/department.service.ts`
Replace all mock/stub methods with real Supabase calls:

- `getAll()` → `supabase.from('departments').select('*')` — returns all departments.
- `create(data)` → `supabase.from('departments').insert(data).select().single()`.
- `update(id, data)` → `supabase.from('departments').update(data).eq('id', id).select().single()`.
- `delete(id)` → `supabase.from('departments').delete().eq('id', id)`.

### 3.2 — Verify `useDepartments` Hook
- The existing `src/hooks/useDepartments.ts` fetches departments and transforms them into `DepartmentConfig[]` (parent → children hierarchy).
- It filters by `type = 'structural'` for roots and `type = 'functional'` for sub-departments.
- Verify this works correctly with the real data from Supabase after the service is wired up.

### 3.3 — Handle Column Name Mapping
The database uses `snake_case` (e.g., `parent_id`, `color_palette`) but the frontend types expect `camelCase` (`parentId`, `colorPalette`). Handle this mapping in the service layer. Options:
- Map manually in the service.
- OR use Supabase's column rename feature in `.select()`.
- The chosen approach must be consistent across ALL services going forward.

### 3.4 — Test the Settings Page
- Navigate to `/settings/departments`.
- Departments should display in the tree/list view.
- Adding a new parent department should persist.
- Adding a new sub-department under a parent should persist.
- Renaming a department should persist.
- Deleting a department should persist (with appropriate safety — can't delete if employees exist under it).

---

## Files Touched
| File | Action |
|---|---|
| `src/services/department.service.ts` | Rewrite with Supabase calls |
| `src/hooks/useDepartments.ts` | Verify / minor fixes |
| `src/types/index.ts` | Verify `DepartmentsResponse` type alignment |

---

## Acceptance Criteria
- [x] Navigating to `/settings/departments` displays the seeded department hierarchy.
- [x] Adding a parent department (structural) creates it in the database and shows it on screen.
- [x] Adding a sub-department (functional) under a parent creates it and shows it nested correctly.
- [x] Renaming a department updates the name in the database.
- [x] Deleting a department removes it from the database and the UI.
- [x] The `useDepartments` hook correctly transforms flat department data into the `DepartmentConfig[]` hierarchy.
- [x] No `any` types are used.

---

## Dependencies
- **Task 1** (Supabase client)
- **Task 2** (departments table exists with seed data)
