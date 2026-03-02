cat << 'EOF' > pb_hooks/payroll.pb.js
// @ts-check
/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/api/payroll/preview", (e) => {
    const app = $app;

    // --- Helper: Convert transaction unit to cash ---
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

    // --- 1. Fetch departments ---
    const allDepts = app.findRecordsByFilter("departments", "id != ''", "created", 10000, 0);
    const structuralDepts = [];
    const functionalDepts = [];
    const deptMap = {}; // id -> record

    for (let i = 0; i < allDepts.length; i++) {
        const d = allDepts[i];
        deptMap[d.id] = d;
        if (d.getString("type") === "structural") {
            structuralDepts.push(d);
        } else {
            functionalDepts.push(d);
        }
    }

    // Build parentId -> [sub dept ids] map
    const parentToSubs = {};
    for (let i = 0; i < structuralDepts.length; i++) {
        parentToSubs[structuralDepts[i].id] = [];
    }
    // Build subId -> parentId map
    const subToParent = {};
    for (let i = 0; i < functionalDepts.length; i++) {
        const sub = functionalDepts[i];
        const pid = sub.getString("parentId");
        if (pid && parentToSubs[pid]) {
            parentToSubs[pid].push(sub.id);
            subToParent[sub.id] = pid;
        }
    }

    // --- 2. Fetch active employees ---
    const employees = app.findRecordsByFilter("employees", "isArchived = false", "-created", 10000, 0);

    // --- 3. Fetch open transactions ---
    const transactions = app.findRecordsByFilter("transactions", "isClosed = false", "-created", 10000, 0);

    // Group transactions by employeeId
    const empTxMap = {};
    for (let i = 0; i < transactions.length; i++) {
        const t = transactions[i];
        const empId = t.getString("employeeId");
        if (!empTxMap[empId]) empTxMap[empId] = [];
        empTxMap[empId].push(t);
    }

    // --- 4. Calculate per-employee slips and group ---
    // Structure: parentId -> { subId -> [slips] }
    const groupData = {};
    for (let i = 0; i < structuralDepts.length; i++) {
        const pid = structuralDepts[i].id;
        groupData[pid] = {};
        const subs = parentToSubs[pid] || [];
        for (let j = 0; j < subs.length; j++) {
            groupData[pid][subs[j]] = [];
        }
        groupData[pid]["_unassigned"] = []; // employees in structural dept directly
    }
    groupData["other"] = { "_unassigned": [] }; // fallback

    let globalBasic = 0;
    let globalNet = 0;

    for (let i = 0; i < employees.length; i++) {
        const emp = employees[i];
        const empId = emp.id;
        const deptId = emp.getString("department");
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

        const basicSalary = emp.getFloat("monthlySalary");
        const totalAdditions = overtime + bonus;
        const totalDeductions = deduction + advance;
        const netSalary = basicSalary + totalAdditions - totalDeductions;

        globalBasic += basicSalary;
        globalNet += netSalary;

        const slip = {
            employeeId: empId,
            name: emp.getString("name"),
            jobTitle: emp.getString("jobTitle"),
            departmentId: deptId,
            basicSalary: basicSalary,
            overtimeAmount: overtime,
            bonusAmount: bonus,
            deductionAmount: deduction,
            advanceAmount: advance,
            additions: totalAdditions,
            deductions: totalDeductions,
            netSalary: netSalary
        };

        // Determine which parent group this employee falls into
        const parentId = subToParent[deptId];
        if (parentId && groupData[parentId]) {
            if (groupData[parentId][deptId]) {
                groupData[parentId][deptId].push(slip);
            } else {
                groupData[parentId][deptId] = [slip];
            }
        } else if (groupData[deptId]) {
            // Employee is assigned directly to a structural dept
            groupData[deptId]["_unassigned"].push(slip);
        } else {
            // Fallback: unknown department
            groupData["other"]["_unassigned"].push(slip);
        }
    }

    // --- 5. Build response ---
    const departmentGroups = [];

    for (let i = 0; i < structuralDepts.length; i++) {
        const parent = structuralDepts[i];
        const pid = parent.id;
        const subGroups = [];
        let parentBasic = 0;
        let parentNet = 0;
        let parentCount = 0;

        const subIds = parentToSubs[pid] || [];
        for (let j = 0; j < subIds.length; j++) {
            const sid = subIds[j];
            const slips = (groupData[pid] && groupData[pid][sid]) ? groupData[pid][sid] : [];
            if (slips.length === 0) continue;

            let subBasic = 0;
            let subNet = 0;
            for (let k = 0; k < slips.length; k++) {
                subBasic += slips[k].basicSalary;
                subNet += slips[k].netSalary;
            }

            parentBasic += subBasic;
            parentNet += subNet;
            parentCount += slips.length;

            subGroups.push({
                id: sid,
                label: deptMap[sid] ? deptMap[sid].getString("name") : sid,
                totalBasic: subBasic,
                totalNet: subNet,
                employeeCount: slips.length,
                slips: slips
            });
        }

        // Add unassigned employees (directly in structural dept)
        const unassigned = (groupData[pid] && groupData[pid]["_unassigned"]) ? groupData[pid]["_unassigned"] : [];
        if (unassigned.length > 0) {
            let uBasic = 0;
            let uNet = 0;
            for (let k = 0; k < unassigned.length; k++) {
                uBasic += unassigned[k].basicSalary;
                uNet += unassigned[k].netSalary;
            }
            parentBasic += uBasic;
            parentNet += uNet;
            parentCount += unassigned.length;

            subGroups.push({
                id: "_unassigned",
                label: "Other",
                totalBasic: uBasic,
                totalNet: uNet,
                employeeCount: unassigned.length,
                slips: unassigned
            });
        }

        if (parentCount === 0) continue;

        departmentGroups.push({
            id: pid,
            label: parent.getString("name"),
            totalBasic: parentBasic,
            totalNet: parentNet,
            employeeCount: parentCount,
            subGroups: subGroups
        });
    }

    // Add "other" group for employees with unknown departments
    const otherSlips = (groupData["other"] && groupData["other"]["_unassigned"]) ? groupData["other"]["_unassigned"] : [];
    if (otherSlips.length > 0) {
        let oBasic = 0;
        let oNet = 0;
        for (let k = 0; k < otherSlips.length; k++) {
            oBasic += otherSlips[k].basicSalary;
            oNet += otherSlips[k].netSalary;
        }
        departmentGroups.push({
            id: "other",
            label: "Other",
            totalBasic: oBasic,
            totalNet: oNet,
            employeeCount: otherSlips.length,
            subGroups: [{
                id: "_other",
                label: "Other",
                totalBasic: oBasic,
                totalNet: oNet,
                employeeCount: otherSlips.length,
                slips: otherSlips
            }]
        });
    }

    return e.json(200, {
        globalBasic: globalBasic,
        globalNet: globalNet,
        employeeCount: employees.length,
        departmentGroups: departmentGroups
    });
});

routerAdd("POST", "/api/payroll/close", (c) => {
    const app = $app;
    let runId;

    // Wrap everything in a transaction for atomicity
    app.runInTransaction((txApp) => {
        // --- PREPARATION ---

        // Helper: Convert transaction unit to cash
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

routerAdd("POST", "/api/payroll/restore", (e) => {
    const runId = e.requestInfo().query["runId"];
    if (!runId) throw new BadRequestError("runId is required");

    let slipCount = 0;
    let txCount = 0;

    const app = $app;
    app.runInTransaction((txApp) => {
        const run = txApp.findRecordById("payroll_runs", runId);

        const filter = 'payrollRunId = "' + runId + '"';
        const slips = txApp.findRecordsByFilter(
            "payroll_slips",
            filter,
            "",
            10000,
            0
        );
        slipCount = slips.length;

        for (let i = 0; i < slips.length; i++) {
            const txIds = slips[i].getStringSlice("transactions") || [];
            for (let j = 0; j < txIds.length; j++) {
                try {
                    const tx = txApp.findRecordById("transactions", txIds[j]);
                    tx.set("isClosed", false);
                    txApp.save(tx);
                    txCount++;
                } catch (err) {
                    // transaction was deleted — skip
                }
            }
        }

        txApp.delete(run);
    });

    return e.json(200, { success: true, slipsFound: slipCount, transactionsRestored: txCount });
});
EOF
