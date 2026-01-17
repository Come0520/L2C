/**
 * 批量修复 UI 组件导入路径
 * 将 @/shared/components/ui/* 替换为 @/shared/ui/*
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

const INCORRECT_PATTERN = /@\/shared\/components\/ui\//g;
const CORRECT_PATH = '@/shared/ui/';

async function fixImports() {
    console.log('🔍 查找需要修复的文件...\n');

    const files = await glob('src/**/*.{ts,tsx}', {
        ignore: ['**/node_modules/**', '**/*.test.ts', '**/*.test.tsx']
    });

    let fixedCount = 0;
    let totalMatches = 0;

    for (const file of files) {
        const content = readFileSync(file, 'utf-8');
        const matches = content.match(INCORRECT_PATTERN);

        if (matches) {
            const newContent = content.replace(INCORRECT_PATTERN, CORRECT_PATH);
            writeFileSync(file, newContent, 'utf-8');

            fixedCount++;
            totalMatches += matches.length;
            console.log(`✅ ${file} (${matches.length} 处修复)`);
        }
    }

    console.log(`\n✨ 修复完成!`);
    console.log(`📊 修复文件数: ${fixedCount}`);
    console.log(`📊 修复导入数: ${totalMatches}`);
}

fixImports().catch(console.error);
