// @ts-check
/// <reference path="../pb_data/types.d.ts" />

routerAdd("POST", "/api/payroll/close", (c) => {
    const app = $app;
    let runId;

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

        const currentMonth = new Date().toISOString().slice(0, 7); // yyyy-MM
        
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
        run.set("period", currentMonth);
        run.set("date", new Date().toISOString());
        run.set("isClosed", true);
        txApp.save(run);
        
        runId = run.id;

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
        }

    });

    return c.json(200, { success: true, runId: runId });
});
