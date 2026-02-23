// @ts-check
/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/api/payroll/stats", (c) => {
    const app = $app;
    
    // --- Helper: Convert transaction unit to cash (reused logic) ---
    const toCash = (t, employee) => {
        const monthlySalary = employee.getFloat("monthlySalary");
        const workHours = employee.getFloat("workHours");
        // Avoid division by zero
        const hourlyRate = workHours > 0 ? monthlySalary / workHours : 0;
        const dailyRate = monthlySalary / 30;
        
        const unit = t.getString("unit");
        const amount = t.getFloat("amount");

        if (unit === 'cash') return amount;
        if (unit === 'hours') return amount * hourlyRate;
        if (unit === 'days') return amount * dailyRate;
        return 0;
    };

    // --- 1. Fetch Active Employees ---
    const employees = app.findRecordsByFilter(
        "employees",
        "isArchived = false",
        "-created",
        10000, 
        0
    );
    const activeCount = employees.length;

    // --- 2. Fetch Open Transactions ---
    const transactions = app.findRecordsByFilter(
        "transactions",
        "isClosed = false",
        "-created",
        10000, 
        0
    );

    // Group transactions by employeeId for O(1) lookup during loop
    const empTxMap = {};
    for (let i = 0; i < transactions.length; i++) {
        const t = transactions[i];
        const empId = t.getString("employeeId");
        if (!empTxMap[empId]) {
            empTxMap[empId] = [];
        }
        empTxMap[empId].push(t);
    }

    // --- 3. Calculate Projected Totals (Live Preview) ---
    let currentNetTotal = 0;
    let currentDeductionTotal = 0; // Deductions + Advances
    let currentGross = 0;

    for (let i = 0; i < employees.length; i++) {
        const emp = employees[i];
        const empId = emp.id;
        const empTx = empTxMap[empId] || [];

        let overtime = 0;
        let bonus = 0;
        let deduction = 0;
        let advance = 0;

        for (let j = 0; j < empTx.length; j++) {
            const t = empTx[j];
            const cat = t.getString("category");
            const val = toCash(t, emp);

            if (cat === 'overtime') overtime += val;
            else if (cat === 'bonus') bonus += val;
            else if (cat === 'deduction') deduction += val;
            else if (cat === 'advance') advance += val;
        }

        const monthlySalary = emp.getFloat("monthlySalary");
        const totalAdditions = overtime + bonus;
        const totalDeductions = deduction + advance;
        const netSalary = monthlySalary + totalAdditions - totalDeductions;

        currentNetTotal += netSalary;
        currentDeductionTotal += totalDeductions;
        currentGross += monthlySalary;
    }

    // --- 4. Fetch Last Closed Run Totals ---
    let lastRunTotal = 0;
    let lastRunDeductionTotal = 0;
    let lastRunGrossTotal = 0;
    let lastPeriod = null;
    let lastRunId = null;

    try {
        // Find last closed run
        const lastRuns = app.findRecordsByFilter(
            "payroll_runs",
            "isClosed = true",
            "-created",
            1,
            0
        );

        if (lastRuns.length > 0) {
            const lastRun = lastRuns[0];
            lastRunId = lastRun.id;
            lastPeriod = lastRun.getString("period");
            
            // Fetch all slips for this run to aggregate totals
            // Assuming max 10k slips per run. If more, we need pagination or SQL query.
            const slips = app.findRecordsByFilter(
                "payroll_slips",
                "payrollRunId = '" + lastRunId + "'",
                "-created",
                10000, 
                0
            );

            for (let i = 0; i < slips.length; i++) {
                const s = slips[i];
                lastRunTotal += s.getFloat("netSalary");
                // deductionAmount and advanceAmount might be null/undefined? getFloat returns 0 if missing.
                lastRunDeductionTotal += (s.getFloat("deductionAmount") + s.getFloat("advanceAmount"));
                lastRunGrossTotal += s.getFloat("basicSalary");
            }
        }
    } catch (e) {
        // Ignore errors, return 0s
    }

    // --- Calculate Rates ---
    const currentDeductionRate = currentGross > 0 ? (currentDeductionTotal / currentGross) * 100 : 0;
    const lastDeductionRate = lastRunGrossTotal > 0 ? (lastRunDeductionTotal / lastRunGrossTotal) * 100 : 0;
    const deductionRateChange = lastRunId ? (currentDeductionRate - lastDeductionRate) : null;
    
    // Percent Change in Net Total
    const percentChange = lastRunTotal > 0 ? ((currentNetTotal - lastRunTotal) / lastRunTotal) * 100 : null;

    return c.json(200, {
        activeCount,
        currentNetTotal,
        currentDeductionTotal,
        currentGross,
        currentDeductionRate,
        
        lastRunTotal,
        lastPeriod,
        
        percentChange,
        deductionRateChange
    });
});
