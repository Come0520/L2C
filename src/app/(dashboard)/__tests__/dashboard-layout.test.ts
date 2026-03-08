import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Dashboard Layout 静态约束测试
 *
 * 验证 layout.tsx 不包含全局 force-dynamic 导出。
 * 全局 force-dynamic 会导致 Dashboard 下所有页面绕过 Next.js 缓存，
 * 增加服务端渲染时间，影响生产环境性能。
 *
 * 如需对特定页面禁用缓存，请在对应的 page.tsx 中单独声明。
 */
describe('Dashboard Layout 配置约束', () => {
  const layoutPath = path.resolve(__dirname, '../layout.tsx');
  const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

  it('不应导出全局 force-dynamic（避免所有 Dashboard 页面绕过 Next.js 缓存）', () => {
    // 匹配顶层 export const dynamic = 'force-dynamic' 声明
    expect(layoutContent).not.toMatch(/^export const dynamic\s*=\s*['"]force-dynamic['"]/m);
  });
});
