
routerAdd("GET", "/dump_data", (c) => {
    console.log("Dump request received");
    const app = $app;

    try {
        const run = app.findFirstRecordByFilter(
            "payroll_runs",
            "period = '2026-03'"
        );

        if (!run) {
            console.log("Run not found for period 2026-03");
            return c.json(404, { error: "Run not found" });
        }

        const slips = app.findRecordsByFilter(
            "payroll_slips",
            "payrollRunId = {:runId}",
            "employeeId.name:asc",
            1000,
            0,
            { runId: run.id }
        );

        const result = [];
        for (let i = 0; i < slips.length; i++) {
            const slip = slips[i];
            const emp = app.findRecordById("employees", slip.getString("employeeId"));

            result.push({
                name: emp.getString("name"),
                jobTitle: emp.getString("jobTitle"),
                basicSalary: slip.getFloat("basicSalary"),
                overtime: slip.getFloat("overtimeAmount"),
                bonus: slip.getFloat("bonusAmount"),
                deduction: slip.getFloat("deductionAmount"),
                advance: slip.getFloat("advanceAmount"),
                netSalary: slip.getFloat("netSalary")
            });
        }

        console.log("Successfully collected " + result.length + " slips");
        return c.json(200, {
            period: run.getString("period"),
            totalNet: run.getFloat("totalNet"),
            employees: result
        });
    } catch (e) {
        console.log("Error during dump: " + e.message);
        return c.json(500, { error: e.message });
    }
});
