migrate((app) => {
    const collections = [
        // 1. Departments
        {
            type: "base",
            name: "departments",
            schema: [
                { name: "name", type: "text", required: true },
                { name: "parentId", type: "relation", collectionId: "departments", cascadeDelete: false },
                { name: "type", type: "select", options: { values: ["structural", "functional"] }, required: true }
            ],
            listRule: "@request.auth.id != ''",
            viewRule: "@request.auth.id != ''"
        },
        // 2. Employees
        {
            type: "base",
            name: "employees",
            schema: [
                { name: "name", type: "text", required: true },
                { name: "email", type: "email", required: true },
                { name: "nationalId", type: "text", required: true },
                { name: "phone", type: "text", required: true },
                { name: "jobTitle", type: "text", required: true },
                { name: "department", type: "relation", collectionId: "departments", required: true, cascadeDelete: false },
                { name: "monthlySalary", type: "number", required: true },
                { name: "workHours", type: "number", required: true },
                { name: "isArchived", type: "bool" },
                { name: "grade", type: "select", options: { values: ["Excellent", "Good", "Bad"] } },
                { name: "scores", type: "json" }
            ],
            listRule: "@request.auth.id != ''",
            viewRule: "@request.auth.id != ''",
            createRule: "@request.auth.id != ''",
            updateRule: "@request.auth.id != ''"
        },
        // 3. Transactions
        {
            type: "base",
            name: "transactions",
            schema: [
                { name: "employeeId", type: "relation", collectionId: "employees", required: true, cascadeDelete: true },
                { name: "date", type: "date", required: true },
                { name: "isClosed", type: "bool" },
                { name: "category", type: "select", options: { values: ["overtime", "deduction", "bonus", "advance"] }, required: true },
                { name: "type", type: "select", options: { values: ["addition", "deduction"] }, required: true },
                { name: "unit", type: "select", options: { values: ["hours", "days", "cash"] }, required: true },
                { name: "amount", type: "number", required: true },
                { name: "reason", type: "text" }
            ],
            listRule: "@request.auth.id != ''",
            viewRule: "@request.auth.id != ''",
            createRule: "@request.auth.id != ''",
            updateRule: "@request.auth.id != ''",
            deleteRule: "@request.auth.id != ''"
        },
        // 4. Payroll Runs
        {
            type: "base",
            name: "payroll_runs",
            schema: [
                { name: "period", type: "text", required: true }, // e.g. "2023-10"
                { name: "date", type: "date", required: true },
                { name: "isClosed", type: "bool" }
            ],
            listRule: "@request.auth.id != ''",
            viewRule: "@request.auth.id != ''",
            createRule: "@request.auth.id != ''",
            updateRule: "@request.auth.id != ''"
        },
        // 5. Payroll Slips
        {
            type: "base",
            name: "payroll_slips",
            schema: [
                { name: "payrollRunId", type: "relation", collectionId: "payroll_runs", required: true, cascadeDelete: true },
                { name: "employeeId", type: "relation", collectionId: "employees", required: true, cascadeDelete: false },
                { name: "departmentId", type: "relation", collectionId: "departments", required: true, cascadeDelete: false },
                { name: "basicSalary", type: "number" },
                { name: "hourlyRate", type: "number" },
                { name: "additions", type: "number" },
                { name: "deductions", type: "number" },
                { name: "netSalary", type: "number" },
                { name: "transactions", type: "relation", collectionId: "transactions", maxSelect: null } // multiple
            ],
            listRule: "@request.auth.id != ''",
            viewRule: "@request.auth.id != ''"
        }
    ];

    return app.importCollections(collections, false); // false = don't delete other collections
}, (app) => {
    return null;
})
