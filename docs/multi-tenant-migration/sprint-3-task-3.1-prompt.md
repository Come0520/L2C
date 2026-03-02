# Sprint 3 — 任务 3.1：PC 端切换企业组件

## 你的身份

你是一个实现子代理 (Implementer Subagent)，正在执行 L2C 多租户改造方案的前端适配。

**前置条件**：Sprint 1-2 已完成。后端 API 已就位：

- `GET /api/auth/switch-tenant` — 获取可切换的租户列表
- `POST /api/auth/switch-tenant` — 执行切换

## 任务描述

创建一个「切换企业」组件，嵌入到系统右上角用户菜单中。当用户有多个租户成员资格时，显示可切换的企业列表。

## 具体工作

### 创建 `src/components/tenant-switcher.tsx`

这是一个客户端组件，需要：

1. 调用 `GET /api/auth/switch-tenant` 获取用户的所有租户列表
2. 如果只有 1 个租户，不显示切换功能
3. 如果有多个租户，显示当前企业名 + 下拉切换按钮
4. 切换时调用 `POST /api/auth/switch-tenant`，成功后执行 `signOut()` + 重定向到登录页（自动重新登录到新租户）

**参考代码框架：**

```tsx
'use client';

/**
 * 租户切换器组件
 *
 * 在用户有多个租户成员资格时显示，
 * 允许切换到不同的企业上下文。
 * 参考 Slack 的 Workspace Switcher 设计。
 */

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { Building2, ChevronDown, Check } from 'lucide-react';

interface TenantInfo {
  id: string;
  name: string;
  role: string;
  roles: string[];
  isCurrent: boolean;
}

export function TenantSwitcher() {
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    fetch('/api/auth/switch-tenant')
      .then((res) => res.json())
      .then((data) => {
        if (data.tenants && data.tenants.length > 1) {
          setTenants(data.tenants);
        }
      })
      .catch(console.error);
  }, []);

  // 只有 1 个或 0 个租户时不显示
  if (tenants.length <= 1) return null;

  const currentTenant = tenants.find((t) => t.isCurrent);

  const handleSwitch = async (targetTenantId: string) => {
    if (isSwitching) return;
    setIsSwitching(true);
    try {
      const res = await fetch('/api/auth/switch-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTenantId }),
      });
      const data = await res.json();
      if (data.success) {
        // 重新登录以刷新 JWT
        await signOut({ callbackUrl: '/login' });
      }
    } catch (error) {
      console.error('切换企业失败:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-100"
        disabled={isSwitching}
      >
        <Building2 className="h-4 w-4" />
        <span className="max-w-32 truncate">{currentTenant?.name || '选择企业'}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border bg-white shadow-lg">
          <div className="border-b p-2 text-xs text-gray-500">切换企业</div>
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              onClick={() => handleSwitch(tenant.id)}
              disabled={tenant.isCurrent || isSwitching}
              className="flex w-full items-center justify-between p-3 text-left text-sm hover:bg-gray-50"
            >
              <div>
                <div className="font-medium">{tenant.name}</div>
                <div className="text-xs text-gray-500">{tenant.role}</div>
              </div>
              {tenant.isCurrent && <Check className="h-4 w-4 text-green-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 集成到导航栏

在现有的 layout 或导航栏组件中添加 `<TenantSwitcher />` 引用。

检查 `src/components` 或 `src/app` 目录中的 `header` / `navbar` / `sidebar` 组件，找到用户头像/菜单区域，在附近插入 `<TenantSwitcher />`。

## 注意事项

1. 该组件对只有单一租户的用户完全透明（不显示任何 UI）
2. 切换后使用 `signOut` 实现 JWT 刷新，因为 NextAuth JWT 不可变
3. 所有代码注释必须使用**中文**
4. 工作目录：`c:\Users\bigey\Documents\Antigravity\L2C`

## 验证方式

```bash
npx tsc --noEmit --pretty 2>&1 | head -50
```

## 完成后报告

请报告创建/修改了哪些文件、编译是否通过。
