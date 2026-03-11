# Task 4: Employee Management — Display Active Employees

## Goal
Wire up the Employees page so that **active employees are fetched from Supabase and displayed**, grouped by parent department → sub-department, using the existing UI components.

## Status: `COMPLETED`
## Complexity: 🟢 Easy

---

## Why This Is Fourth
Now that departments exist and are fetchable, we can display employees. This is read-only — we're just proving the data flow works before allowing writes.

---

## Scope

### 4.1 — Rewrite `src/services/employee.service.ts` — Read Methods Only
Replace mock methods with real Supabase queries:

- `getAll(page, perPage)` → Fetch all employees with pagination.
- `getActive(page, perPage)` → Fetch employees where `is_archived = false` with pagination.
- `getAllActive()` → Fetch all non-archived employees (no pagination — used by payroll).

**Important:** Return shape must match the existing `ListResult<Employee>` interface used by the frontend:
```ts
{ page, perPage, totalItems, totalPages, items: Employee[] }
```
Use Supabase's `.range()` for pagination and a separate count query (or `{ count: 'exact' }` option).

### 4.2 — Handle `snake_case` → `camelCase` Mapping
The database has `monthly_salary`, `work_hours`, `job_title`, `national_id`, `is_archived`, `archive_date`.
The frontend expects `monthlySalary`, `workHours`, `jobTitle`, `nationalId`, `isArchived`, `archiveDate`.

Apply the same mapping strategy chosen in Task 3.

### 4.3 — Verify Employees Page — Active Tab
- Navigate to `/employees`.
- The "Active" tab should display employees fetched from Supabase.
- Employees should be grouped by parent department (the grouping logic is on the frontend in `Employees.tsx` and `DepartmentGroup.tsx`).
- Each employee card should show: name, job title, department badge, grade badge.

### 4.4 — Seed Test Employees (if needed)
If no employees exist, manually insert 3-5 test employees across different departments via Supabase SQL or dashboard, to verify the display.

---

## Files Touched
| File | Action |
|---|---|
| `src/services/employee.service.ts` | Rewrite read methods |
| `src/types/index.ts` | Verify `Employee` / `EmployeesResponse` alignment |

---

## Acceptance Criteria
- [x] Navigating to `/employees` displays real employees from Supabase.
- [x] Employees are grouped by parent department → sub-department.
- [x] Each employee card shows name, job title, grade.
- [x] The "Active" tab only shows employees where `is_archived = false`.
- [x] Loading state is visible while data is being fetched.
- [x] Empty state is shown if no employees exist.
- [x] No `any` types are used.

---

## Dependencies
- **Task 1** (Supabase client)
- **Task 2** (employees table)
- **Task 3** (departments are fetchable — needed for grouping)
