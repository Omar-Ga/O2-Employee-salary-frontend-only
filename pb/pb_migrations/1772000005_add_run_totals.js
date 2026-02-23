migrate((app) => {
    let collection = app.findCollectionByNameOrId("payroll_runs");

    collection.fields.add(new NumberField({
        name: "totalBasic",
        required: false,
    }));

    collection.fields.add(new NumberField({
        name: "totalNet",
        required: false,
    }));

    collection.fields.add(new NumberField({
        name: "employeeCount",
        required: false,
    }));

    // Use saveNoValidate to prevent rule failures if any
    app.save(collection);

    // Now update existing payroll_runs
    let runs = app.findAllRecords("payroll_runs");
    for (let run of runs) {
        let slips = app.findRecordsByFilter("payroll_slips", `payrollRunId = '${run.id}'`);

        let totalBasic = 0;
        let totalNet = 0;

        for (let slip of slips) {
            totalBasic += slip.getFloat("basicSalary");
            totalNet += slip.getFloat("netSalary");
        }

        run.set("totalBasic", totalBasic);
        run.set("totalNet", totalNet);
        run.set("employeeCount", slips.length);

        app.save(run);
    }
}, (app) => {
    let collection = app.findCollectionByNameOrId("payroll_runs");
    collection.fields.removeByName("totalBasic");
    collection.fields.removeByName("totalNet");
    collection.fields.removeByName("employeeCount");
    app.save(collection);
});
