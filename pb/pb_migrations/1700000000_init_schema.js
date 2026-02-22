migrate((app) => {
    // Helper function for common fields
    const autodateFields = [
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true }
    ];

    // 1. Departments
    const deps = new Collection({
        type: "base",
        name: "departments",
        fields: [
            ...autodateFields,
            { name: "name", type: "text", required: true },
            { name: "type", type: "select", values: ["structural", "functional"], required: true, maxSelect: 1 }
        ],
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''"
    });
    app.save(deps);

    // Add self-referencing relation after creation
    deps.fields.add(new RelationField({ name: "parentId", collectionId: deps.id, cascadeDelete: false, maxSelect: 1 }));
    app.save(deps);

    // 2. Employees
    const emps = new Collection({
        type: "base",
        name: "employees",
        fields: [
            ...autodateFields,
            { name: "name", type: "text", required: true },
            { name: "email", type: "email", required: true },
            { name: "nationalId", type: "text", required: true },
            { name: "phone", type: "text", required: true },
            { name: "jobTitle", type: "text", required: true },
            { name: "department", type: "relation", collectionId: deps.id, required: true, cascadeDelete: false, maxSelect: 1 },
            { name: "monthlySalary", type: "number", required: true },
            { name: "workHours", type: "number", required: true },
            { name: "isArchived", type: "bool" },
            { name: "grade", type: "select", values: ["Excellent", "Good", "Bad"], maxSelect: 1 },
            { name: "scores", type: "json" }
        ],
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''"
    });
    app.save(emps);

    // 3. Transactions
    const trans = new Collection({
        type: "base",
        name: "transactions",
        fields: [
            ...autodateFields,
            { name: "employeeId", type: "relation", collectionId: emps.id, required: true, cascadeDelete: true, maxSelect: 1 },
            { name: "date", type: "date", required: true },
            { name: "isClosed", type: "bool" },
            { name: "category", type: "select", values: ["overtime", "deduction", "bonus", "advance"], required: true, maxSelect: 1 },
            { name: "type", type: "select", values: ["addition", "deduction"], required: true, maxSelect: 1 },
            { name: "unit", type: "select", values: ["hours", "days", "cash"], required: true, maxSelect: 1 },
            { name: "amount", type: "number", required: true },
            { name: "reason", type: "text" }
        ],
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''"
    });
    app.save(trans);

    // 4. Payroll Runs
    const runs = new Collection({
        type: "base",
        name: "payroll_runs",
        fields: [
            ...autodateFields,
            { name: "period", type: "text", required: true },
            { name: "date", type: "date", required: true },
            { name: "isClosed", type: "bool" }
        ],
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''"
    });
    app.save(runs);

    // 5. Payroll Slips
    const slips = new Collection({
        type: "base",
        name: "payroll_slips",
        fields: [
            ...autodateFields,
            { name: "payrollRunId", type: "relation", collectionId: runs.id, required: true, cascadeDelete: true, maxSelect: 1 },
            { name: "employeeId", type: "relation", collectionId: emps.id, required: true, cascadeDelete: false, maxSelect: 1 },
            { name: "departmentId", type: "relation", collectionId: deps.id, required: true, cascadeDelete: false, maxSelect: 1 },
            { name: "basicSalary", type: "number" },
            { name: "hourlyRate", type: "number" },
            { name: "additions", type: "number" },
            { name: "deductions", type: "number" },
            { name: "netSalary", type: "number" },
            { name: "transactions", type: "relation", collectionId: trans.id, maxSelect: null }
        ],
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''"
    });
    app.save(slips);

}, (app) => {
    app.delete(app.findCollectionByNameOrId("payroll_slips"));
    app.delete(app.findCollectionByNameOrId("payroll_runs"));
    app.delete(app.findCollectionByNameOrId("transactions"));
    app.delete(app.findCollectionByNameOrId("employees"));
    app.delete(app.findCollectionByNameOrId("departments"));
})
