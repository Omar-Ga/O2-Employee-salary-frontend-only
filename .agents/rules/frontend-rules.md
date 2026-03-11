---
trigger: model_decision
description: When building, editing, or reviewing any frontend UI — components, layouts, forms, modals, tables, buttons, inputs, or any visual element. Always check Chakra UI MCP tools before writing custom code.
---

Always Use Chakra UI MCP + Frontend Design Skill for Frontend Work

## Directive

For **any and all frontend UI development tasks** in this project, you MUST:
1. First read and apply the **`frontend-design` skill** (located at `.agents/skills/frontend-design/SKILL.md`) to establish a bold, intentional aesthetic direction.
2. Then consult and leverage the **Chakra UI MCP server** and its tools to implement that direction using the correct components — **before writing any component or UI element from scratch**.

---

## Mandatory Workflow for Any UI Task

1. **Apply the frontend-design skill first.** Read `.agents/skills/frontend-design/SKILL.md` and commit to a clear, bold, and intentional aesthetic direction before writing a single line of code. This skill defines how the UI should *feel* — the component library defines how it is *built*.

2. **Check component availability.** Before building any UI element, call `mcp_chakra-ui_list_components` to confirm whether Chakra UI provides a native component for the use case.

3. **Read the component docs.** If a relevant Chakra UI component exists, you MUST call `mcp_chakra-ui_get_component_example` and/or `mcp_chakra-ui_get_component_props` to understand its API, variants, and correct usage patterns before writing any code.

4. **Check the theme before using raw values.** For colors, spacing, fonts, radii, or any design token, call `mcp_chakra-ui_get_theme` to use the existing theme system. Never hardcode arbitrary values that should map to a design token.

5. **Customize the theme, not the component.** If a component's default styling does not match the design requirements, use `mcp_chakra-ui_customize_theme` to extend or override theme tokens. Do not wrap components in custom CSS or override styles manually unless absolutely necessary.

6. **Review generated code for API correctness.** After writing any Chakra UI component code, call `mcp_chakra-ui_v2_to_v3_code_review` for the relevant migration scenario to ensure the code is using the Chakra UI v3 API correctly and avoid hallucinated or outdated patterns.

---

## When Custom Code Is Permitted

You are **only** allowed to build a custom component or UI element from scratch if **both** of the following conditions are met:

- ✅ The Chakra UI component library has been verified (via MCP tools) to **not provide** a native equivalent.
- ✅ The element is **highly specific to the business domain** and cannot reasonably be composed from Chakra UI primitives (e.g., `Box`, `Flex`, `Stack`, `Grid`, etc.).

Even in this case, use Chakra UI primitive layout components (`Box`, `Flex`, `Grid`, `Stack`, etc.) as the **building blocks** for any custom element.

---

## Rationale

This rule exists to guarantee that all UI work in this project is both **visually distinctive** and **technically consistent**. The two tools work in tandem:

- The **`frontend-design` skill** ensures the AI commits to a real, intentional aesthetic rather than producing generic, forgettable "AI slop" — it governs *what* is designed.
- The **Chakra UI MCP** ensures the correct, version-accurate components are used rather than hand-rolled elements that duplicate existing work — it governs *how* it is built.

Neither tool is optional. Skipping the skill produces technically correct but aesthetically mediocre results. Skipping the MCP produces visually bold but inconsistent, brittle, or deprecated code. Both must be applied on every frontend task.