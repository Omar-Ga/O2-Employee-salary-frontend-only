# Task 12: Payroll Run Tab Enhancements

## Goal
Enhance the **Payroll Run** tab to provide visibility into total monthly salary commitments and reorganize the employee list by department structure (Parent and Sub-departments) to match the Employees tab.

## Implementation Details

### 1. Global Metrics
Added a top-level summary section in `PayrollRunView` that displays:
- **Total Basic Payroll**: Global sum of `monthlySalary` for all non-archived employees.
- **Total Net Payout**: Global sum of projected net salaries (Basic + Additions - Deductions) for the current cycle.

### 2. Department Grouping & UI Structure
- Created a new component [DepartmentPayrollGroup.tsx](file:///d:/coding/O2-Employee-salary-frontend-only/src/components/payroll/DepartmentPayrollGroup.tsx) to handle nested rendering.
- Refactored [Payroll.tsx](file:///d:/coding/O2-Employee-salary-frontend-only/src/pages/Payroll.tsx) to use the `useDepartments` hook and map employees into their respective structural groups.
- Each department group now displays:
    - **Header**: Parent department name and employee count.
    - **Department Totals**: Sum of basic and net salaries for all employees within that specific department.
    - **Sub-department Spacing**: Clear visual separators for sub-departments with nested subtotals.

### 3. Internationalization (i18n)
Added corresponding translation keys in:
- [en/payroll.json](file:///d:/coding/O2-Employee-salary-frontend-only/public/locales/en/payroll.json)
- [ar/payroll.json](file:///d:/coding/O2-Employee-salary-frontend-only/public/locales/ar/payroll.json)

Keys added: `employeesCount`, `totalBasic`, `totalNet`, `globalTotalBasic`, `globalTotalNet`.

## Verification Results

### Automated Tests
- N/A (Manual visual verification performed).

### Manual Verification
- [x] **Global Totals**: Verified that the summary cards correctly display the sum of all employees.
- [x] **Grouping**: Verified that employees appear under their correct Parent/Sub-department headers.
- [x] **Department Subtotals**: Verified that the subtotals in each department header match the sum of the rows below them.
- [x] **Manage Drawer**: Verified that the "Manage" button still correctly opens the `TransactionDrawer` for the specific employee.
- [x] **Close Month**: Verified that the close month mutation still functions correctly with the new grouped UI.
- [x] **i18n**: Verified that both English and Arabic translations load correctly.
