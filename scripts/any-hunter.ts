import fs from 'fs';
import path from 'path';

// 定义需要扫描的目录
const FEATURES_DIR = path.join(process.cwd(), 'src', 'features');

// 简单扫描 any 类型
interface ScanResult {
    file: string;
    line: number;
    content: string;
}

function scanDirectory(dir: string, results: ScanResult[] = []): ScanResult[] {
    if (!fs.existsSync(dir)) return results;

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            scanDirectory(fullPath, results);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');

            lines.forEach((line, index) => {
                // 匹配 ": any", "as any"
                if (line.match(/:\s*any\b/) || line.match(/\bas\s*any\b/)) {
                    // 排除注释行
                    if (!line.trim().startsWith('//') && !line.trim().startsWith('*')) {
                        results.push({
                            file: fullPath.replace(process.cwd(), ''),
                            line: index + 1,
                            content: line.trim()
                        });
                    }
                }
            });
        }
    }

    return results;
}

function main() {
    console.log('开始扫描 any 类型...');
    const results = scanDirectory(FEATURES_DIR);

    console.log(`\n============== 扫描结果: 发现 ${results.length} 处 any ==============`);

    // 按模块分组
    const byModule: Record<string, ScanResult[]> = {};

    results.forEach(res => {
        // 假设路径为 \src\features\moduleName\...
        const parts = res.file.split(path.sep);
        const moduleIndex = parts.indexOf('features') + 1;
        const moduleName = parts[moduleIndex] || 'unknown';

        if (!byModule[moduleName]) {
            byModule[moduleName] = [];
        }
        byModule[moduleName].push(res);
    });

    // 打印按模块统计
    const sortedModules = Object.entries(byModule).sort((a, b) => b[1].length - a[1].length);

    for (const [mod, modResults] of sortedModules) {
        console.log(`\n📁 [${mod}] - ${modResults.length} 处`);

        // 取前 3 个示例
        modResults.slice(0, 3).forEach(res => {
            console.log(`   - ${res.file}:${res.line} -> ${res.content}`);
        });

        if (modResults.length > 3) {
            console.log(`   - ... 还有 ${modResults.length - 3} 处未显示`);
        }
    }

    // 生成可修复清单 Markdown
    const reportPath = path.join(process.cwd(), 'docs', '03-audits', 'any-hunt-report.md');
    let mdContent = `# 全局 any 类型清扫清单\n\n> 扫描时间: ${new Date().toISOString()}\n> 总计发现: ${results.length} 处\n\n`;

    for (const [mod, modResults] of sortedModules) {
        mdContent += `## ${mod} (${modResults.length} 处)\n\n`;
        const byFile: Record<string, ScanResult[]> = {};

        modResults.forEach(res => {
            if (!byFile[res.file]) byFile[res.file] = [];
            byFile[res.file].push(res);
        });

        for (const [file, fileResults] of Object.entries(byFile)) {
            mdContent += `- [ ] \`${file}\` (${fileResults.length} 处)\n`;
        }
        mdContent += '\n';
    }

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, mdContent);
    console.log(`\n✅ 详细修复清单已生成至 ${reportPath}`);
}

main();
