routerAdd("GET", "/api/dump-schema", (c) => {
    const employees = $app.dao().findCollectionByNameOrId("employees");
    return c.json(200, employees);
});
