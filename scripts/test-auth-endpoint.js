
// Using global fetch (Node 18+)

async function checkSession() {
    try {
        const res = await fetch('http://localhost:3000/api/auth/session');
        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log("Response Preview (100 chars):", text.substring(0, 100));

        try {
            JSON.parse(text);
            console.log("JSON Parse: OK");
        } catch (e) {
            console.log("JSON Parse: FAILED - " + e.message);
        }
    } catch (e) {
        console.error("Fetch failed:", e.message);
    }
}

checkSession();
