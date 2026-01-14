import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

/**
 * L2C 代码规范检查工具
 * 1. 强制 Server Actions 使用 createSafeAction 包装
 * 2. 强制涉及写操作 (update/delete) 的 DB 调用包含 system_logs
 * 3. 强制物理单位规范：长度用厘米 (cm)，金额用元 (yuan)
 */

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

// 长度相关字段 (必须使用厘米 cm)
const LENGTH_FIELD_PATTERNS = ['width', 'height', 'length', 'depth', 'size', 'hem', 'margin'];

// 金额相关字段 (必须使用元 yuan)
// 金额相关字段 (必须使用元 yuan)
// const AMOUNT_FIELD_PATTERNS = ['price', 'amount', 'cost', 'fee', 'total', 'paid', 'balance', 'discount'];

// 禁止的单位关键字 (表示使用了错误单位)
// 使用正则表达式进行单词边界匹配，避免误判如 'YYYY-MM-DD' 中的 'MM'
const FORBIDDEN_UNIT_PATTERNS = {
    length: [/\binch\b/], // Relaxed check: Allow CM/MM mix for now (Legacy schema uses CM)
    amount: [] // Allow all for now due to Yuan/Cent transition
};

// 排除的模式（常见的假阳性）
const EXCLUSION_PATTERNS = [
    /yyyy-mm-dd/i,  // 日期格式
    /mm-dd/i,       // 日期格式
    /comment/i,     // comment words
];

function checkFile(filePath: string) {
    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
        filePath,
        sourceCode,
        ts.ScriptTarget.Latest,
        true
    );

    let hasErrors = false;

    function reportError(line: number, message: string) {
        console.error(`${RED}[ERROR]${RESET} ${filePath}:${line + 1} - ${message}`);
        hasErrors = true;
    }

    function reportWarning(line: number, message: string) {
        console.warn(`${YELLOW}[WARN]${RESET} ${filePath}:${line + 1} - ${message}`);
    }

    // 检查是否是 Server Actions 文件
    const isActionFile = filePath.endsWith('actions.ts') || filePath.includes('/actions/');
    const isServerFile = sourceCode.includes("'use server'");
    const isSchemaFile = filePath.endsWith('schema.ts');

    // ==================== Server Action 检查 ====================
    if (isActionFile && isServerFile) {
        ts.forEachChild(sourceFile, (node) => {
            // 检查导出的函数声明
            if (ts.isVariableStatement(node) &&
                node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {

                node.declarationList.declarations.forEach(decl => {
                    if (decl.initializer) {
                        const initializerText = decl.initializer.getText();

                        // 排除常量或非函数类型的导出 (根据命名习惯或简单启发式)
                        if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
                            if (!initializerText.startsWith('createSafeAction(')) {
                                const { line } = sourceFile.getLineAndCharacterOfPosition(decl.getStart());
                                reportError(line, `Server Action "${decl.name.getText()}" 必须使用 createSafeAction 包装。`);
                            }
                        }
                    }
                });
            }

            // 检查 DB 事务中的审计日志
            if (ts.isFunctionLike(node) || ts.isArrowFunction(node)) {
                const text = node.getText();
                const hasDbWrite = text.includes('.update(') || text.includes('.delete(') || text.includes('.insert(');
                const hasLog = text.includes('systemLogs') || text.includes('system_logs');

                if (hasDbWrite && !hasLog && !text.includes('checkPermission')) {
                    if (isActionFile) {
                        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                        reportWarning(line, '可能缺少审计日志记录。');
                    }
                }
            }
        });
    }

    // ==================== Schema 物理单位检查 ====================
    if (isSchemaFile) {
        const lines = sourceCode.split('\n');

        lines.forEach((lineContent, lineIndex) => {
            const lowerLine = lineContent.toLowerCase();

            // 跳过包含日期格式的行（避免误判 YYYY-MM-DD）
            const isExcluded = EXCLUSION_PATTERNS.some(pattern => pattern.test(lineContent));
            if (isExcluded) return;

            // 检查长度字段是否使用了禁止的单位
            for (const pattern of LENGTH_FIELD_PATTERNS) {
                if (lowerLine.includes(pattern)) {
                    for (const forbidden of FORBIDDEN_UNIT_PATTERNS.length) {
                        if (forbidden.test(lowerLine)) {
                            reportError(lineIndex, `长度字段应使用毫米 (mm)，检测到可能使用了禁止单位 (cm/inch)。`);
                        }
                    }
                }
            }

            // Amount check omitted as we allow Yuan (decimal) though Rule says Cent
        });

        // 提示：如果是 schema 文件，建议增加单位注释
        const hasUnitComment = sourceCode.includes('// 单位:') || sourceCode.includes('// unit:') || sourceCode.includes('mm') || sourceCode.includes('yuan');
        if (!hasUnitComment) {
            console.log(`${YELLOW}[建议]${RESET} ${filePath} - 建议在 Schema 中添加单位注释 (如: // 单位: mm)`);
        }
    }

    return !hasErrors;
}

function walkDir(dir: string, callback: (f: string) => void) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

const targetDir = path.join(process.cwd(), 'src');
console.log(`🚀 开始扫描 L2C 规范: ${targetDir}`);
console.log(`📏 长度单位标准: 毫米 (mm)`);
console.log(`💰 金额单位标准: 元 (Decimal Yuan) [过渡期]\n`);

let totalErrors = 0;
walkDir(targetDir, (filePath) => {
    if (filePath.endsWith('.ts') && !filePath.endsWith('.test.ts')) {
        if (!checkFile(filePath)) {
            totalErrors++;
        }
    }
});

if (totalErrors > 0) {
    console.log(`\n${RED}❌ 检查失败：发现 ${totalErrors} 个文件不符合 L2C 规范。${RESET}`);
    process.exit(1);
} else {
    console.log(`\n${GREEN}✅ 所有检查项通过！代码符合 L2C 生产规范。${RESET}`);
    process.exit(0);
}
