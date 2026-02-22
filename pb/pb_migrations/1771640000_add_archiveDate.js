migrate((app) => {
    const collection = app.findCollectionByNameOrId("employees");

    collection.fields.add(new DateField({
        "name": "archiveDate",
        "presentable": false,
        "required": false,
    }));

    return app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("employees");
    const field = collection.fields.getByName("archiveDate");
    if (field) {
        collection.fields.removeById(field.id);
    }
    return app.save(collection);
})
