/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const slips = app.findCollectionByNameOrId("payroll_slips")

    // Add 4 granular cash-total fields
    slips.fields.add(new NumberField({ name: "overtimeAmount", required: false }))
    slips.fields.add(new NumberField({ name: "bonusAmount", required: false }))
    slips.fields.add(new NumberField({ name: "deductionAmount", required: false }))
    slips.fields.add(new NumberField({ name: "advanceAmount", required: false }))

    // Remove redundant aggregate fields
    slips.fields.removeByName("additions")
    slips.fields.removeByName("deductions")
    slips.fields.removeByName("hourlyRate")

    app.save(slips)
}, (app) => {
    const slips = app.findCollectionByNameOrId("payroll_slips")

    slips.fields.add(new NumberField({ name: "additions", required: false }))
    slips.fields.add(new NumberField({ name: "deductions", required: false }))
    slips.fields.add(new NumberField({ name: "hourlyRate", required: false }))

    slips.fields.removeByName("overtimeAmount")
    slips.fields.removeByName("bonusAmount")
    slips.fields.removeByName("deductionAmount")
    slips.fields.removeByName("advanceAmount")

    app.save(slips)
})
