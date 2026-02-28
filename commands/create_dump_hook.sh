cat << 'EOF' > pb_hooks/dump.pb.js
routerAdd("GET", "/api/dump-schema", (c) => {
    const employees = $app.findCollectionByNameOrId("employees");
    return c.json(200, employees);
});
EOF
