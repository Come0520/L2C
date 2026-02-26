import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { StatCard } from '@/shared/components/stat-card';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  CreditCard,
  ArrowLeftRight,
  FileCheck2,
  FileText,
  NotebookPen,
  PieChart,
  Banknote,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import { getARStatements } from '@/features/finance/actions/ar';
import { getAPSupplierStatements } from '@/features/finance/actions/ap';
import { getFinanceAccounts } from '@/features/finance/actions/config';
import { auth } from '@/shared/lib/auth';
import { getFinanceMode } from '@/features/finance/actions/simple-mode-actions';
import { ROLES } from '@/shared/config/roles';
import { Decimal } from 'decimal.js';

/**
 * 财务中心着陆页 — 任务导向型设计 + 权限动态渲染
 *
 * 复用项目已有组件：StatCard、DashboardPageHeader、Card
 * 保持与其他模块页面风格统一
 */
export default async function FinancePage() {
  const modeRes = await getFinanceMode();
  if (modeRes.success && modeRes.mode === 'simple') {
    redirect('/finance/simple');
  }

  const session = await auth();
  const userRoles = session?.user?.roles || [session?.user?.role || 'SALES'];
  const perms = getUserFinancePermissions(userRoles);

  return (
    <div className="space-y-6">
      {/* 页头 — 使用统一的 DashboardPageHeader 组件 */}
      <DashboardPageHeader title="财务中心" subtitle="一站式管理收付款、对账、凭证与报表" />

      {/* 数据看板 — 使用已有的 StatCard 组件 */}
      <div className="grid gap-4 md:grid-cols-3">
        {perms.has('finance.ar.view') && (
          <Suspense fallback={<StatCardSkeleton />}>
            <ARStatCard />
          </Suspense>
        )}
        {perms.has('finance.ap.view') && (
          <Suspense fallback={<StatCardSkeleton />}>
            <APStatCard />
          </Suspense>
        )}
        {(perms.has('finance.ar.view') || perms.has('finance.ap.view')) && (
          <Suspense fallback={<StatCardSkeleton />}>
            <AccountBalanceCard />
          </Suspense>
        )}
      </div>

      {/* 收款中心 — 用 Card 包裹形成层次，仅销售/财务可见 */}
      {perms.has('finance.ar.view') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">收款中心</CardTitle>
            <CardDescription>客户回款与应收管理</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ActionCard
                href="/finance/ar"
                icon={TrendingUp}
                title="应收对账单"
                description="查看客户应收款项"
              />
              {perms.has('finance.ar.create') && (
                <ActionCard
                  href="/finance/receipts"
                  icon={Receipt}
                  title="登记收款"
                  description="录入客户付款凭证"
                />
              )}
              {perms.has('finance.ar.create') && (
                <ActionCard
                  href="/finance/credit-notes"
                  icon={FileText}
                  title="退款/折让"
                  description="客户退款与折让处理"
                />
              )}
              {perms.has('finance.ar.reconcile') && (
                <ActionCard
                  href="/finance/reconciliation"
                  icon={FileCheck2}
                  title="收款核销"
                  description="收款与对账单核销匹配"
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 付款中心 — 用 Card 包裹形成层次，仅采购/派单员/财务可见 */}
      {perms.has('finance.ap.view') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">付款中心</CardTitle>
            <CardDescription>供应商付款与应付管理</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ActionCard
                href="/finance/ap"
                icon={CreditCard}
                title="应付对账单"
                description="供应商与劳务应付"
              />
              {perms.has('finance.ap.create') && (
                <ActionCard
                  href="/finance/ap"
                  icon={Banknote}
                  title="登记付款"
                  description="创建付款单并审批"
                />
              )}
              {perms.has('finance.ap.create') && (
                <ActionCard
                  href="/finance/debit-notes"
                  icon={FileText}
                  title="扣款/退货"
                  description="供应商扣款退货处理"
                />
              )}
              {perms.has('finance.ap.reconcile') && (
                <ActionCard
                  href="/finance/confirmations"
                  icon={FileCheck2}
                  title="对账确认"
                  description="月结客户/供应商对账"
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 更多工具 — 按权限动态过滤 */}
      {buildToolLinks(perms).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">更多工具</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {buildToolLinks(perms).map((tool) => (
                <QuickLink key={tool.href} {...tool} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ========================
// 权限辅助函数
// ========================

/**
 * 获取用户在财务模块拥有的所有权限集合
 * 支持通配符权限（** 和 *）
 */
function getUserFinancePermissions(roles: string[]): Set<string> {
  const perms = new Set<string>();

  for (const roleCode of roles) {
    // ADMIN/TENANT_ADMIN 拥有全部权限
    if (roleCode === 'ADMIN' || roleCode === 'TENANT_ADMIN') {
      return new Set([
        'finance.ar.view',
        'finance.ar.create',
        'finance.ar.reconcile',
        'finance.ap.view',
        'finance.ap.create',
        'finance.ap.reconcile',
        'finance.approve',
        'finance.review',
        'finance.report.view',
        'finance.report.export',
        'finance.journal.view',
        'finance.journal.create',
        'finance.expense.create',
        'finance.transfer.view',
        'finance.transfer.create',
        'finance.config.manage',
        'finance.labor_view',
      ]);
    }

    const roleDef = ROLES[roleCode];
    if (!roleDef) continue;

    for (const perm of roleDef.permissions as string[]) {
      if (perm === '**' || perm === '*') {
        return new Set([
          'finance.ar.view',
          'finance.ar.create',
          'finance.ar.reconcile',
          'finance.ap.view',
          'finance.ap.create',
          'finance.ap.reconcile',
          'finance.approve',
          'finance.review',
          'finance.report.view',
          'finance.report.export',
          'finance.journal.view',
          'finance.journal.create',
          'finance.expense.create',
          'finance.transfer.view',
          'finance.transfer.create',
          'finance.config.manage',
          'finance.labor_view',
        ]);
      }
      if (perm.startsWith('finance.')) {
        perms.add(perm);
      }
    }
  }

  return perms;
}

/**
 * 根据权限动态构建"更多工具"区的链接列表
 */
function buildToolLinks(perms: Set<string>) {
  const links: { href: string; icon: React.ElementType; label: string }[] = [];

  if (perms.has('finance.transfer.view')) {
    links.push({ href: '/finance/transfers', icon: ArrowLeftRight, label: '资金调拨' });
  }
  if (perms.has('finance.journal.view')) {
    links.push({ href: '/finance/journal', icon: NotebookPen, label: '手工记账' });
  }
  if (perms.has('finance.report.view')) {
    links.push({ href: '/finance/reports/balance-sheet', icon: PieChart, label: '财务报表' });
  }
  if (perms.has('finance.expense.create')) {
    links.push({ href: '/finance/expenses', icon: Banknote, label: '费用录入' });
  }
  if (perms.has('finance.journal.view')) {
    links.push({ href: '/finance/ledger', icon: ShieldCheck, label: '总账查询' });
  }

  return links;
}

// ========================
// 数据看板组件 — 复用 StatCard
// ========================

/** 应收统计卡片 */
async function ARStatCard() {
  let totalAmount = new Decimal(0);
  let pendingAmount = new Decimal(0);

  try {
    const statements = await getARStatements({ limit: 500 });
    for (const s of statements) {
      totalAmount = totalAmount.plus(s.totalAmount || '0');
      pendingAmount = pendingAmount.plus(s.pendingAmount || '0');
    }
  } catch {
    // 权限不足或数据异常时静默降级
  }

  return (
    <StatCard
      title="应收总额"
      value={`¥${totalAmount.toDecimalPlaces(2).toNumber().toLocaleString()}`}
      icon={<TrendingUp className="h-5 w-5" />}
      iconBgClass="bg-emerald-50 dark:bg-emerald-950/30"
      iconTextClass="text-emerald-600"
      subtitle={`待收 ¥${pendingAmount.toDecimalPlaces(2).toNumber().toLocaleString()}`}
    />
  );
}

/** 应付统计卡片 */
async function APStatCard() {
  let totalAmount = new Decimal(0);
  let pendingAmount = new Decimal(0);

  try {
    const statements = await getAPSupplierStatements({ limit: 500 });
    for (const s of statements) {
      totalAmount = totalAmount.plus(s.totalAmount || '0');
      pendingAmount = pendingAmount.plus(s.pendingAmount || '0');
    }
  } catch {
    // 静默降级
  }

  return (
    <StatCard
      title="应付总额"
      value={`¥${totalAmount.toDecimalPlaces(2).toNumber().toLocaleString()}`}
      icon={<TrendingDown className="h-5 w-5" />}
      iconBgClass="bg-blue-50 dark:bg-blue-950/30"
      iconTextClass="text-blue-600"
      subtitle={`待付 ¥${pendingAmount.toDecimalPlaces(2).toNumber().toLocaleString()}`}
    />
  );
}

/** 账户余额统计卡片 */
async function AccountBalanceCard() {
  let totalBalance = new Decimal(0);
  let accountCount = 0;

  try {
    const accounts = await getFinanceAccounts();
    accountCount = accounts.length;
    for (const a of accounts) {
      totalBalance = totalBalance.plus(a.balance || '0');
    }
  } catch {
    // 静默降级
  }

  return (
    <StatCard
      title="账户余额"
      value={`¥${totalBalance.toDecimalPlaces(2).toNumber().toLocaleString()}`}
      icon={<Wallet className="h-5 w-5" />}
      iconBgClass="bg-purple-50 dark:bg-purple-950/30"
      iconTextClass="text-purple-600"
      subtitle={`共 ${accountCount} 个账户`}
    />
  );
}

/** 看板骨架屏 */
function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

// ========================
// 功能入口卡片组件
// ========================

/** 收款/付款中心的操作卡片 — 使用统一的 Card 样式 */
function ActionCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="group hover:border-border h-full cursor-pointer border-transparent transition-all hover:shadow-md">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="bg-muted/50 shrink-0 rounded-lg p-2">
            <Icon className="text-muted-foreground group-hover:text-foreground h-4 w-4 transition-colors" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-muted-foreground truncate text-xs">{description}</p>
          </div>
          <ChevronRight className="text-muted-foreground/50 group-hover:text-foreground h-4 w-4 shrink-0 transition-colors" />
        </CardContent>
      </Card>
    </Link>
  );
}

// ========================
// 快捷工具入口
// ========================

/** 更多工具区的简洁快捷入口 */
function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link href={href}>
      <Card className="group hover:bg-accent/50 cursor-pointer transition-all hover:shadow-sm">
        <CardContent className="flex items-center gap-2.5 p-3">
          <Icon className="text-muted-foreground group-hover:text-foreground h-4 w-4 transition-colors" />
          <span className="text-sm font-medium">{label}</span>
          <ChevronRight className="text-muted-foreground/40 ml-auto h-3 w-3" />
        </CardContent>
      </Card>
    </Link>
  );
}
