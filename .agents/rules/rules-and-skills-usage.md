---
trigger: always_on
---

# Rules & Skills Usage Guide

## Part 1: Conditional Rules (Model Decision)

### `frontend-rules`
**Activate on:** any UI task — component, page, modal, drawer, form, button, table, layout, style, design, look, feel.
**Do NOT activate for:** data fetching, service logic, TypeScript types, SQL, migrations.

**Mandatory 6-step workflow:**
1. Read `frontend-design` skill for aesthetic direction
2. `mcp_chakra-ui_list_components` — check if native component exists
3. `mcp_chakra-ui_get_component_example` / `get_component_props` — read API before coding
4. `mcp_chakra-ui_get_theme` — never hardcode design tokens
5. `mcp_chakra-ui_customize_theme` — theme overrides only, no raw CSS
6. `mcp_chakra-ui_v2_to_v3_code_review` — validate against deprecated v2 patterns

---

### `supabase-rules`
**Activate on:** table, schema, migration, RLS, policy, query, auth, edge function, types, supabase, SQL.
**Do NOT activate for:** pure UI work, skill management.

**Mandatory 7-step workflow:**
1. `list_projects` + `get_project` — confirm active project
2. `list_tables` (verbose: true) — inspect real schema before writing SQL
3. `apply_migration` — ALL DDL goes here, never `execute_sql` for schema changes
4. `execute_sql` — SELECT queries and data inspection only
5. `generate_typescript_types` — after every migration, update the types file
6. `get_advisors` (security + performance) — after every migration
7. `get_logs` — before speculating on any backend error

---

## Part 2: Skills

| Skill | Purpose | Trigger |
|---|---|---|
| `frontend-design` | Premium UI, aesthetic direction | build, design, component, page, style, UI |
| `supabase-admin` | Schema, RLS, migrations, auth triggers | RLS, migration, schema, policy, auth.uid(), table |
| `postgresql-code-review` | SQL quality audit, index/type/JSONB review | review, optimize, anti-pattern, JSONB, index |
| `systematic-debugging` | Root-cause analysis before any fix | bug, error, broken, not working, unexpected |
| `universal-skills-manager` | Find, install, sync AI skills | install skill, find skill, sync skill |

### `frontend-design`
Use for any visual output. **Not for** data fetching or business logic.
> "Add a payroll modal" / "Redesign the employee card" / "Make the dashboard more premium"

### `supabase-admin`
Use for Supabase schema, RLS policies, migrations, PL/pgSQL, auth triggers. **Not for** SQL quality review (use `postgresql-code-review` after) or frontend SDK.
> "Add RLS to transactions" / "Add `department_id` column" / "Set up `on_auth_user_created` trigger"

### `postgresql-code-review`
Use for SQL auditing — types, indexes, ENUMs, JSONB, CHECK constraints, triggers. **Not for** initial schema creation (use `supabase-admin` first).
> "Review this migration for anti-patterns" / "Should this be an ENUM?" / "Audit for missing indexes"

### `systematic-debugging`
⚠️ **Iron Law: invoke BEFORE any fix, no exceptions.** Root cause first, always.
> "Drawer isn't showing data" / "RLS blocks everyone" / "Salary returns wrong numbers"

### `universal-skills-manager`
Use to find, install, or sync skills across AI tools. Requires Python 3 + network access.
> "Find a code review skill" / "Install adversarial-coach" / "Sync skills to Gemini"

---

## Part 3: Combined Flows

### Flow A — New UI Feature
```
frontend-rules → frontend-design → build with Chakra MCP
```
*Example: payroll modal → check Chakra Modal component → apply aesthetic direction → build*

### Flow B — Full-Stack Feature (DB + UI)
```
supabase-rules → supabase-admin → postgresql-code-review → supabase-rules → frontend-rules → frontend-design
```
*Example: `payroll_runs` table → write migration + RLS → audit SQL → generate types + advisors → build UI*

### Flow C — Backend Bug
```
systematic-debugging → supabase-rules (get_logs) → supabase-admin (fix) → postgresql-code-review (validate fix)
```
*Example: RLS returns empty → check pg_policies → fix auth.uid() subquery → confirm fix is indexed*

### Flow D — Frontend Bug
```
systematic-debugging → frontend-rules → frontend-design
```
*Example: preview shows NaN → trace API shape → fix null handling in component*

### Flow E — Schema Audit
```
supabase-rules (get_advisors) → supabase-admin (RLS check) → postgresql-code-review (full audit)
```

### Flow F — Install a New Skill
```
universal-skills-manager → update this file to document the new skill
```

---

## Part 4: Quick Decision Reference

| Scenario | Activate |
|---|---|
| UI element, page, component | `frontend-rules` + `frontend-design` |
| DB schema, RLS, migration, types | `supabase-rules` + `supabase-admin` → `postgresql-code-review` |
| Full-stack (table + page) | Flow B |
| Anything broken | `systematic-debugging` FIRST → then relevant rule + skill |
| Find/install a skill | `universal-skills-manager` |

---

## Part 5: Principles

1. **`systematic-debugging` is always first** for broken behavior — no fix without root cause.
2. **`frontend-rules` + `frontend-design` are inseparable** — rule governs tooling, skill governs aesthetics.
3. **`supabase-rules` + `supabase-admin` are inseparable** — rule governs MCP workflow, skill governs SQL design.
4. **`supabase-admin` then `postgresql-code-review`** — build it, then harden it.
5. **Debug first, then build** — data model and root cause must be resolved before new UI or schema work.
6. **Default flow: Debug → Backend → SQL Audit → Frontend.**