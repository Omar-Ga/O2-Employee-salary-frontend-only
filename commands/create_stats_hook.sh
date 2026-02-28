cat << 'EOF' > pb_hooks/stats.pb.js
// @ts-check
routerAdd("GET", "/api/payroll/stats", (c) => {
    const app = $app;
    const toCash = (t, employee) => {
        const monthlySalary = employee.getFloat("monthlySalary");
        const workHours = employee.getFloat("workHours");
        const hourlyRate = workHours > 0 ? monthlySalary / workHours : 0;
        const dailyRate = monthlySalary / 30;
        const unit = t.getString("unit");
        const amount = t.getFloat("amount");
        if (unit === 'cash') return amount;
        if (unit === 'hours') return amount * hourlyRate;
        if (unit === 'days') return amount * dailyRate;
        return 0;
    };
    const employees = app.findRecordsByFilter("employees", "isArchived = false", "-created", 10000, 0);
    const activeCount = employees.length;
    const transactions = app.findRecordsByFilter("transactions", "isClosed = false", "-created", 10000, 0);
    const empTxMap = {};
    for (let i = 0; i < transactions.length; i++) {
        const t = transactions[i];
        const empId = t.getString("employeeId");
        if (!empTxMap[empId]) empTxMap[empId] = [];
        empTxMap[empId].push(t);
    }
    let currentNetTotal = 0, currentDeductionTotal = 0, currentGross = 0;
    for (let i = 0; i < employees.length; i++) {
        const emp = employees[i];
        const empId = emp.id;
        const empTx = empTxMap[empId] || [];
        let overtime = 0, bonus = 0, deduction = 0, advance = 0;
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
        currentNetTotal += (monthlySalary + overtime + bonus - deduction - advance);
        currentDeductionTotal += (deduction + advance);
        currentGross += monthlySalary;
    }
    let lastRunTotal = 0;
    let lastPeriod = null;
    try {
        const lastRuns = app.findRecordsByFilter("payroll_runs", "isClosed = true", "-created", 1, 0);
        if (lastRuns.length > 0) {
            const lastRun = lastRuns[0];
            lastRunTotal = lastRun.getFloat("totalNet");
            lastPeriod = lastRun.getString("period");
        }
    } catch (e) {}
    return c.json(200, {
        activeCount, currentNetTotal, currentDeductionTotal, currentGross, lastRunTotal, lastPeriod
    });
});
EOF

