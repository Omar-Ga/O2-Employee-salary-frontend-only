cat << 'EOF' > pb_hooks/payroll.pb.js
// @ts-check
routerAdd("POST", "/api/payroll/close", (c) => {
    const app = $app;
    let runId;
    app.runInTransaction((txApp) => {
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
        const currentMonth = new Date().toISOString().slice(0, 7); 
        const employees = txApp.findRecordsByFilter("employees", "isArchived = false", "-created", 10000, 0);
        const transactions = txApp.findRecordsByFilter("transactions", "isClosed = false", "-created", 10000, 0);
        const empTxMap = {};
        for (let i = 0; i < transactions.length; i++) {
            const t = transactions[i];
            const empId = t.getString("employeeId");
            if (!empTxMap[empId]) empTxMap[empId] = [];
            empTxMap[empId].push(t);
        }
        const payrollRunsCollection = app.findCollectionByNameOrId("payroll_runs");
        const run = new Record(payrollRunsCollection);
        run.set("period", currentMonth);
        run.set("date", new Date().toISOString());
        run.set("isClosed", true);
        txApp.save(run);
        runId = run.id;

        // Totals accumulators
        let runTotalBasic = 0;
        let runTotalNet = 0;
        let runTotalDeductions = 0;
        let slipCount = 0;

        const payrollSlipsCollection = app.findCollectionByNameOrId("payroll_slips");
        for (let i = 0; i < employees.length; i++) {
            const emp = employees[i];
            const empId = emp.id;
            const empTx = empTxMap[empId] || [];
            let overtimeAmount = 0, bonusAmount = 0, deductionAmount = 0, advanceAmount = 0;
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
                t.set("isClosed", true);
                txApp.save(t);
            }
            const basicSalary = emp.getFloat("monthlySalary");
            const netSalary = basicSalary + overtimeAmount + bonusAmount - deductionAmount - advanceAmount;
            const totalDeductions = deductionAmount + advanceAmount;

            runTotalBasic += basicSalary;
            runTotalNet += netSalary;
            runTotalDeductions += totalDeductions;

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

        // Update Payroll Run with Totals
        run.set("totalBasic", runTotalBasic);
        run.set("totalNet", runTotalNet);
        run.set("totalDeductions", runTotalDeductions);
        run.set("employeeCount", slipCount); // actual slips written, not employees.length
        txApp.save(run);
    });
    return c.json(200, { success: true, runId: runId });
});
EOF


