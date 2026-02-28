cat << 'EOF' > pb_hooks/seed_departments.pb.js
routerAdd("GET", "/api/seed-departments", (c) => {
    try {
        const records = $app.findRecordsByFilter("departments", "id != ''", "-created", 1);
        if (records.length > 0) {
            return c.json(200, { message: "Departments already seeded" });
        }
    } catch (e) {}

    const config = [
        {
            name: "Engineering",
            type: "structural",
            subDepartments: [
                { name: "Frontend" },
                { name: "Backend" },
                { name: "Quality Assurance" },
            ]
        },
        {
            name: "Design",
            type: "structural",
            subDepartments: [
                { name: "Product Design" },
                { name: "Graphic Design" },
            ]
        },
        {
            name: "Product",
            type: "structural",
            subDepartments: [
                { name: "Product Management" },
            ]
        }
    ];

    const collection = $app.findCollectionByNameOrId("departments");

    try {
        $app.runInTransaction((txApp) => {
            config.forEach(dept => {
                const record = new Record(collection);
                record.set("name", dept.name);
                record.set("type", dept.type);
                txApp.save(record);

                dept.subDepartments.forEach(sub => {
                    const subRecord = new Record(collection);
                    subRecord.set("name", sub.name);
                    subRecord.set("type", "functional");
                    subRecord.set("parentId", record.id);
                    txApp.save(subRecord);
                });
            });
        });
    } catch (e) {
        return c.json(500, { error: e.message });
    }

    return c.json(200, { message: "Seeding complete" });
});
EOF
