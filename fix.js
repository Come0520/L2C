const fs = require('fs');
const path = require('path');
const logContent = fs.readFileSync('type-check.log', 'utf-8');

// 提取所有含有 error TS2554 的行
const errorLines = logContent.split('\n').filter(line => line.includes('TS2554: Expected 2 arguments, but got 1.'));

const fixes = {};

errorLines.forEach(line => {
    // 形如: src/features/sales/actions/targets.ts(235,5): error TS2554: Expected 2 arguments, but got 1.
    // 提取文件路径和行号 (由于终端带了颜色编码，正则可能更复杂一点，但考虑到上面看到的结果带了ANSI颜色)
    const cleanLine = line.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
    const match = cleanLine.match(/([a-zA-Z0-9_\-\.\/]+)\((\d+),\d+\)/);
    if (match) {
        const filePath = match[1];
        const lineNum = parseInt(match[2], 10) - 1; // 0-based
        if (!fixes[filePath]) fixes[filePath] = [];
        fixes[filePath].push(lineNum);
    }
});

Object.keys(fixes).forEach(relativeFilePath => {
    const p = path.join(__dirname, relativeFilePath);
    if (fs.existsSync(p)) {
        let content = fs.readFileSync(p, 'utf-8').split('\n');
        fixes[relativeFilePath].sort((a, b) => b - a).forEach(lineNum => {
            // 检查这行是否有 )，如果有并且是可疑的 Action 调用，替换为 {})
            const cur = content[lineNum];
            // 这个替换非常粗略，但对于大部分由于缺少第二个 context/opts 空对象传入的 createSafeAction 返回的新函数调用来说，这通常发生在像 action(params)
            if (cur.includes(')')) {
                // 找到该行最后一个 ')' 并在其前面插入 ', {}' 或单纯替换
                // 其实 safer 的做法是在使用 action 时补传空对象，或者去源头改。
                content[lineNum] = cur.replace(/\)([,;]?\s*)$/, ', {})$1');
            }
        });
        fs.writeFileSync(p, content.join('\n'));
        console.log('Fixed', relativeFilePath);
    }
});
