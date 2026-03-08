import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Dashboard Layout 静态约束测试
 *
 * 验证 layout.tsx 不包含全局 force-dynamic 导出，
 * 并且包含 TenantProvider 的服务端预取（initialTenant prop）。
 */
describe('Dashboard Layout 配置约束', () => {
  const layoutPath = path.resolve(__dirname, '../layout.tsx');
  const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

  it('不应导出全局 force-dynamic（避免所有 Dashboard 页面绕过 Next.js 缓存）', () => {
    // 匹配顶层 export const dynamic = 'force-dynamic' 声明
    expect(layoutContent).not.toMatch(/^export const dynamic\s*=\s*['"]force-dynamic['"]/m);
  });

  it('应包含 TenantProvider 并通过 initialTenant 传入服务端预取数据（消除客户端瀑布流）', () => {
    // Dashboard Layout 作为 Server Component，应在服务端查询租户数据后直接注入 Provider，
    // 避免客户端挂载后再发 2 次串行 Server Action 请求。
    expect(layoutContent).toMatch(/TenantProvider/);
    expect(layoutContent).toMatch(/initialTenant=/);
  });
});
