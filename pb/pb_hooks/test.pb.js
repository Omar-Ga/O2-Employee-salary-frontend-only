routerAdd("GET", "/api/test", (c) => {
    try {
        const app = $app;
        const e = new Record(app.findCollectionByNameOrId("payroll_slips"));
        e.set("transactions", ["id1", "id2"]);
        const v1 = e.get("transactions");
        const v2 = e.getStringSlice("transactions");

        // save it and read it back just to be sure
        e.set("employeeId", "a".repeat(15));
        e.set("departmentId", "b".repeat(15));

        return c.json(200, {
            v1: v1,
            v2: v2,
            v1isArray: Array.isArray(v1)
        });
    } catch (err) {
        return c.json(500, { error: err.toString() });
    }
});
