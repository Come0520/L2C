
const { spawn } = require('child_process');

const child = spawn('cmd', ['/c', 'npm run db:generate'], {
    stdio: ['pipe', 'inherit', 'inherit'],
    cwd: process.cwd()
});

// Provide a steady stream of 'n\n' to answer any prompts
// We write periodically to avoid filling the buffer before the prompt appears
const interval = setInterval(() => {
    if (child.stdin.writable) {
        try {
            child.stdin.write('n\n');
        } catch (e) {
            // Ignore write errors if stream closed
        }
    }
}, 100);

child.on('close', (code) => {
    clearInterval(interval);
    console.log(`Child process exited with code ${code}`);
    process.exit(code);
});

child.on('error', (err) => {
    clearInterval(interval);
    console.error('Failed to start child process.', err);
    process.exit(1);
});
