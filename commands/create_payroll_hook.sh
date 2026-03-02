cat << 'EOF' > pb_hooks/payroll.pb.js
// @ts-check
/// <reference path="../pb_data/types.d.ts" />

/**
 * --- SHARED HELPERS ---
 */

// Convert transaction unit to cash value based on employee salary
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

// Calculate slip details for an employee
const calculateSlip = (emp, empTransactions) => {
    let overtime = 0, bonus = 0, deduction = 0, advance = 0;
    const txIds = [];

    for (let i = 0; i < empTransactions.length; i++) {
        const t = empTransactions[i];
        const cat = t.getString("category");
        const val = toCash(t, emp);
        if (cat === 'overtime') overtime += val;
        else if (cat === 'bonus') bonus += val;
        else if (cat === 'deduction') deduction += val;
        else if (cat === 'advance') advance += val;
        txIds.push(t.id);
    }

    const basicSalary = emp.getFloat("monthlySalary");
    const additions = overtime + bonus;
    const deductions = deduction + advance;
    const netSalary = basicSalary + additions - deductions;

    return {
        employeeId: emp.id,
        name: emp.getString("name"),
        jobTitle: emp.getString("jobTitle"),
        departmentId: emp.getString("department"),
        basicSalary,
        overtimeAmount: overtime,
        bonusAmount: bonus,
        deductionAmount: deduction,
        advanceAmount: advance,
        additions,
        deductions,
        netSalary,
        txIds
    };
};

/**
 * --- ROUTES ---
 */

// 1. GET /api/payroll/stats - Dashboard summary
routerAdd("GET", "/api/payroll/stats", (c) => {
    const app = $app;
    const employees = app.findRecordsByFilter("employees", "isArchived = false", "-created", 10000, 0);
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
        const slip = calculateSlip(emp, empTxMap[emp.id] || []);
        currentNetTotal += slip.netSalary;
        currentDeductionTotal += slip.deductions;
        currentGross += slip.basicSalary;
    }

    let lastRunTotal = 0, lastPeriod = null;
    try {
        const lastRuns = app.findRecordsByFilter("payroll_runs", "isClosed = true", "-created", 1, 0);
        if (lastRuns.length > 0) {
            lastRunTotal = lastRuns[0].getFloat("totalNet");
            lastPeriod = lastRuns[0].getString("period");
        }
    } catch (e) {}

    return c.json(200, {
        activeCount: employees.length,
        currentNetTotal,
        currentDeductionTotal,
        currentGross,
        lastRunTotal,
        lastPeriod
    });
});

// 2. GET /api/payroll/preview - Detailed run preview grouped by department
routerAdd("GET", "/api/payroll/preview", (e) => {
    const app = $app;
    const allDepts = app.findRecordsByFilter("departments", "id != ''", "created", 10000, 0);
    const structuralDepts = [], functionalDepts = [], deptMap = {};

    for (let i = 0; i < allDepts.length; i++) {
        const d = allDepts[i];
        deptMap[d.id] = d;
        if (d.getString("type") === "structural") structuralDepts.push(d);
        else functionalDepts.push(d);
    }

    const parentToSubs = {}, subToParent = {};
    for (let i = 0; i < structuralDepts.length; i++) parentToSubs[structuralDepts[i].id] = [];
    for (let i = 0; i < functionalDepts.length; i++) {
        const sub = functionalDepts[i], pid = sub.getString("parentId");
        if (pid && parentToSubs[pid]) {
            parentToSubs[pid].push(sub.id);
            subToParent[sub.id] = pid;
        }
    }

    const employees = app.findRecordsByFilter("employees", "isArchived = false", "-created", 10000, 0);
    const transactions = app.findRecordsByFilter("transactions", "isClosed = false", "-created", 10000, 0);

    const empTxMap = {};
    for (let i = 0; i < transactions.length; i++) {
        const t = transactions[i], empId = t.getString("employeeId");
        if (!empTxMap[empId]) empTxMap[empId] = [];
        empTxMap[empId].push(t);
    }

    const groupData = {};
    for (let i = 0; i < structuralDepts.length; i++) {
        const pid = structuralDepts[i].id;
        groupData[pid] = { "_unassigned": [] };
        const subs = parentToSubs[pid] || [];
        for (let j = 0; j < subs.length; j++) groupData[pid][subs[j]] = [];
    }
    groupData["other"] = { "_unassigned": [] };

    let globalBasic = 0, globalNet = 0;

    for (let i = 0; i < employees.length; i++) {
        const emp = employees[i], deptId = emp.getString("department");
        const slip = calculateSlip(emp, empTxMap[emp.id] || []);
        globalBasic += slip.basicSalary;
        globalNet += slip.netSalary;

        const parentId = subToParent[deptId];
        if (parentId && groupData[parentId]) {
            if (groupData[parentId][deptId]) groupData[parentId][deptId].push(slip);
            else groupData[parentId][deptId] = [slip];
        } else if (groupData[deptId]) {
            groupData[deptId]["_unassigned"].push(slip);
        } else {
            groupData["other"]["_unassigned"].push(slip);
        }
    }

    const departmentGroups = [];
    for (let i = 0; i < structuralDepts.length; i++) {
        const parent = structuralDepts[i], pid = parent.id, subGroups = [];
        let pBasic = 0, pNet = 0, pCount = 0;

        const subIds = parentToSubs[pid] || [];
        for (let j = 0; j < subIds.length; j++) {
            const sid = subIds[j], slips = groupData[pid][sid] || [];
            if (slips.length === 0) continue;
            let sBasic = 0, sNet = 0;
            for (let k = 0; k < slips.length; k++) { sBasic += slips[k].basicSalary; sNet += slips[k].netSalary; }
            pBasic += sBasic; pNet += sNet; pCount += slips.length;
            subGroups.push({ id: sid, label: deptMap[sid]?.getString("name") || sid, totalBasic: sBasic, totalNet: sNet, employeeCount: slips.length, slips });
        }

        const unassigned = groupData[pid]["_unassigned"] || [];
        if (unassigned.length > 0) {
            let uBasic = 0, uNet = 0;
            for (let k = 0; k < unassigned.length; k++) { uBasic += unassigned[k].basicSalary; uNet += unassigned[k].netSalary; }
            pBasic += uBasic; pNet += uNet; pCount += unassigned.length;
            subGroups.push({ id: "_unassigned", label: "Other", totalBasic: uBasic, totalNet: uNet, employeeCount: unassigned.length, slips: unassigned });
        }

        if (pCount > 0) departmentGroups.push({ id: pid, label: parent.getString("name"), totalBasic: pBasic, totalNet: pNet, employeeCount: pCount, subGroups });
    }

    const otherSlips = groupData["other"]["_unassigned"] || [];
    if (otherSlips.length > 0) {
        let oBasic = 0, oNet = 0;
        for (let k = 0; k < otherSlips.length; k++) { oBasic += otherSlips[k].basicSalary; oNet += otherSlips[k].netSalary; }
        departmentGroups.push({ id: "other", label: "Other", totalBasic: oBasic, totalNet: oNet, employeeCount: otherSlips.length, subGroups: [{ id: "_other", label: "Other", totalBasic: oBasic, totalNet: oNet, employeeCount: otherSlips.length, slips: otherSlips }] });
    }

    return e.json(200, { globalBasic, globalNet, employeeCount: employees.length, departmentGroups });
});

// 3. POST /api/payroll/close - Close month and generate slips
routerAdd("POST", "/api/payroll/close", (c) => {
    const app = $app;
    let runId;

    app.runInTransaction((txApp) => {
        const employees = txApp.findRecordsByFilter("employees", "isArchived = false", "-created", 10000, 0);
        const transactions = txApp.findRecordsByFilter("transactions", "isClosed = false", "-created", 10000, 0);

        const empTxMap = {};
        for (let i = 0; i < transactions.length; i++) {
            const t = transactions[i], eid = t.getString("employeeId");
            if (!empTxMap[eid]) empTxMap[eid] = [];
            empTxMap[eid].push(t);
        }

        const runRecord = new Record(app.findCollectionByNameOrId("payroll_runs"));
        runRecord.set("period", new Date().toISOString().slice(0, 7));
        runRecord.set("date", new Date().toISOString());
        runRecord.set("isClosed", true);
        txApp.save(runRecord);
        runId = runRecord.id;

        let totalBasic = 0, totalNet = 0, totalDeductions = 0, slipCount = 0;
        const slipsColl = app.findCollectionByNameOrId("payroll_slips");

        for (let i = 0; i < employees.length; i++) {
            const emp = employees[i];
            const slipData = calculateSlip(emp, empTxMap[emp.id] || []);

            // Close transactions
            const empTxs = empTxMap[emp.id] || [];
            for (let j = 0; j < empTxs.length; j++) {
                empTxs[j].set("isClosed", true);
                txApp.save(empTxs[j]);
            }

            const slip = new Record(slipsColl);
            slip.set("payrollRunId", runId);
            slip.set("employeeId", slipData.employeeId);
            slip.set("departmentId", slipData.departmentId);
            slip.set("basicSalary", slipData.basicSalary);
            slip.set("overtimeAmount", slipData.overtimeAmount);
            slip.set("bonusAmount", slipData.bonusAmount);
            slip.set("deductionAmount", slipData.deductionAmount);
            slip.set("advanceAmount", slipData.advanceAmount);
            slip.set("netSalary", slipData.netSalary);
            slip.set("transactions", slipData.txIds);
            txApp.save(slip);

            totalBasic += slipData.basicSalary;
            totalNet += slipData.netSalary;
            totalDeductions += slipData.deductions;
            slipCount++;
        }

        runRecord.set("totalBasic", totalBasic);
        runRecord.set("totalNet", totalNet);
        runRecord.set("totalDeductions", totalDeductions);
        runRecord.set("employeeCount", slipCount);
        txApp.save(runRecord);
    });

    return c.json(200, { success: true, runId });
});

// 4. POST /api/payroll/restore - Revert a closed payroll run
routerAdd("POST", "/api/payroll/restore", (e) => {
    const runId = e.requestInfo().query["runId"];
    if (!runId) throw new BadRequestError("runId is required");

    let slipCount = 0, txCount = 0;
    $app.runInTransaction((txApp) => {
        const run = txApp.findRecordById("payroll_runs", runId);
        const slips = txApp.findRecordsByFilter("payroll_slips", 'payrollRunId = "' + runId + '"', "", 10000, 0);
        slipCount = slips.length;

        for (let i = 0; i < slips.length; i++) {
            const txIds = slips[i].getStringSlice("transactions") || [];
            for (let j = 0; j < txIds.length; j++) {
                try {
                    const tx = txApp.findRecordById("transactions", txIds[j]);
                    tx.set("isClosed", false);
                    txApp.save(tx);
                    txCount++;
                } catch (err) {}
            }
        }
        txApp.delete(run);
    });

    return e.json(200, { success: true, slipsFound: slipCount, transactionsRestored: txCount });
});
EOF
