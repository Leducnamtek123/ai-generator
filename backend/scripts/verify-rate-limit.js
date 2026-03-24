const fetch = require('node-fetch'); // Expecting node 18+ or node-fetch available. If not, https.
// Actually, standard fetch is available in Node 18+. I will assume Node 18+.

async function run() {
    const baseUrl = 'http://localhost:8000/api/v1';

    // 1. Login
    console.log('Logging in...');
    const loginRes = await fetch(`${baseUrl}/auth/email/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', password: 'secret' }),
    });

    if (!loginRes.ok) {
        const text = await loginRes.text();
        console.error('Login failed:', loginRes.status, text);
        // Try 'admin' password if 'secret' fails (seed usually uses 'secret' but env might differ)
        // The env content showed DATABASE_PASSWORD=admin. Seed usually sets password to 'secret'.
        // Let's assume 'secret' first.
        return;
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Logged in. Token obtained.');

    // 2. Spam Requests
    console.log('Spamming Image Generation Endpoint (Limit: 10/min)...');
    let successCount = 0;
    let rateLimitCount = 0;
    let otherErrorCount = 0;

    for (let i = 0; i < 20; i++) {
        const res = await fetch(`${baseUrl}/generations/image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: 'test prompt ' + i }),
        });

        if (res.status === 201 || res.status === 200) {
            successCount++;
            console.log(`Request ${i + 1}: Success (${res.status})`);
        } else if (res.status === 429) {
            rateLimitCount++;
            console.log(`Request ${i + 1}: Rate Limited (429)`);
        } else {
            otherErrorCount++;
            // Likely 402 Payment Required if I implemented balance check?
            // Or 400 Bad Request if model missing.
            // It helps to know the status.
            console.log(`Request ${i + 1}: Error (${res.status})`);
        }

        // Slight delay to not crash network stack but still be fast
        await new Promise(r => setTimeout(r, 100));
    }

    console.log('--- Results ---');
    console.log(`Success: ${successCount}`);
    console.log(`Rate Limited: ${rateLimitCount}`);
    console.log(`Other Errors: ${otherErrorCount}`);

    if (rateLimitCount > 0) {
        console.log('VERIFICATION PASSED: Rate Limiting is active.');
    } else {
        console.log('VERIFICATION FAILED: No 429 responses received.');
    }
}

run().catch(console.error);
