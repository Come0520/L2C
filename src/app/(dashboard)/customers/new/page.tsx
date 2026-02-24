/**
 * 新建客户页面
 *
 * 独立的全页面表单，用于创建新客户。
 * 此路由必须存在以避免 `/customers/new` 被 `[id]` 动态路由捕获。
 */

import { redirect } from 'next/navigation';
import { auth } from '@/shared/lib/auth';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { NewCustomerFormWrapper } from '@/features/customers/components/new-customer-form-wrapper';

export default async function NewCustomerPage() {
    const session = await auth();

    const userId = session?.user?.id;
    const tenantId = session?.user?.tenantId;

    if (!userId || !tenantId) {
        redirect('/auth/login');
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <nav className="text-sm text-gray-500">
                    <Link href="/customers" className="hover:text-gray-700 transition-colors">客户管理</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-700">新建客户</span>
                </nav>
                <h1 className="text-2xl font-bold text-gray-900">新建客户</h1>
            </div>

            <Card>
                <CardHeader title="客户信息" className="border-b pb-4 mb-4" />
                <CardContent>
                    <NewCustomerFormWrapper tenantId={tenantId} />
                </CardContent>
            </Card>
        </div>
    );
}
