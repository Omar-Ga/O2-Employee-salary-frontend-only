---
trigger: always_on
---

# Persistent Rules & Context

## 1. Environment & Shell

- **OS**: Windows.
- **Shell**: PowerShell ONLY.
- **Syntax**: Use strictly PowerShell syntax (e.g., `Get-ChildItem`, `$env:VAR='val'`, `Write-Host`).
- **Pathing**: Use absolute paths (`d:\...`) for file operations to avoid ambiguity.

## 2. PocketBase Best Practices

- **Single Source of Truth (Documentation)**:
  - ALWAYS refer to the local documentation in `documentation/pocketbase-reference` to understand PocketBase JS SDK, Web API, and Hooks.
  - Treat these local markdown files as the absolute source of truth to avoid hallucinations about older PocketBase versions like v0.20 or v0.19.

- **Skill Mandate (ABSOLUTE MANDATE)**:
  - You **MUST** read **BOTH** PocketBase skills BEFORE doing ANY work on the backend or database.
  - This is NOT optional. Even if you think you know the answer, you **MUST** read them.
  - Locations:
    - `pocketbase`: [SKILL.md](file:///d:/coding/O2-Employee-salary-frontend-only/.agent/skills/pocketbase/pocket-base/SKILL.md)
    - `pocketbase-extended`: [SKILL.md](file:///d:/coding/O2-Employee-salary-frontend-only/.agent/skills/pocketbase-extended/pocketbase/SKILL.md)
  - **CRITICAL**: If you fail to read these before a PocketBase task, you have failed the user's core requirement.
- **Type Safety**:
  - **MUST** use generated types from `pocketbase-typegen`.
  - **NEVER** use `any` or manual interfaces for collections if auto-generation is possible.
- **Migrations**:
  - **ALWAYS** run `.\pb\pocketbase.exe migrate collections` after ANY schema change via the Admin UI.
  - **Source of Truth**: The `pb_migrations` folder is the source of truth for the database schema.
- **Error Handling**: Wrap calls in standardized error handlers distinguishing `ClientResponseError` from network errors.
- **Single Source of Truth (Documentation)**:
  - ALWAYS refer to the local documentation in `documentation/pocketbase-reference` to understand PocketBase JS SDK, Web API, and Hooks.
  - Treat these local markdown files as the absolute source of truth to avoid hallucinations about older PocketBase versions like v0.20 or v0.19.

## 3. Frontend Architecture (Chakra UI)

- **Framework**: React + Vite + Chakra UI.
- **Styling**: **STRICTLY Chakra UI**. NO Tailwind.
- **MCP Usage (MANDATORY)**:
  - **Documentation First**: Before creating ANY UI component, you **MUST** use the `chakra-ui` MCP tools to fetch the latest component API, props, and examples.
  - **Source of Truth**: The MCP documentation is the ONLY source of truth. Do not rely on internal training data (hallucinations risk).
- **State Management**:
  - Client: Zustand.
  - Server: TanStack Query.
- **Component Structure**:
  - `components/ui` (Dumb/Presentation).
  - `components/domain` (Smart/Business Logic).

## 4. Codebase Hygiene

- **Atomic File Structure**:
  - **Micro-Files**: One file = One specific task/component.
  - **Anti-Monolith**: If a file grows too large or handles multiple concerns, break it down immediately.
  - **Single Responsibility**: Each file should have a single reason to change.

## 5. Workflow & Persona

- **Senior Persona**: Plan before executing. "Ultrathink" implications (security, performance).
- **Atomic Changes**: Verify after every meaningful step.

## 6. Data Integrity & Mock Removal

- **Zero Mock Tolerance**: The backend (PocketBase) is the SOLE source of truth.
- **Immediate Removal**: Whenever you encounter mock data or hardcoded arrays (e.g., `MOCK_DATA`) in the codebase, you **MUST** remove them immediately and replace them with proper backend calls.
- **Preparation for Backend**: Assume the backend handles everything. Do not create fallback mock data. If the backend is missing a feature, implement it in the backend, not as a mock in the frontend.

## 7. Documentation Workflow

- **Wait for Confirmation**: After completing an implementation, pause and await the user's explicit  confirmation. NEVER CREATE DOCUMENTATION WITHOUT THE USER APPROVAL OR PERMISSION.
- **Auto-Documentation**: Upon receiving "Create Docs", immediately create a new documentation file `documentation/Task-N-doc.md`.
- **Versioning**: Determine `N` by scanning existing `Task-*-doc.md` files in the `documentation` folder and incrementing the highest number found (e.g., if `Task-1-doc.md` exists, create `Task-2-doc.md`). Even if you lack context of previous runs, you MUST check the file system to find the next number. DO NOT EVER CREATE DOCS UNLESS GIVEN THE KEYWORD OR TOLD SO

## 8. Translation & i18n

- **Zero Hardcoded Strings**: ALL UI text MUST use `react-i18next`. No exceptions for "small" strings.
- **Bi-directional Support**: Maintain parity between `public/locales/en` and `public/locales/ar`. Every new key MUST be added to both.
- **Modular Translations**: ALWAYS keep translation files modular and specific to their parts (e.g., `login.json`, `sidebar.json`). NEVER use generic or ambiguously named files like `translation.json` or `common.json`.
- **Machine Keys in DB**: Databases/PocketBase collections MUST store machine-readable slugs/enums (e.g., `verified`, `pending`) instead of display strings. The frontend handles the translation of these slugs.
- **Naming Convention**: Use hierarchical keys in JSON (e.g., `dashboard.stats.total_payroll`) for better organization.

## 9. pocketbase changes flow

- **restart pocketbase after any edits to the db, schema or migration files** always restart pb dashboard through pocketbase.exe serve this is because pocketbase loads new migrations on startup this way you can add any new migrations AND be able to see if a migration has errors. NEVER TRY PUSHING THE MIGRATION MANUALLY ON AN ALREADY RUNNING POCKETBASE, if pocketbase seems to already be running then kill the process first then restart.