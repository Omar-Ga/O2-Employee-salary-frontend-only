# Task 5: Employee Management — Add New Employee

## Goal
Wire up the **"Add Employee"** button and drawer so that a new employee can be created in Supabase and appears in the list immediately after submission.

## Status: `COMPLETED`
## Complexity: 🟡 Medium

---

## Scope

### 5.1 — Implement `employee.service.create()`
- `create(data)` → `supabase.from('employees').insert(mappedData).select().single()`.
- Map `camelCase` form data to `snake_case` column names before insert.
- The `grade` field is computed on the frontend from `scores` (performance, dedication, responsibility) before submission. The service stores it as-is.
- The `scores` field is stored as JSONB.
- On success, return the created employee.
- On failure, throw a structured error.

### 5.2 — Verify `AddEmployeeForm.tsx` Integration
- The existing `src/components/employees/AddEmployeeForm.tsx` renders the drawer form.
- It collects: name, email, phone, department (sub-dept selector), jobTitle, monthlySalary, nationalId, workHours, scores (3 fields).
- On submit, it calls `employeeService.create()`.
- After creation, the employee list should refresh (React Query cache invalidation via `queryClient.invalidateQueries`).

### 5.3 — Department Selector
- The "Department" dropdown in the form must show the list of **functional (sub)** departments fetched from Supabase.
- The selected value is the sub-department `id` (UUID).
- Verify this works with the `useDepartments` hook.

### 5.4 — Test the Full Flow
1. Click "Add Employee" on the Employees page.
2. Fill out all required fields.
3. Submit the form.
4. Verify the employee appears in the correct department group.
5. Verify the record is persisted in the Supabase `employees` table.

---

## Files Touched
| File | Action |
|---|---|
| `src/services/employee.service.ts` | Implement `create()` |
| `src/components/employees/AddEmployeeForm.tsx` | Verify integration (likely no changes) |

---

## Acceptance Criteria
- [x] Clicking "Add Employee" opens the drawer with an empty form.
- [x] All required fields (name, phone, department, jobTitle, monthlySalary, nationalId, workHours) are enforced.
- [x] Submitting the form creates the employee in Supabase.
- [x] The new employee immediately appears in the Employees list (grouped correctly).
- [x] The grade is correctly computed from scores and stored.
- [x] A success toast is shown on creation.
- [x] Validation errors or network failures show a visible error message.
- [x] No `any` types are used.

---

## Dependencies
- **Task 4** (employees display is working)
