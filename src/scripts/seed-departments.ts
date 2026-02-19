import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
    try {
        console.log("Triggering seeding via API...");
        // No auth needed for this custom public route
        const res = await pb.send("/api/seed-departments", { method: "GET" });
        console.log("Response:", res);
    } catch (error) {
        console.error("Seeding failed:", error);
    }
}

main();
