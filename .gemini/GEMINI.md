# Persistent Rules & Context

## 1. Environment & Shell
- **OS**: Windows.
- **Shell**: PowerShell ONLY.
- **Syntax**: Use strictly PowerShell syntax (e.g., `Get-ChildItem`, `$env:VAR='val'`, `Write-Host`).
- **Pathing**: Use absolute paths (`d:\...`) for file operations to avoid ambiguity.

## 2. PocketBase Best Practices
- **Skill Mandate (CRITICAL)**: ANY task involving PocketBase MUST be preceded by reading **BOTH** `pocketbase` and `pocketbase-extended` skills. No exceptions.
- **Type Safety**:
    - **MUST** use generated types from `pocketbase-typegen`.
    - **NEVER** use `any` or manual interfaces for collections if auto-generation is possible.
- **Migrations**:
    - **ALWAYS** run `.\pb\pocketbase.exe migrate collections` after ANY schema change via the Admin UI.
    - **Source of Truth**: The `pb_migrations` folder is the source of truth for the database schema.
- **Error Handling**: Wrap calls in standardized error handlers distinguishing `ClientResponseError` from network errors.

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
