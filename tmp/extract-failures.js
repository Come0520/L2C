const fs = require('fs');
const data = fs.readFileSync('tmp/test-output.txt', 'utf8');
const lines = data.split(/\r?\n/);

// 提取唯一的失败测试文件路径
const failFiles = new Set();
for (const line of lines) {
    // 匹配 "FAIL  src/..." 格式
    const match = line.match(/FAIL\s+(src\/[^\s\[]+\.test\.[tj]sx?)/);
    if (match) {
        failFiles.add(match[1]);
    }
}

const sorted = [...failFiles].sort();
console.log('=== 失败测试文件列表 (' + sorted.length + ' 个唯一文件) ===\n');

// 按模块分组
const modules = {};
for (const f of sorted) {
    const parts = f.split('/');
    const module = parts[2] || 'other'; // src/features/xxx or src/shared/xxx
    if (!modules[module]) modules[module] = [];
    modules[module].push(f);
}

for (const [mod, files] of Object.entries(modules).sort()) {
    console.log(`\n📦 ${mod} (${files.length} 个):`);
    for (const f of files) {
        console.log(`  - ${f}`);
    }
}

// 同时提取每个文件对应的失败测试名
console.log('\n\n=== 失败测试详情（按文件） ===\n');
let currentFile = null;
for (const line of lines) {
    const fileMatch = line.match(/FAIL\s+(src\/[^\s\[]+\.test\.[tj]sx?)/);
    if (fileMatch) {
        const newFile = fileMatch[1];
        if (newFile !== currentFile) {
            currentFile = newFile;
            console.log('\n📁 ' + currentFile);
        }
    }
    // 匹配失败的测试用例名称 (通常以 × 或 ✕ 标记)  
    const testMatch = line.match(/[×✕✗]\s+(.+)/);
    if (testMatch && currentFile) {
        // 截取前120字符避免太长
        console.log('  ❌ ' + testMatch[1].trim().slice(0, 120));
    }
}
