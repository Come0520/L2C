
const { spawn } = require('child_process');

console.log('🚀 Starting auto-db-push...');

const child = spawn('pnpm', ['db:push'], {
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe']
});

child.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);

    // Detect prompts and verify/create
    if (output.includes('?') || output.includes('❯')) {
        console.log('👉 Detected prompt, sending Enter...');
        child.stdin.write('\n');
    }
});

child.stderr.on('data', (data) => {
    console.error(data.toString());
});

child.on('close', (code) => {
    console.log(`✅ Process exited with code ${code}`);
    process.exit(code);
});
