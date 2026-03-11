# Task 2: Database Schema — Create All Tables in Supabase (Departments, Employees, Transactions, Payroll)

## Goal
Create the full PostgreSQL schema in Supabase that mirrors the data structures the frontend expects, using proper types, constraints, foreign keys, and RLS policies.

## Status: `COMPLETED`
## Complexity: 🔴 Hard

---

## Why This Is Second
The service files need tables to query. We need the schema in place before any CRUD operations can work.

---

## Scope

### 2.1 — Create `departments` Table
```sql
- id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
- name         TEXT NOT NULL
- type         TEXT NOT NULL CHECK (type IN ('structural', 'functional'))
- parent_id    UUID REFERENCES departments(id) ON DELETE SET NULL
- color_palette TEXT DEFAULT 'gray'
- created_at   TIMESTAMPTZ DEFAULT now()
- updated_at   TIMESTAMPTZ DEFAULT now()
```
- `structural` = parent department (e.g., Finance, Operations)
- `functional` = sub-department that employees belong to
- `parent_id` is NULL for root departments, references another department for sub-departments.

### 2.2 — Create `employees` Table
```sql
- id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
- name            TEXT NOT NULL
- email           TEXT
- phone           TEXT NOT NULL
- department      UUID NOT NULL REFERENCES departments(id)
- job_title       TEXT NOT NULL
- monthly_salary  NUMERIC NOT NULL DEFAULT 5000
- national_id     TEXT NOT NULL
- work_hours      NUMERIC NOT NULL DEFAULT 270
- grade           TEXT CHECK (grade IN ('Excellent', 'Good', 'Bad'))
- scores          JSONB
- is_archived     BOOLEAN DEFAULT false
- archive_date    TIMESTAMPTZ
- created_at      TIMESTAMPTZ DEFAULT now()
- updated_at      TIMESTAMPTZ DEFAULT now()
```

### 2.3 — Create `transactions` Table
```sql
- id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
- employee_id  UUID NOT NULL REFERENCES employees(id)
- category     TEXT NOT NULL CHECK (category IN ('overtime', 'bonus', 'deduction', 'advance'))
- type         TEXT NOT NULL CHECK (type IN ('addition', 'deduction'))
- amount       NUMERIC NOT NULL
- unit         TEXT NOT NULL CHECK (unit IN ('hours', 'days', 'cash'))
- reason       TEXT
- date         TIMESTAMPTZ DEFAULT now()
- is_closed    BOOLEAN DEFAULT false
- created_at   TIMESTAMPTZ DEFAULT now()
- updated_at   TIMESTAMPTZ DEFAULT now()
```

### 2.4 — Create `payroll_runs` Table
```sql
- id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
- period           TEXT NOT NULL UNIQUE  -- Format: 'YYYY-MM'
- date             TIMESTAMPTZ DEFAULT now()
- total_basic      NUMERIC DEFAULT 0
- total_net        NUMERIC DEFAULT 0
- total_deductions NUMERIC DEFAULT 0
- employee_count   INTEGER DEFAULT 0
- created_at       TIMESTAMPTZ DEFAULT now()
- updated_at       TIMESTAMPTZ DEFAULT now()
```
- `period` has a UNIQUE constraint (one run per month).

### 2.5 — Create `payroll_slips` Table
```sql
- id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
- payroll_run_id    UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE
- employee_id       UUID NOT NULL REFERENCES employees(id)
- department_id     UUID NOT NULL
- employee_name     TEXT NOT NULL         -- Denormalized snapshot
- employee_job_title TEXT NOT NULL        -- Denormalized snapshot
- basic_salary      NUMERIC NOT NULL
- overtime_amount   NUMERIC DEFAULT 0
- bonus_amount      NUMERIC DEFAULT 0
- deduction_amount  NUMERIC DEFAULT 0
- advance_amount    NUMERIC DEFAULT 0
- net_salary        NUMERIC NOT NULL
- transactions      UUID[] DEFAULT '{}'   -- Array of consumed transaction IDs
- created_at        TIMESTAMPTZ DEFAULT now()
- updated_at        TIMESTAMPTZ DEFAULT now()
```
- CASCADE delete on `payroll_run_id`: deleting a run deletes all its slips.

### 2.6 — Enable Row Level Security (RLS)
- Enable RLS on all tables.
- Create policies that allow authenticated users full CRUD access (since this is an internal HR tool with a single role).

### 2.7 — Seed Initial Department Data
Insert the department hierarchy that matches the frontend's hardcoded structure (from the original `departments.ts`). This requires confirming the exact department names and hierarchy with the existing frontend.

### 2.8 — Generate TypeScript Types
- Run `generate_typescript_types` from the Supabase MCP tool to get auto-generated types.
- Save these to `src/types/supabase.ts`.
- Update `src/types/index.ts` to derive the app-level types from the generated Supabase types.

---

## Important Notes
- Column names use `snake_case` in the database (PostgreSQL convention).
- The frontend currently uses `camelCase`. The service layer will handle the mapping.
- The `scores` field on employees is stored as JSONB: `{ performance: number, dedication: number, responsibility: number }`.

---

## Files Touched
| File | Action |
|---|---|
| Supabase Dashboard / Migration | Create 5 tables |
| `src/types/supabase.ts` (new) | Auto-generated types |
| `src/types/index.ts` | Refactor to use Supabase types |

---

## Acceptance Criteria
- [x] All 5 tables exist in the Supabase database with correct columns, types, and constraints.
- [x] `departments` table has seed data matching the frontend hierarchy.
- [x] `payroll_runs.period` has a UNIQUE constraint.
- [x] `payroll_slips` cascade-deletes when their parent run is deleted.
- [x] RLS is enabled on all tables with appropriate policies.
- [x] TypeScript types are generated and saved to `src/types/supabase.ts`.
- [x] `src/types/index.ts` is updated to use the new types (no more PocketBase `BaseSystemFields`).

---

## Dependencies
- **Task 1** (Supabase client must exist to run migrations and generate types).
