# O2 Payroll System — Full Operational & Execution Flow Guide

**Purpose:** This document is the authoritative reference for developers rebuilding the backend.  
It documents exactly how the system worked from the user's perspective and how data flowed  
through the old PocketBase backend — including every field, rule, constraint, and edge case.  
The frontend UI is intentionally preserved as-is. Your job is to wire up a PostgreSQL backend  
behind these exact same user actions.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Application Sections & Navigation](#2-application-sections--navigation)
3. [Feature 1: Employee Management](#3-feature-1-employee-management)
4. [Feature 2: Transaction Engine](#4-feature-2-transaction-engine)
5. [Feature 3: Payroll — The Live Run View](#5-feature-3-payroll--the-live-run-view)
6. [Feature 4: Closing the Month (Critical Flow)](#6-feature-4-closing-the-month-critical-flow)
7. [Feature 5: Payroll History & Post-Run Actions](#7-feature-5-payroll-history--post-run-actions)
8. [Feature 6: Settings (Departments)](#8-feature-6-settings-departments)
9. [Database Schema Reference](#9-database-schema-reference)
10. [The 4 Architectural Laws (Do Not Repeat These Mistakes)](#10-the-4-architectural-laws-do-not-repeat-these-mistakes)

---

## 1. System Overview

This is an **internal payroll management system** for a company (currently branded for Skycourt Mall). It allows HR managers to:
- Maintain a list of employees and their departments.
- Record financial adjustments (overtime, bonuses, deductions, loan advances) for each employee throughout the month.
- "Close the month" to generate a frozen payroll snapshot, computing each employee's final net salary.
- Print individual payslips or a full organizational payroll report.
- Revert or permanently delete a payroll run within a 10-day window.

The app is RTL-ready (Arabic/English) via `react-i18next`. Multiple components read from `i18n` locale files.

---

## 2. Application Sections & Navigation

The sidebar provides access to the following 3 main pages:
- **Employees** — `/employees`
- **Payroll** — `/payroll`
- **Settings** — `/settings`

Authentication is required. A user logs in with an email + password. In the old system, this was handled by PocketBase's built-in `users` collection. In the new system, implement a standard JWT authentication endpoint that the auth store can call.

The **auth store** (`src/store/auth.store.ts`) should:
1. Accept an email + password on `authenticate(email, password)`.
2. Persist the token + user object.
3. Expose a `user` object with at least: `id`, `email`, `name`.
4. Expose a boolean `isAuthenticated` flag.
5. On logout, clear the token and redirect to the login page.

---

## 3. Feature 1: Employee Management

**Page:** `src/pages/Employees.tsx`  
**Service:** `src/services/employee.service.ts`

### 3.1 Viewing Employees

- Employees are displayed grouped by their **parent department** (e.g., Finance, Operations).
- Within each parent department group, employees are further subdivided by their **sub-department**.
- The grouping logic lives entirely on the frontend. The API only needs to return a flat list.
- Two view modes are supported via a tab toggle: **Active** and **Archived**.

### 3.2 Adding an Employee

The user clicks **"Add Employee"** → A slide-in drawer opens on the right side of the screen.

The form collects:

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | Required. Full name. |
| `email` | `string` | Optional. Email address. |
| `phone` | `string` | Required. Phone number. |
| `department` | `string` (ID) | Required. This is the **sub-department ID**, not the parent. |
| `jobTitle` | `string` | Required. e.g. "Senior Designer" |
| `monthlySalary` | `number` | Required. Base monthly salary in the local currency. Default: 5000. |
| `nationalId` | `string` | Required. Employee's national ID number. |
| `workHours` | `number` | Required. Total work hours per month. Default: 270. |
| `scores.performance` | `number` | 0–100. Used to auto-calculate grade. |
| `scores.dedication` | `number` | 0–100. Used to auto-calculate grade. |
| `scores.responsibility` | `number` | 0–100. Used to auto-calculate grade. |

**Grade Auto-Calculation (server must store the result):**
```
average = (performance + dedication + responsibility) / 3
if average >= 85 → grade = "Excellent"
if average >= 70 → grade = "Good"
else             → grade = "Bad"
```

The `grade` field is computed on the frontend before submission and sent as a string. The API should store it as-is.

### 3.3 Editing an Employee

Clicking the **"Edit"** action on an employee card opens the same drawer in edit mode, pre-populated with their existing data. The form submits a `PATCH`/`PUT` to update the record.

### 3.4 Archiving (Soft Delete) & Restoring

- Archiving does **not** delete the employee. It sets `isArchived = true`.
- Archived employees do **not** appear in payroll runs.
- They can be restored from the **Archived** tab by setting `isArchived = false`.

### 3.5 Bulk Transactions

The user can **select multiple employees** (via checkboxes on their cards). When 1+ employees are selected, a floating action bar appears at the bottom of the screen with an "Add Transaction" button. This opens the Transaction Drawer in **bulk mode**, applying the same transaction to all selected employees at once.

---

## 4. Feature 2: Transaction Engine

**Component:** `src/components/transactions/TransactionDrawer.tsx`  
**Service:** `src/services/transaction.service.ts`

Transactions are financial adjustments logged throughout the month. They remain **"open"** until the month is closed. Closing the month **consumes and closes** them.

### 4.1 Transaction Drawer — Single Employee Mode

Opened via the ⋮ menu on an employee card → "Add Transaction".

The drawer shows:
1. **Employee name and current basic salary** at the top.
2. **4 category selector buttons:**
   - **Overtime** (addition)
   - **Bonus** (addition)
   - **Deduction** (deduction)
   - **Advance** (loan deduction)
3. Selecting a category shows an **input area**.
4. A **live projection** shows what the employee's net salary will look like after this transaction is applied (this is a frontend calculation only, not persisted).

### 4.2 Units

| Category | Available Units | How it's calculated |
|---|---|---|
| `overtime` | `hours` or `days` | `amount × hourlyRate` or `amount × dailyRate` |
| `bonus` | `cash` | direct cash amount |
| `deduction` | `hours` or `days` | `amount × hourlyRate` or `amount × dailyRate` |
| `advance` | `cash` | direct cash amount (loan) |

**Hourly / Daily Rate Derivation:**
```
hourlyRate = monthlySalary / workHours
dailyRate  = monthlySalary / 30   (30 working days per month assumed)
```
> **Important:** These rates are calculated at the point of running payroll (server-side), NOT at transaction creation time. The transaction record only stores the raw `amount` and `unit`. The server resolves the cash value during the close-month run.

### 4.3 Transaction Record Fields

| Field | Type | Notes |
|---|---|---|
| `employeeId` | `string` | FK → employees |
| `category` | `enum` | `overtime`, `bonus`, `deduction`, `advance` |
| `type` | `enum` | `addition` or `deduction` (derived from category) |
| `amount` | `number` | Raw input value |
| `unit` | `enum` | `cash`, `hours`, `days` |
| `reason` | `string` | Optional. Only shown for `deduction` category. |
| `date` | `datetime` | Auto-set to submission time. |
| `isClosed` | `boolean` | `false` by default. Set to `true` when payroll run consumes it. |

### 4.4 Viewing & Deleting Active Transactions

The bottom half of the Transaction Drawer shows a scrollable list of all **existing open transactions** for the selected employee (where `isClosed = false`).

- Each entry shows the category icon, amount, and unit.
- An individual transaction can be **deleted** using the trash icon. Deleted transactions are permanently removed.
- Once a month is closed, these transactions are marked `isClosed = true` and no longer appear here.

### 4.5 Bulk Mode

When triggered from the bulk floating bar with multiple employees selected:
- The same single transaction (type + amount + unit) is saved for **each** selected employee.
- The existing transactions list is hidden (since it's per-employee only).
- The projection banner changes to show a summary e.g. "This bonus will be applied to 5 employees".

---

## 5. Feature 3: Payroll — The Live Run View

**Page:** `src/pages/Payroll.tsx`  
**Component:** `src/components/payroll/DepartmentPayrollGroup.tsx`

### 5.1 What the User Sees

Before any run is initiated for the current month, the Payroll page shows a **live preview** of what the payroll would look like if run right now. This is a **real-time computation on the frontend** — it takes the employees + their open transactions and shows a projected net salary for each.

Employees are grouped into the same hierarchical parent → sub-department structure.

Each employee card in this view shows:
- Name, job title
- Basic Salary
- Additions (computed as: sum of all open overtime + bonus transactions)
- Deductions (computed as: sum of all open deduction + advance transactions)
- Net Salary (basic + additions - deductions)

### 5.2 The "Close Month" Button

At the top of the Payroll page, there is a **"Close Month"** button. When clicked:

1. A **dialog box** appears asking the user to **select (or confirm) the month they are closing**. The month input is a month/year picker (format: `YYYY-MM`). It defaults to the current month.
2. The user confirms by clicking "Close Payroll".
3. The API is called: `POST /api/payroll/run` with body `{ period: "2026-03" }`.
4. The server runs the payroll (see section 6 for exact server logic).
5. On success, the page refreshes and the run appears in the **History** tab.

> **Critical constraint:** Only **one payroll run** is allowed per `period`. If a run for that month/year already exists in the database, the API must reject the request with a clear error message.

---

## 6. Feature 4: Closing the Month (Critical Flow)

This is the most critical server-side operation. The following describes the exact execution of the old `POST /api/payroll/run` endpoint (from `pb/pb_hooks/payroll.pb.js`).

### 6.1 Input Validation

```
Body: { period: "YYYY-MM" }
```

- `period` is required. If missing → `400 Bad Request`.
- Check if a `payroll_runs` record already exists with this `period`. If yes → `400 Bad Request` ("A payroll run for this period already exists.").

### 6.2 Fetch Active Employees

Query all employees where `isArchived = false`.

### 6.3 Fetch Open Transactions

Query all transactions where `isClosed = false` AND `employeeId` is in the employee list.
Group transactions by `employeeId` into a map: `{ [employeeId]: Transaction[] }`.

### 6.4 Create the Run Record First

Insert a new `payroll_runs` record with the given `period`. Capture its auto-generated `id` as `runId`.

### 6.5 Transaction Block — Process Each Employee

All of the following must execute in a single database transaction:

**For each active employee:**

a. Look up their transactions from the map (default to empty array).

b. Compute salary components:
```
hourlyRate = monthlySalary / workHours
dailyRate  = monthlySalary / 30

For each transaction:
  if unit == "cash"  → value = amount
  if unit == "hours" → value = amount × hourlyRate
  if unit == "days"  → value = amount × dailyRate

  if category == "overtime"  → overtimeAmount  += value
  if category == "bonus"     → bonusAmount     += value
  if category == "deduction" → deductionAmount += value
  if category == "advance"   → advanceAmount   += value

totalAdditions  = overtimeAmount + bonusAmount
totalDeductions = deductionAmount + advanceAmount
netSalary = basicSalary + totalAdditions - totalDeductions
```

c. Insert a `payroll_slips` record:
```
payrollRunId  = runId
employeeId    = employee.id
departmentId  = employee.department  // sub-department ID
basicSalary   = employee.monthlySalary
overtimeAmount
bonusAmount
deductionAmount
advanceAmount
netSalary
transactions  = [array of tx IDs that were consumed]
```

Also store `employeeName` and `employeeJobTitle` denormalized onto the slip, as they are read at print time and the employee data should be frozen to the state at run time.

d. Mark each consumed transaction: `isClosed = true`.

e. Accumulate totals for the run:
```
runTotalBasic      += basicSalary
runTotalNet        += netSalary
runTotalDeductions += totalDeductions
slipCount++
```

### 6.6 Update Run Record with Totals

After all employees are processed, update the `payroll_runs` record:
```
totalBasic      = runTotalBasic
totalNet        = runTotalNet
totalDeductions = runTotalDeductions
employeeCount   = slipCount
```

### 6.7 Return

```json
{ "success": true, "runId": "<uuid>" }
```

---

## 7. Feature 5: Payroll History & Post-Run Actions

**Page:** Same `src/pages/Payroll.tsx`, **"History" tab**

### 7.1 Run List

Displays a paginated list of all past closed payroll runs (10 per page). Each card shows:
- `period` (e.g., "March 2026")
- `date` (actual run date)
- `totalBasic`
- `totalNet`
- `employeeCount`
- A "Closed" badge

Clicking a run card opens the **Run Detail View**.

### 7.2 Run Detail View

Clicking a specific run shows a full breakdown grouped by department hierarchy (same card layout as the live run view). It fetches all `payroll_slips` for that `payrollRunId`.

Buttons available in the detail view header:
1. **Print Payslips** — Opens the printable 2-per-A4-page payslip template.
2. **Print Report** — Opens the full payroll report table template (landscape A4).
3. **Revert Payroll** *(only if within 10 days of run date)*
4. **Delete Payroll** *(only if within 10 days of run date)*

### 7.3 Revert Payroll — `POST /api/payroll/revert`

**Input:** `{ runId: "..." }`

**Server logic:**
1. Fetch the `payroll_runs` record by `runId`.
2. Check that `created_at` is within the last 10 days. If older → `400 Bad Request`.
3. In an **atomic transaction**:
   a. Fetch all `payroll_slips` for this run.
   b. For each slip, collect all `transaction` IDs from the slip's `transactions` array.
   c. For each transaction ID, set `isClosed = false` (reopens the transaction).
   d. Delete the `payroll_runs` record (cascade-deletes all associated slips).
4. Return `{ success: true, transactionsRestored: N }`.

**Effect on the user:** The run disappears from history. All transactions that were consumed reappear as "open" in the Transaction Drawer for each employee, as if the month was never closed. The user can then modify transactions and run payroll again.

### 7.4 Delete Payroll — `POST /api/payroll/delete`

**Input:** `{ runId: "..." }`

**Server logic:** Same as Revert, except instead of reopening transactions (step c), it **permanently deletes** them.

**Effect on the user:** The run disappears and the consumed transactions are gone forever. Use this when payroll was closed accidentally on the wrong month or with bad data and you want a clean slate, not a restoration.

---

## 8. Feature 6: Settings (Departments)

**Page:** `src/pages/Settings.tsx`  
**Component:** `src/components/settings/departments/DepartmentsTab.tsx`

The department structure is **hardcoded in the frontend** at `src/lib/departments.ts`. It defines parent departments and their sub-departments with IDs, labels, and color palettes.

> **Note:** In the PocketBase version, departments were not stored in the database. The frontend was the single source of truth for department structure. The IDs are hardcoded string constants that match the `department` field values on employee records.

When rebuilding, you have two choices:
1. Keep departments static/hardcoded (simplest).
2. Create a `departments` table and allow dynamic management via Settings UI (recommended for scalability).

If you go with option 2, the Settings page has a `DepartmentsTab` component ready and expecting CRUD endpoints for departments.

---

## 9. Database Schema Reference

### `employees`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `name` | `string` | |
| `email` | `string` | nullable |
| `phone` | `string` | |
| `department` | `string` | Sub-department ID (FK or hardcoded) |
| `jobTitle` | `string` | |
| `monthlySalary` | `number` | |
| `workHours` | `number` | Monthly work hours (default 270) |
| `nationalId` | `string` | |
| `grade` | `enum` | `Excellent`, `Good`, `Bad` |
| `isArchived` | `boolean` | Soft-delete flag |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

### `transactions`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `employeeId` | `uuid` | FK → employees |
| `category` | `enum` | `overtime`, `bonus`, `deduction`, `advance` |
| `type` | `enum` | `addition`, `deduction` |
| `amount` | `number` | Raw value (hours, days, or cash) |
| `unit` | `enum` | `hours`, `days`, `cash` |
| `reason` | `string` | nullable (used for deductions) |
| `date` | `timestamp` | When the transaction was recorded |
| `isClosed` | `boolean` | `false` = open, `true` = consumed by a payroll run |

### `payroll_runs`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `period` | `string` | Format: `YYYY-MM`. Unique constraint. |
| `date` | `timestamp` | When the run was executed |
| `totalBasic` | `number` | Sum of all employees' basic salaries |
| `totalNet` | `number` | Sum of all employees' net salaries |
| `totalDeductions` | `number` | Sum of all deductions |
| `employeeCount` | `number` | Number of slips generated |

### `payroll_slips`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `payrollRunId` | `uuid` | FK → payroll_runs (cascade delete) |
| `employeeId` | `uuid` | FK → employees |
| `departmentId` | `string` | Sub-department ID (snapshot at run time) |
| `employeeName` | `string` | Denormalized snapshot of name at run time |
| `employeeJobTitle` | `string` | Denormalized snapshot of job title at run time |
| `basicSalary` | `number` | Snapshot of salary at run time |
| `overtimeAmount` | `number` | Computed overtime cash value |
| `bonusAmount` | `number` | Computed bonus cash value |
| `deductionAmount` | `number` | Computed deduction cash value |
| `advanceAmount` | `number` | Computed advance/loan cash value |
| `netSalary` | `number` | Final: basicSalary + additions - deductions |
| `transactions` | `uuid[]` | Array of transaction IDs consumed by this slip |

---

## 10. The 4 Architectural Laws (Do Not Repeat These Mistakes)

These are patterns from the PocketBase version that **must not** be replicated:

### Law 1: No Synchronous Payroll Generation on the Main Thread
The old system ran a nested loop over all employees + transactions inside a single synchronous HTTP request. This will timeout with ~50+ employees. Use an async job queue (BullMQ, etc.) and return a `job_id` immediately.

### Law 2: No N+1 Database Queries
Never fetch employees, then loop through and query each employee's transactions individually. Fetch ALL open transactions in one bulk query, then group them in memory by `employeeId`.

### Law 3: All Payroll Operations Must Be Atomic
The entire close-month sequence — creating the run, generating all slips, marking transactions as closed — MUST happen inside a single `BEGIN ... COMMIT` transaction block. If any step fails, the entire operation rolls back.

### Law 4: The Frontend Must Never Trust Its Own Calculations
The net salary projection shown in the live Payroll view is a UI convenience only. The canonical calculation always happens server-side. The frontend projection may differ slightly from the final slip (due to rounding, edge cases, or salary changes made just before closing). The server's result is always authoritative.
