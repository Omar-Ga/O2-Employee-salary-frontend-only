const PocketBase = require('pocketbase/cjs');

async function test() {
    const pb = new PocketBase('http://127.0.0.1:8090');

    // Login as admin
    await pb.admins.authWithPassword('admin@admin.com', 'admin1234'); // common default

    // Get slips
    const slips = await pb.collection('payroll_slips').getFullList({
        expand: 'transactions,employeeId'
    });

    console.dir(slips, { depth: null });
}

test().catch(console.error);
