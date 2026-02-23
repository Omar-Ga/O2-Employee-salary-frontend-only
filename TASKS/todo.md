# Production Readiness To-Do List

This document lists the critical architectural, performance, and security issues discovered during the pre-production audit. These must be resolved before deploying the application to a live VPS environment.

## ✅ 1. Architecture & Security: Migrate Bulk Processing to Backend (Completed)
**Difficulty:** High | **Priority:** Critical

**Context:** The function `payrollService.closeMonth` calculates the entire monthly payroll on the frontend by cross-filtering the `employees` and `transactions` arrays. It then submits thousands of records via a massive `pb.createBatch()` payload.
**Issues:**
- **Security:** The frontend is untrusted. A malicious actor can intercept the batch request and inject arbitrary `netSalary` values without backend validation.
- **Reliability:** Transmitting a multi-megabyte batch payload via HTTP POST is prone to network timeouts or server-side limits (e.g., Cloudflare/Nginx `413 Payload Too Large`).
- **Performance:** Frontend looping logic (`O(N * M)`) forces the browser to do heavy lifting that should be handled by the database engine.
**Developer Tasks:**
- Rip out the bulk processing logic from the frontend `payroll.service.ts`.
- Rewrite the `closeMonth` logic entirely as a PocketBase custom route using JSVM hooks (`pb_hooks`) or Go.
- The frontend should simply trigger an empty `POST` request (e.g., `POST /api/payroll/close`) and let PocketBase calculate and commit the batch server-side.

## ✅ 2. Performance & Scaling: Eradicate `getFullList` Queries (Completed)
**Difficulty:** Medium | **Priority:** Critical

**Context:** Core services (`employeeService.getAll`, `transactionService.getAll`, and `payrollService.getHistory`) are currently utilizing PocketBase's `getFullList()` method. 
**Issues:**
- As the database organically grows over months/years, `getFullList` will pull thousands of deep-nested JSON nodes into browser memory in a single HTTP call.
- This will cause massive latency spikes, drain bandwidth, and eventually crash the client browser (Out of Memory).
**Developer Tasks:**
- **Lazy Loading (Payroll History):** Change `getHistory` to fetch only the top-level `payroll_runs` metadata via `getList(1, 10)` pagination. Do *not* fetch all historical slips for all runs upfront.
- Only fetch `payroll_slips` specifically filtered by `payrollRunId` when a user actively clicks on a particular historical run.
- Convert `employeeService` and `transactionService` to use standard cursor-based or offset pagination (`getList`) instead of loading the entire table upfront.

## 🟡 3. Database Optimization: Implement B-Tree Indexing
**Difficulty:** Low | **Priority:** High

**Context:** The PocketBase collections currently rely only on system-default indexes (ID, auth constraints). 
**Issues:**
- Without custom secondary indexes, querying `transactions` by `employeeId` or `isClosed = false` results in a Full Table Scan (Sequential Scan).
- While SQLite handles this fine for a few hundred rows, deploying this to a VPS with concurrent active users will degrade disk I/O and increase read latency linearly.
**Developer Tasks:**
- Write and run PocketBase migration files to add composite indexes on high-frequency query paths.
- Example: Add `CREATE INDEX idx_transactions_closed_emp ON transactions (isClosed, employeeId)`.
- Analyze other API filters and add corresponding indices to `employees` or `payroll_slips` if needed.

## 🟡 4. State Management: Eliminate Rerender Cascades (`useDashboardStats.ts`)
**Difficulty:** Medium | **Priority:** Medium

**Context:** The `useDashboardStats` hook computes dynamic statistics using heavy `.reduce` and `.filter` loops nested inside `useMemo()`.
**Issues:**
- Variables like `currentNetTotal` and `currentDeductionTotal` perform `O(N * M)` operations every time an un-cached refresh triggers. 
- Over time, as employee and transaction counts grow, these cascading rerenders will make the dashboard UI freeze or stutter.
**Developer Tasks:**
- Stop re-filtering the `transactions` array inside the `employees` loop. 
- Refactor the logic to pre-compute a Hash Map / Dictionary (e.g., `Map<EmployeeId, Transaction[]>`) in `O(N)` time.
- Perform the calculations using `O(1)` dictionary lookups for instantaneous processing.

## 🟢 5. Robustness & UX: Standardize Error Boundaries
**Difficulty:** Low | **Priority:** Medium

**Context:** `department.service.ts` features a solid standard error handling wrapper (`handleError`), distinguishing between token expirations, network drops, and database faults. 
**Issues:**
- `employee.service.ts` and `transaction.service.ts` lack these `try/catch` wrappers. 
- If the VPS drops connection or an API call fails with a 403/404, raw unformatted JSON exceptions will bubble up, Potentially causing a complete React White Screen of Death or confusing default toasts.
**Developer Tasks:**
- Extract `handleError` into a centralized utility file (e.g., `src/lib/apiClient.ts` or `src/utils/errors.ts`).
- Ensure *all* PocketBase SDK calls across *all* services are wrapped with this standard error handler so UI components fail gracefully with proper localizable messages.
