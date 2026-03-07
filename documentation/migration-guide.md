# Legacy Backend Architecture & PostgreSQL Migration Guide

**Document Version:** 1.0
**Target Database:** PostgreSQL
**Legacy Backend:** PocketBase
**Purpose:** Provide mid-level documentation of the legacy PocketBase backend features and outline the critical architectural improvements required for the new PostgreSQL + Backend API implementation. 

---

## Part 1: Legacy Features & Data Flow Integration

The old PocketBase backend centralized all logic heavily within the database's Goja (JavaScript) hooks and basic CRUD endpoints. For the new implementation to achieve functional parity, the following core domain areas must be replicated via a proper API service layer:

### 1. Employee & Department Management
*   **Departments:** Hierarchical structure with parent and sub-departments.
*   **Employees:** Bound to specific departments with core attributes (Basic Salary, Dates of Joining, Grades, Status).
*   **Expected API Flow:** The frontend expects standard REST or GraphQL endpoints to fetch employees, filter by department, and soft-delete/archive records (rather than hard deletions).

### 2. Transaction Engine (Additions & Deductions)
*   **Core Concept:** Financial modifications applied to employees (Overtime, Bonuses, Deductions, Loan Advances).
*   **Legacy Logic:** Transactions were inserted into a `transactions` collection. They remained "pending" or unmarked until a payroll run explicitly consumed them.
*   **Expected API Flow:** The backend must provide an endpoint to log transactions manually and return projections on how they affect the current active month before the month is closed.

### 3. Payroll Generation & "Closing the Month"
*   **Legacy Logic (The `payroll.pb.js` hook):** 
    *   Triggered when a `payroll_runs` record was created.
    *   It synchronously queried all active employees.
    *   It synchronously queried all un-processed transactions for those employees.
    *   It computed `basicSalary + additions - deductions = netSalary`.
    *   It generated individual `payroll_slips` entries.
    *   It marked the consumed `transactions` as "processed" and linked them to the `payroll_run_id`.
*   **Expected API Flow:** A dedicated `POST /api/payroll/run` endpoint that accepts a target `month/year`. It should validate that only *one* run exists per month, calculate the slips, persist the run, and return the summary.

---

## Part 2: Critical Architectural Lessons (The 4 Pillars of Improvement)

When reconstructing this backend with PostgreSQL and a dedicated backend language (e.g., Node.js with Prisma/Drizzle, or Go), the developers **MUST NOT** replicate the old monolithic flow. The following 4 principles address the critical flaws discovered during the system evaluation phase.

### 1. System Dynamics & Scalability (The Monolithic Synchronous Trap)
**The Mistake:** The legacy system triggered a massive, synchronous database hook to calculate payroll for all employees in real-time. This blocks the main thread (or HTTP request), leading to guaranteed timeout failures and CPU starvation as the company scales to hundreds or thousands of employees.
**The Fix:** 
*   **Asynchronous Processing:** Payroll generation must be decoupled. The frontend should trigger a payroll run and immediately receive a `202 Accepted` status with a `job_id`.
*   **Message Queues:** Use a background worker system (e.g., BullMQ, RabbitMQ, or native Postgres `SKIP LOCKED` queues) to process the payroll calculations off the main API thread.
*   **Webhooks/Polling:** The frontend polls the job status or listens via WebSockets for the run completion.

### 2. Technical & Algorithmic Complexity (N+1 Querying & Memory Bloat)
**The Mistake:** Hook loops inherently query the database inside `for` loops (e.g., getting an employee, then fetching their transactions individually). This yields an $O(N^2)$ querying complexity, exploding database connection pools and causing severe memory bloat.
**The Fix:**
*   **Data Aggregation:** Leverage the power of PostgreSQL. Process payroll using bulk window functions, `GROUP BY`, and `JOIN`s to aggregate total additions and deductions per employee in one pass.
*   **Batch Writes:** Use `INSERT ... RETURNING` or `COPY` commands to insert the thousands of resulting `payroll_slips` in a single bulk transaction, rather than executing sequential individual `INSERT`s.

### 3. Robustness & Data Integrity (Lack of Atomic Transactions)
**The Mistake:** If a PocketBase hook crashed mid-execution (e.g., network failure or bad data parsing on employee #400 out of 500), it left the database in a "partially closed" state. Finding and reverting corrupted payroll runs was a topological nightmare.
**The Fix:**
*   **ACID Compliance:** The entire payroll generation sequence (creating the run, marking transactions as processed, generating slips) MUST occur within a single, strict PostgreSQL `BEGIN ... COMMIT` transaction.
*   **Idempotency:** The payroll calculation endpoint must be idempotent. If triggered twice accidentally for the same month, it should safely reject or replace without duplicating financial ledgers.

### 4. Security & Access Control (Direct DB Manipulation vs. Business Logic Layer)
**The Mistake:** BaaS architectures (like old PocketBase setups) often bleed business logic into the frontend, meaning the frontend defines the query constraints and the database merely accepts them. This makes it trivially easy to intercept requests and manipulate basic salaries or transaction amounts.
**The Fix:**
*   **Strict Abstraction:** The frontend must never talk directly to PostgreSQL. An API layer (e.g., NestJS, Express) acts as the ruthless gatekeeper.
*   **Server-Side Revalidation:** Never trust the frontend's calculations. If the frontend submits an overtime transaction, the API must re-verify the employee's base salary and cap limits server-side before touching PostgreSQL.
