import { readFileSync } from 'fs';

// 用 latin1 读以避免 UTF-8 控制字符问题
const raw = readFileSync('e2e-failed-list.json', 'latin1');

// 查找所有 "status": "failed" 位置
const failedPositions = [];
let searchPos = 0;
while (true) {
    const idx = raw.indexOf('"status": "failed"', searchPos);
    if (idx === -1) break;
    failedPositions.push(idx);
    searchPos = idx + 1;
}

console.log('找到 "failed" 状态数量:', failedPositions.length);

// 目标测试条件
const targets = [
    { browser: 'chromium', spec: 'after-sales-liability' },
    { browser: 'chromium', spec: 'analytics' },
    { browser: 'chromium', spec: 'channel-commission-clawback' },
    { browser: 'chromium', spec: 'dialog-optimizations' },
    { browser: 'chromium', spec: 'finance-debt-ledger' },
    { browser: 'firefox', spec: 'processing-order-flow' },
    { browser: 'firefox', spec: 'security-isolation' },
    { browser: 'Mobile Chrome', spec: 'after-sales-liability' },
    { browser: 'Mobile Chrome', spec: 'analytics' },
    { browser: 'Mobile Chrome', spec: 'install-photo-upload' },
];

// 对每个 failed 位置，向前找 spec 文件名和浏览器名
failedPositions.forEach(pos => {
    const before = raw.substring(Math.max(0, pos - 1500), pos);
    const after = raw.substring(pos, pos + 800);

    // 找最近的 .spec.ts 文件名
    const fileMatch = before.match(/flows\\\\([^"]+\.spec\.ts)/g);
    const lastFile = fileMatch ? fileMatch[fileMatch.length - 1] : '';

    // 找最近的 projectName
    const projMatch = before.match(/"projectName":\s*"([^"]+)"/g);
    const lastProj = projMatch ? projMatch[projMatch.length - 1].replace(/"projectName":\s*"/, '').replace(/"$/, '') : '';

    // 找最近的 title
    const titleMatch = before.match(/"title":\s*"([^"]{1,150})"/g);
    const lastTitle = titleMatch ? titleMatch[titleMatch.length - 1].replace(/"title":\s*"/, '').replace(/"$/, '') : '';

    // 找错误信息（向后）
    const errMatch = after.match(/"message":\s*"([^"]{1,400})/);
    const errMsg = errMatch ? errMatch[1] : '(无错误信息)';

    // 检查是否匹配目标
    const isTarget = targets.some(t => {
        return lastFile.toLowerCase().includes(t.spec) && lastProj.toLowerCase() === t.browser.toLowerCase();
    });

    if (isTarget) {
        console.log('\n===', lastProj, '|', lastFile, '===');
        console.log('  标题:', lastTitle);
        console.log('  错误:', errMsg.substring(0, 300));
    }
});

// 如果没找到，打印前 5 个 failed 块供诊断
if (failedPositions.length > 0 && failedPositions.length < 50) {
    console.log('\n--- 全部失败块（诊断）---');
    failedPositions.slice(0, 5).forEach((pos, i) => {
        const before = raw.substring(Math.max(0, pos - 400), pos);
        const fileMatch = before.match(/flows\\\\([^"]+\.spec\.ts)/g);
        const projMatch = before.match(/"projectName":\s*"([^"]+)"/g);
        const titleMatch = before.match(/"title":\s*"([^"]{1,100})"/g);
        console.log('  [' + i + ']',
            fileMatch ? fileMatch[fileMatch.length - 1] : '?',
            '-', projMatch ? projMatch[projMatch.length - 1] : '?',
            '-', titleMatch ? titleMatch[titleMatch.length - 1] : '?'
        );
    });
}
