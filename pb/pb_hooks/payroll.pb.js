// @ts-check
/// <reference path="../pb_data/types.d.ts" />

routerAdd("POST", "/api/payroll/close", (c) => {
    const app = $app;
    let runId;

    // --- READ BODY ---
    const body = c.requestInfo().body;
    const period = body ? body["period"] : null;

    // Validate period format (YYYY-MM)
    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
        return c.json(400, { message: "Valid period (YYYY-MM) is required." });
    }

    // GUARD: Block duplicate closes for the same period
    const existingRuns = app.findRecordsByFilter(
        "payroll_runs",
        "period = {:period} && isClosed = true",
        "",
        1,
        0,
        { period: period }
    );
    if (existingRuns.length > 0) {
        return c.json(400, {
            message: "A closed payroll run already exists for this period. Revert it first."
        });
    }

    // Wrap everything in a transaction for atomicity
    app.runInTransaction((txApp) => {
        // --- PREPARATION ---

        // Helper: Convert transaction unit to cash
        const toCash = (t, employee) => {
            const hourlyRate = employee.getFloat("monthlySalary") / employee.getFloat("workHours");
            const dailyRate = employee.getFloat("monthlySalary") / 30;
            const unit = t.getString("unit");
            const amount = t.getFloat("amount");

            if (unit === 'cash') return amount;
            if (unit === 'hours') return amount * hourlyRate;
            if (unit === 'days') return amount * dailyRate;
            return 0;
        };

        // --- FETCH DATA ---

        // Fetch all active employees
        // Using a generous limit of 10,000 to cover all active employees in typical usage.
        const employees = txApp.findRecordsByFilter(
            "employees",
            "isArchived = false",
            "-created",
            10000,
            0
        );

        // Fetch all open transactions
        const transactions = txApp.findRecordsByFilter(
            "transactions",
            "isClosed = false",
            "-created",
            10000,
            0
        );

        // Optimization: Group transactions by employeeId
        const empTxMap = {};

        // Iterate transactions
        // Note: JSVM Goja arrays can be iterated with standard loops
        for (let i = 0; i < transactions.length; i++) {
            const t = transactions[i];
            const empId = t.getString("employeeId");
            if (!empTxMap[empId]) {
                empTxMap[empId] = [];
            }
            empTxMap[empId].push(t);
        }

        // --- EXECUTION ---

        // 1. Create Payroll Run
        const payrollRunsCollection = app.findCollectionByNameOrId("payroll_runs");
        const run = new Record(payrollRunsCollection);
        run.set("period", period);
        run.set("date", new Date().toISOString());
        run.set("isClosed", true);
        txApp.save(run);

        runId = run.id;

        // Totals accumulators
        let runTotalBasic = 0;
        let runTotalNet = 0;
        let runTotalDeductions = 0;
        let slipCount = 0;

        // 2. Create Payroll Slips and Update Transactions
        const payrollSlipsCollection = app.findCollectionByNameOrId("payroll_slips");

        for (let i = 0; i < employees.length; i++) {
            const emp = employees[i];
            const empId = emp.id;

            const empTx = empTxMap[empId] || [];

            // Calculate totals
            let overtimeAmount = 0;
            let bonusAmount = 0;
            let deductionAmount = 0;
            let advanceAmount = 0;

            const txIds = [];

            for (let j = 0; j < empTx.length; j++) {
                const t = empTx[j];
                const cat = t.getString("category");
                const val = toCash(t, emp);

                if (cat === 'overtime') overtimeAmount += val;
                else if (cat === 'bonus') bonusAmount += val;
                else if (cat === 'deduction') deductionAmount += val;
                else if (cat === 'advance') advanceAmount += val;

                txIds.push(t.id);

                // Mark transaction as closed
                t.set("isClosed", true);
                txApp.save(t);
            }

            const totalAdditions = overtimeAmount + bonusAmount;
            const totalDeductions = deductionAmount + advanceAmount;
            const basicSalary = emp.getFloat("monthlySalary");
            const netSalary = basicSalary + totalAdditions - totalDeductions;

            runTotalBasic += basicSalary;
            runTotalNet += netSalary;
            runTotalDeductions += totalDeductions;

            // Create Slip
            const slip = new Record(payrollSlipsCollection);
            slip.set("payrollRunId", runId);
            slip.set("employeeId", empId);
            slip.set("departmentId", emp.getString("department"));
            slip.set("basicSalary", basicSalary);
            slip.set("overtimeAmount", overtimeAmount);
            slip.set("bonusAmount", bonusAmount);
            slip.set("deductionAmount", deductionAmount);
            slip.set("advanceAmount", advanceAmount);
            slip.set("netSalary", netSalary);
            slip.set("transactions", txIds);

            txApp.save(slip);
            slipCount++;
        }

        // 3. Update Payroll Run with Totals
        run.set("totalBasic", runTotalBasic);
        run.set("totalNet", runTotalNet);
        run.set("totalDeductions", runTotalDeductions);
        run.set("employeeCount", slipCount); // Use actual slip count, not employees.length
        txApp.save(run);

    });

    return c.json(200, { success: true, runId: runId });
});

routerAdd("POST", "/api/payroll/revert", (c) => {
    const app = $app;

    // --- READ BODY ---
    const body = c.requestInfo().body;
    const runId = body ? body["runId"] : null;

    if (!runId) {
        return c.json(400, { message: "runId is required." });
    }

    // --- FETCH & VALIDATE RUN ---
    let run;
    try {
        run = app.findRecordById("payroll_runs", runId);
    } catch (e) {
        return c.json(404, { message: "Payroll run not found." });
    }

    // Enforce 10-day revert window (based on the requested run)
    const createdDate = new Date(run.getString("created"));
    const now = new Date();
    const diffDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 10) {
        return c.json(400, { message: "This payroll run is older than 10 days and cannot be reverted." });
    }

    // --- ATOMIC REVERT (SINGLE RUN) ---
    let transactionsRestored = 0;

    app.runInTransaction((txApp) => {
        // 1. Fetch all slips for this specific run
        const slips = txApp.findRecordsByFilter(
            "payroll_slips",
            "payrollRunId = {:runId}",
            "",
            10000,
            0,
            { runId: runId }
        );

        // 2. Collect ALL transaction IDs from all slips (before any deletes)
        const allTxIds = [];
        for (let i = 0; i < slips.length; i++) {
            const slip = slips[i];
            if (!slip) continue;

            const rawValue = slip.get("transactions");

            // CRITICAL: PocketBase Goja returns a string for single-value relations
            // and an array for multi-value relations. Normalize to always be an array.
            let txIds = [];
            if (typeof rawValue === "string" && rawValue.length > 0) {
                txIds = [rawValue];
            } else if (rawValue && typeof rawValue === "object" && rawValue.length > 0) {
                for (let j = 0; j < rawValue.length; j++) {
                    txIds.push(rawValue[j]);
                }
            }

            for (let j = 0; j < txIds.length; j++) {
                allTxIds.push(txIds[j]);
            }
        }

        // 3. Reopen ALL transactions for this run
        for (let k = 0; k < allTxIds.length; k++) {
            try {
                const tx = txApp.findRecordById("transactions", allTxIds[k]);
                if (tx) {
                    tx.set("isClosed", false);
                    txApp.save(tx);
                    transactionsRestored++;
                }
            } catch (e) {
                // Transaction may have been manually deleted — skip safely
            }
        }

        // 4. Delete this run (cascade-deletes all its slips)
        txApp.delete(run);
    });

    return c.json(200, {
        success: true,
        message: "Payroll run reverted.",
        transactionsRestored: transactionsRestored
    });
});

routerAdd("POST", "/api/payroll/delete", (c) => {
    const app = $app;

    // --- READ BODY ---
    const body = c.requestInfo().body;
    const runId = body ? body["runId"] : null;

    if (!runId) {
        return c.json(400, { message: "runId is required." });
    }

    // --- FETCH & VALIDATE RUN ---
    let run;
    try {
        run = app.findRecordById("payroll_runs", runId);
    } catch (e) {
        return c.json(404, { message: "Payroll run not found." });
    }

    // Enforce 10-day delete window
    const createdDate = new Date(run.getString("created"));
    const now = new Date();
    const diffDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 10) {
        return c.json(400, { message: "This payroll run is older than 10 days and cannot be deleted." });
    }

    // --- ATOMIC DELETE (PERMANENT) ---
    let transactionsDeleted = 0;

    app.runInTransaction((txApp) => {
        // 1. Fetch all slips for this run
        const slips = txApp.findRecordsByFilter(
            "payroll_slips",
            "payrollRunId = {:runId}",
            "",
            10000,
            0,
            { runId: runId }
        );

        // 2. Collect ALL transaction IDs from all slips
        const allTxIds = [];
        for (let i = 0; i < slips.length; i++) {
            const slip = slips[i];
            if (!slip) continue;

            const rawValue = slip.get("transactions");

            let txIds = [];
            if (typeof rawValue === "string" && rawValue.length > 0) {
                txIds = [rawValue];
            } else if (rawValue && typeof rawValue === "object" && rawValue.length > 0) {
                for (let j = 0; j < rawValue.length; j++) {
                    txIds.push(rawValue[j]);
                }
            }

            for (let j = 0; j < txIds.length; j++) {
                allTxIds.push(txIds[j]);
            }
        }

        // 3. PERMANENTLY DELETE all transactions (not reopen — destroy)
        for (let k = 0; k < allTxIds.length; k++) {
            try {
                const tx = txApp.findRecordById("transactions", allTxIds[k]);
                if (tx) {
                    txApp.delete(tx);
                    transactionsDeleted++;
                }
            } catch (e) {
                // Transaction may have been manually deleted — skip safely
            }
        }

        // 4. Delete this run (cascade-deletes all its slips)
        txApp.delete(run);
    });

    return c.json(200, {
        success: true,
        message: "Payroll run permanently deleted.",
        transactionsDeleted: transactionsDeleted
    });
});
