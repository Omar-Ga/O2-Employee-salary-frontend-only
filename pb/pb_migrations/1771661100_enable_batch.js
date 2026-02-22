migrate((app) => {
    const settings = app.settings();
    settings.batch.enabled = true;
    app.save(settings);
}, (app) => {
    const settings = app.settings();
    settings.batch.enabled = false;
    app.save(settings);
})
