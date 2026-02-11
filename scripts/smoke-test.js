const fetch = require('node-fetch');

// ANSI colors for console output
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
};

const TARGET_URL = process.argv[2] || 'http://localhost:3000';
const EXPECTED_VERSION = process.env.NEXT_PUBLIC_GIT_COMMIT_SHA;

async function checkHealth() {
    console.log(`${colors.blue}Starting Smoke Test against ${TARGET_URL}...${colors.reset}`);

    try {
        const response = await fetch(`${TARGET_URL}/api/health`);

        if (!response.ok) {
            console.error(`${colors.red}❌ Health check failed with status: ${response.status} ${response.statusText}${colors.reset}`);
            process.exit(1);
        }

        const data = await response.json();
        console.log(`${colors.green}✅ Health check passed!${colors.reset}`);
        console.log(`   Status: ${data.status}`);
        console.log(`   Timestamp: ${data.timestamp}`);
        console.log(`   Version: ${data.version}`);

        if (EXPECTED_VERSION) {
            if (data.version === EXPECTED_VERSION) {
                console.log(`${colors.green}✅ Version verified: ${data.version}${colors.reset}`);
            } else {
                console.warn(`${colors.yellow}⚠️ Version mismatch! Expected: ${EXPECTED_VERSION}, Got: ${data.version}${colors.reset}`);
                // Strict mode: fail on mismatch
                // process.exit(1); 
            }
        } else {
            console.log(`${colors.yellow}ℹ️ No expected version provided, skipping version verification.${colors.reset}`);
        }

        process.exit(0);
    } catch (error) {
        console.error(`${colors.red}❌ Smoke test failed: ${error.message}${colors.reset}`);
        process.exit(1);
    }
}

checkHealth();
