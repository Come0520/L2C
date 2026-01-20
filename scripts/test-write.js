
const fs = require('fs');
const path = 'c:/Users/bigey/Documents/Antigravity/L2C/server-error.log';

try {
    fs.appendFileSync(path, `[${new Date().toISOString()}] Test write from script\n`);
    console.log('Write successful');
} catch (error) {
    console.error('Write failed:', error);
    process.exit(1);
}
