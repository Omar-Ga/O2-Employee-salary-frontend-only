routerAdd("GET", "/api/seed-departments", (c) => {
    const dao = $app.dao();

    // Check if departments exist
    const existing = dao.findCollectionByNameOrId("departments");
    // Actually we want to check if any records exist
    try {
        const records = dao.findRecordsByFilter("departments", "id != ''", "-created", 1);
        if (records.length > 0) {
            return c.json(200, { message: "Departments already seeded" });
        }
    } catch (e) {
        // collection might not exist or other error
    }

    const config = [
        {
            name: "Engineering",
            type: "structural",
            subDepartments: [
                { name: "Frontend" },
                { name: "Backend" },
                { name: "Quality Assurance" },
                { name: "Engineering" },
            ]
        },
        {
            name: "Design",
            type: "structural",
            subDepartments: [
                { name: "Product Design" },
                { name: "Graphic Design" },
                { name: "Design" },
            ]
        },
        {
            name: "Product",
            type: "structural",
            subDepartments: [
                { name: "Product Management" },
                { name: "Product" },
            ]
        },
        {
            name: "Finance",
            type: "structural",
            subDepartments: [
                { name: "Accounting" },
                { name: "Auditing" },
            ]
        },
        {
            name: "Human Resources",
            type: "structural",
            subDepartments: [
                { name: "Recruitment" },
                { name: "Operations" },
            ]
        }
    ];

    const collection = dao.findCollectionByNameOrId("departments");

    try {
        dao.runInTransaction((txDao) => {
            config.forEach(dept => {
                const record = new Record(collection);
                record.set("name", dept.name);
                record.set("type", dept.type);
                txDao.saveRecord(record);

                dept.subDepartments.forEach(sub => {
                    const subRecord = new Record(collection);
                    subRecord.set("name", sub.name);
                    subRecord.set("type", "functional");
                    subRecord.set("parentId", record.id);
                    txDao.saveRecord(subRecord);
                });
            });
        });
    } catch (e) {
        return c.json(500, { error: e.message });
    }

    return c.json(200, { message: "Seeding complete" });
});
