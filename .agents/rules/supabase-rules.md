---
trigger: model_decision
description: When working on anything backend-related — database schema, queries, migrations, authentication, storage, edge functions, or TypeScript types. Always use Supabase MCP tools before writing any backend code or SQL.
---

Always Use Supabase MCP as the Exclusive BaaS

## Directive

**Supabase is the sole backend-as-a-service (BaaS) for this project.** For any task involving the database, authentication, storage, edge functions, or data fetching, you MUST use the **Supabase MCP server** (`supabase-mcp-server`) and its tools as the primary interface. Never assume, guess, or hardcode database state — always query it through MCP.

---

## Mandatory Workflow for Any Backend or Data Task

1. **Identify the active project first.** Before any database or backend operation, call `mcp_supabase-mcp-server_list_projects` to confirm the correct project, and `mcp_supabase-mcp-server_get_project` to verify it is active and not paused.

2. **Inspect the schema before writing queries or migrations.** Call `mcp_supabase-mcp-server_list_tables` (with `verbose: true` for detailed column/FK info) on the relevant schemas before writing any SQL, service layer code, or TypeScript types. Never assume columns or relationships exist.

3. **Use `apply_migration` for all DDL changes.** Any schema change (creating tables, adding columns, creating indexes, enabling RLS, etc.) MUST be executed via `mcp_supabase-mcp-server_apply_migration` — never via raw `execute_sql`. This ensures changes are tracked in the migration history.

4. **Use `execute_sql` for data queries only.** Raw SQL execution via `mcp_supabase-mcp-server_execute_sql` is reserved for `SELECT` queries, data inspection, or one-off data migrations. It is never the right tool for schema changes.

5. **Generate TypeScript types after schema changes.** Any time a migration is applied, call `mcp_supabase-mcp-server_generate_typescript_types` and update the project's type definitions file. The frontend must always have accurate, up-to-date types that reflect the real database schema.

6. **Check for security and performance advisors after migrations.** After applying any DDL migration, call `mcp_supabase-mcp-server_get_advisors` for both `security` and `performance` types. Address any critical advisories (e.g., missing RLS policies, unindexed foreign keys) before moving on.

7. **Fetch logs when debugging.** For any backend issue — API errors, auth failures, edge function crashes, or storage problems — call `mcp_supabase-mcp-server_get_logs` with the appropriate service type (`api`, `auth`, `postgres`, `edge-function`, etc.) before speculating on the cause.

8. **Use Edge Functions for server-side logic.** Business logic that must not run on the client (payroll calculations, sensitive data transformations, third-party API calls) must be implemented as Supabase Edge Functions and deployed via `mcp_supabase-mcp-server_deploy_edge_function`.

---

## Key Constraints

- **Never hardcode project IDs, API keys, or URLs in source code.** Retrieve them via `mcp_supabase-mcp-server_get_project_url` and `mcp_supabase-mcp-server_get_publishable_keys`, and store them in environment variables (`.env.local`).
- **Always verify the project is active** before running migrations or queries. If it is paused, call `mcp_supabase-mcp-server_restore_project` first.
- **Never guess RLS policy status.** If a table handles user data, verify RLS is enabled and correctly configured via `mcp_supabase-mcp-server_get_advisors` (security type) after every migration.
- **Cost-aware project/branch creation.** Before creating a new Supabase project or branch, always call `mcp_supabase-mcp-server_get_cost` and `mcp_supabase-mcp-server_confirm_cost` to surface and confirm the cost with the user first.

---

## Supabase Service Ownership (What Lives Where)

| Concern | Supabase Service | MCP Tool |
|---|---|---|
| Database schema & tables | PostgreSQL | `apply_migration`, `list_tables` |
| Data queries | PostgreSQL | `execute_sql` |
| User authentication | Supabase Auth | `get_logs` (service: `auth`) |
| File/document storage | Supabase Storage | `get_logs` (service: `storage`) |
| Server-side business logic | Edge Functions | `deploy_edge_function`, `list_edge_functions` |
| TypeScript type safety | Type Generation | `generate_typescript_types` |
| Security auditing | Advisors | `get_advisors` (type: `security`) |
| Performance auditing | Advisors | `get_advisors` (type: `performance`) |

---

## Rationale

Supabase is the single source of truth for all persistent data and server-side operations in this project. Using the MCP server as the interface ensures that all changes are discoverable, tracked, type-safe, and auditable. Bypassing the MCP (e.g., making schema changes through the Supabase dashboard UI manually or writing raw queries without inspecting the schema first) creates drift, breaks types, and introduces security gaps. Every backend interaction must go through the MCP tools.
