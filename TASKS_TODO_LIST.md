# Settings Module Implementation Plan

## Overview
This document outlines the detailed requirements for implementing the "Settings" module in the `O2-Employee-salary` application. The goal is to create a polished, "Avant-Garde" settings interface with specific sub-tabs and high-fidelity UX interactions.

**Target Directory:** `src/pages/Settings.tsx` (or distinct components within `src/components/settings/`)

---

## Task 1: Scaffold Settings Layout & Navigation
**Objective:** Create the main container for the Settings page.

-   **Layout:**
    -   **Sidebar (Left):** A vertical navigation menu listing all sub-tabs.
    -   **Content Area (Right):** A dynamic panel that renders the active sub-tab's content.
-   **Sub-Tabs List:**
    1.  About O2mation
    2.  Manage Departments
    3.  Manage Users
    4.  Data Export
    5.  Data Import
    6.  Preferences
-   **Styling:**
    -   Use the project's layout primitives (likely `Grid` or `Flex`).
    -   The active tab in the sidebar must have a distinct visual style (e.g., theme color background or left border accent) to indicate selection.
    -   Ensure responsive design (sidebar collapses or becomes a drawer on mobile).

---

## Task 2: Implement "About O2mation" Tab
**Objective:** A read-only informational display about the company.

-   **Header:** Display "O2mation" in a large, display typography (H1 equivalent).
-   **Content:**
    -   Display a grid or list of company details:
        -   **Email:** (Placeholder: contact@o2mation.com)
        -   **Phone:** (Placeholder: +1 234 567 890)
        -   **Address:** (Placeholder: HQ Address)
        -   **Registration/Tax IDs:** (Placeholders)
-   **UX/UI:**
    -   Clean, editorial typography.
    -   Minimalist styling. No edit functionality required for now.

---

## Task 3: Implement "Manage Departments" Tab (Visual Editor)
**Objective:** A drag-and-drop visual editor for managing department hierarchy.

-   **Layout:** Two-pane interface.
    -   **Right Pane (Palette):** Contains a list of "Unassigned" or "New" department blocks and a distinct `+ Add Department` button.
    -   **Left/Center Pane (Canvas):** The main workspace where the hierarchy is built.
-   **Interaction (Drag & Drop):**
    -   **Blocks:** Represent departments as visual cards/blocks.
    -   **Logic:**
        -   The first block placed is a **Parent** department.
        -   Blocks dropped *under* or *into* a parent block become **Child** departments.
    -   **Visual Cues:**
        -   Child departments must be visually indented or "pushed up/in" slightly to denote hierarchy.
        -   Drop zones should highlight when a block is dragged over them.
-   **Save State Logic:**
    -   **Initial State:** The "Save Changes" button is **Greyed Out / Disabled**.
    -   **Change Detection:** Detect any modification (add, move, reorder).
    -   **Active State:** Upon modification, the "Save Changes" button turns **Signature Green** and becomes clickable.
    -   **Action:** Clicking save parses the visual tree into a data structure (Parent -> Children) and logs/saves it.

---

## Task 4: Implement "Manage Users" Tab (Restricted)
**Objective:** A view showing user management UI but strictly disabled for the current user context.

-   **Visuals:**
    -   Render a standard table or list layout (Avatar, Name, Role).
    -   **IMPORTANT:** The entire container/content must have reduced opacity (e.g., `opacity: 0.5`) to visually indicate it is inactive.
-   **Restriction Message:**
    -   Place a clear text warning below the header.
    -   **Text:** "Admin Previlage not met" (Note: Use this exact wording/spelling).
    -   **Color:** Red / Danger color.
-   **Interactivity:**
    -   All inputs, buttons, and controls within this tab must be `disabled`.

---

## Task 5: Implement "Data Export" & "Data Import" Tabs
**Objective:** Simple data management utilities.

### Sub-Tab: Data Export
-   **Layout:** A grid of cards/buttons.
-   **Options:**
    1.  **Generate Payslips:** (Action: Mock download PDF)
    2.  **Export to CSV:** (Action: Mock download CSV)
    3.  **Export to Excel:** (Action: Mock download XLSX)
-   **UI:** Cards should have an icon and a label. Hover effects (lift/glow) are required.

### Sub-Tab: Data Import
-   **Layout:** A focused, single-purpose interface.
-   **Component:** A large "Drop Zone" area.
-   **Content:** "Drag and drop CSV files here" or a "Select File" button.
-   **Action:** Simple file selection handler (no complex parsing logic required yet).

---

## Task 6: Implement "Preferences" Tab (Language)
**Objective:** Centralized language settings.

-   **Content:**
    -   **Label:** "Interface Language"
    -   **Control:** A Dropdown / Select menu.
    -   **Options:**
        -   English (`en`)
        -   Arabic (`ar`)
-   **Functionality:**
    -   Changing the selection must immediately trigger the `i18n.changeLanguage()` function.
    -   Persist the selection if possible (local storage or i18n default).
-   **Refactoring:**
    -   **REMOVE** the existing language switcher/icon from the global `Topbar` / Header component. This setting is now exclusive to this tab.
