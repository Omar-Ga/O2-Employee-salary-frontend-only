# Product Canvas: Employee Salary System v2.0

## 1. Core Experience
**Philosophy:** "Oxygen Air" - Clean, spacious, and trustworthy.
*   **Platform:** Desktop Application (Windows).
*   **Connectivity:** "Connected App" - Works like a website but runs on your desktop. Requires internet access to ensure data safety and backup.
*   **Language:** Supports **English** and **Arabic** (fully adaptable interface).
*   **Security:** Secure Login (Username/Password) is required to access any data.

## 2. Employee Management
**Goal:** Create and maintain comprehensive employee records with a grading system.
*   **Data Fields:**
    *   `Name` (String)
    *   `National ID` (Unique Identifier)
    *   `Phone Number` (Integer)
    *   `Job Title` (String)
    *   `Department` (Dropdown Menu)
    *   `Monthly Salary` (Currency - "Full Package")
    *   `Work Hours` (Integer - Default 270)
*   **Grading System (0-10):**
    *   Tracks: `Performance`, `Dedication`, `Responsibility`.
    *   Visual: Auto-calculates a Grade (Excellent/Good/Bad) with color codes.
*   **Archiving:** Employees are never permanently deleted. They are "Soft Deleted" to an archive tab to keep historical records safe.

## 3. Departmental Logic
**Goal:** Enforce a strict hierarchical structure for organization.
*   **Structure:** Parent-Child relationship (e.g., Finances -> Accounting).
*   **Constraint:**
    *   **Parent Departments** (e.g., "Finances"): Purely structural containers. **Cannot** hold employees.
    *   **Child Departments** (e.g., "Accounting"): Functional units. **Can** hold employees.

## 4. Salary Engine
**Goal:** Automated, consistent financial calculations.
*   **The Golden Rule:** All calculations are based on the **Hourly Rate**.
*   **Formulas:**
    *   `Hourly Rate` = `Monthly Salary` / `Work Hours` (270).
    *   `Net Salary` = `Monthly Salary` + `Additions` - `Deductions`.

## 5. Transaction Types
**Goal:** Manage variable monthly pay adjustments dynamically.

| Transaction | Type | Input Unit | Effect | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Overtime** | Addition | Hours or Days | **+ Increase** | Auto-calculates based on hourly rate. |
| **Deduction** | Deduction | Hours or Days | **- Decrease** | Auto-calculates penalty for absence or lateness. |
| **Bonus** | Addition | Cash Amount | **+ Increase** | Adds a fixed cash reward (e.g., "1000 EGP"). |
| **Advance** | Deduction | Cash Amount | **- Decrease** | Deducts a fixed cash amount (e.g., Loan repayment). |

## 6. Monthly Workflow (The "Closure" Cycle)
**Goal:** secure monthly data closing.
*   **Payroll Run:** Instead of just "resetting," the system takes a **Snapshot**.
*   **Process:**
    1.  **Close Month:** Freezes all calculations for the current period.
    2.  **Archive:** Saves a permanent "Payroll Slip" for every employee.
    3.  **Reset:** Clears the temporary transactions (Overtime/Deductions) to prepare for the new month.
*   **History View:** A dedicated dashboard to view past months' salaries and slips.

## 7. UI/UX Refinement (Current Sprint)
**Goal:** Modernize Transaction Entry.
*   **Pattern:** Replace Floating Dialog with Bottom Drawer.
*   **Layout:**
    *   **Context Panel (Left):** Live Salary Preview (Base -> Projected Net).
    *   **Action Panel (Right):** Quick-switch Transaction Types.
*   **Interactions:**
    *   **Overtime/Deduction:** Toggleable Units (Hours <-> Days).
    *   **Bonus/Advance:** Direct Cash Input.

