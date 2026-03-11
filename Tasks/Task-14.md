# Task 14: Dashboard — Live Stats & Metrics

## Goal
Wire up the **Dashboard page** to show real-time payroll statistics computed from live Supabase data — active employee count, current projected net total, comparison to last closed run, deduction rates, etc.

## Status: ✅ COMPLETED
## Complexity: 🟡 Medium

---

## Scope

### 14.1 — Implement `payrollService.getStats()`
This method should compute and return:

```ts
interface PayrollStats {
  activeCount: number           // Count of employees where is_archived = false
  currentNetTotal: number       // Projected net salary total (all active employees + open transactions)
  currentDeductionTotal: number // Projected total deductions
  currentGross: number          // Sum of all active employees' basic salaries
  currentDeductionRate: number  // currentDeductionTotal / currentGross * 100
  lastRunTotal: number          // Net total from the most recent closed payroll run
  lastPeriod: string | null     // Period of the most recent closed run
  percentChange: number | null  // ((currentNetTotal - lastRunTotal) / lastRunTotal) * 100
  deductionRateChange: number | null  // Change in deduction rate vs. last run
}
```

**Implementation approach:** This can be done as:
- A frontend computation: fetch employees + open transactions + last run, then compute on client (simple, consistent with "dumb frontend" rule exception for projections).
- OR a PostgreSQL function via RPC (more performant at scale, but more complex).

For now, a **frontend computation** is acceptable since this is a projection (same pattern as the live payroll preview). The live preview data can be reused.

### 14.2 — Implement `payrollService.getLastClosedRunTotal()`
- Query `payroll_runs` ordered by `date DESC`, limit 1.
- Return `{ total, period, deductionTotal, grossTotal }` or `null` if no runs exist.

### 14.3 — Verify Dashboard Page
The `src/pages/Dashboard.tsx` page uses the `useDashboardStats` hook which calls `payrollService.getStats()`.

Verify the dashboard cards show:
- Active employee count
- Current projected payroll total
- Comparison to last closed run (% change up/down)
- Current deduction rate

### 14.4 — Test
1. Navigate to `/` (Dashboard).
2. Verify stats reflect real data.
3. Add a transaction to an employee → refresh Dashboard → stats should update.
4. Close a month → refresh → "last run" stats should update.

---

## Files Touched
| File | Action |
|---|---|
| `src/services/payroll.service.ts` | Implement `getStats()`, `getLastClosedRunTotal()` |
| `src/hooks/useDashboardStats.ts` | Verify integration |
| `src/pages/Dashboard.tsx` | Verify display |

---

## Acceptance Criteria
- [x] The Dashboard shows the correct number of active employees.
- [x] The current projected net total reflects employees + open transactions.
- [x] If a previous payroll run exists, the % change is shown correctly.
- [x] If no previous run exists, the % change is hidden or shows "N/A".
- [x] The deduction rate is computed and displayed correctly.
- [x] Stats update when the underlying data changes (transactions added, month closed).
- [x] No `any` types are used.

---

## Dependencies
- **Task 4** (employees fetchable)
- **Task 7** (transactions fetchable)
- **Task 10** (at least one closed run for comparison stats)
