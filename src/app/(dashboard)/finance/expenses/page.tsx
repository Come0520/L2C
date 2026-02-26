// @ts-nocheck
import { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Card, CardContent } from '@/shared/ui/card';
import { db } from '@/shared/api/db';
import { chartOfAccounts } from '@/shared/api/schema';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { ExpenseForm } from '@/features/finance/components/expense-form';
import { ExpenseImport } from '@/features/finance/components/expense-import';

export const metadata: Metadata = {
  title: '费用录入 | L2C',
  description: '手工录入单笔费用或批量导入多条费用',
};

export default async function ExpensePage() {
  const session = await auth();
  if (!session?.user?.tenantId) return <div>未授权</div>;

  // 获取费用科目给下方组件使用
  const accounts = await db
    .select({
      id: chartOfAccounts.id,
      name: chartOfAccounts.name,
      code: chartOfAccounts.code,
    })
    .from(chartOfAccounts)
    .where(
      and(
        eq(chartOfAccounts.tenantId, session.user.tenantId),
        eq(chartOfAccounts.category, 'EXPENSE'),
        eq(chartOfAccounts.isActive, true)
      )
    )
    .orderBy(chartOfAccounts.code);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <PageHeader
        title="费用录入"
        description="在此页面，您可以手工录入单笔发生费用，也可以通过模板批量导入多条记录，并按需自动生成会计凭证。"
      />

      <Tabs defaultValue="manual" className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="manual">手工单笔录入</TabsTrigger>
          <TabsTrigger value="import">Excel 批量导入</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <ExpenseForm accounts={accounts} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <ExpenseImport accounts={accounts} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
