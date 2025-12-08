# 权限组件使用示例

## RoleGuard 基础用法

```tsx
import { RoleGuard } from '@/components/client-components/permissions/role-guard';

export function FinancePanel() {
  return (
    <RoleGuard roles={["OTHER_FINANCE", "APPROVER_FINANCIAL"]} fallback={<div>无权限</div>}>
      <div>财务对账面板</div>
    </RoleGuard>
  );
}
```

## 封装角色组件

```tsx
import { FinanceOnly } from '@/components/client-components/permissions/finance-only';
import { InstallerOnly } from '@/components/client-components/permissions/installer-only';
import { MeasurerOnly } from '@/components/client-components/permissions/measurer-only';
import { ServiceDispatchOnly } from '@/components/client-components/permissions/service-dispatch-only';

export function Example() {
  return (
    <div className="space-y-4">
      <FinanceOnly fallback={<div>需财务权限</div>}>
        <div>仅财务可见的对账入口</div>
      </FinanceOnly>

      <InstallerOnly fallback={<div>需安装师权限</div>}>
        <div>安装任务列表</div>
      </InstallerOnly>

      <MeasurerOnly fallback={<div>需测量师权限</div>}>
        <div>测量任务列表</div>
      </MeasurerOnly>

      <ServiceDispatchOnly fallback={<div>需派单员权限</div>}>
        <div>派单中心</div>
      </ServiceDispatchOnly>
    </div>
  );
}
```

## 典型页面拦截示例

```tsx
import DashboardLayout from '@/components/layout/dashboard-layout';
import { RoleGuard } from '@/components/client-components/permissions/role-guard';

export default function FinanceDashboard() {
  return (
    <DashboardLayout>
      <RoleGuard roles={["OTHER_FINANCE", "APPROVER_FINANCIAL"]} fallback={<div>您无权访问此页面</div>}>
        <div className="p-6">财务仪表板</div>
      </RoleGuard>
    </DashboardLayout>
  );
}
```

