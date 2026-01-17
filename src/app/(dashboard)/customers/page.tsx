/**
 * 客户列表页
 */

import { Suspense } from 'react';
import { getCustomers } from '@/features/customers/actions/queries';
import { CustomerTable } from '@/features/customers/components/customer-table';
import { CustomerHeader } from '@/features/customers/components/CustomerHeader';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Search } from 'lucide-react';
import { Pagination } from '@/shared/ui/pagination';
import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';

export const revalidate = 60; // Revalidate every minute

export default async function CustomersPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await auth();
    const userId = session?.user?.id;
    const tenantId = session?.user?.tenantId;

    if (!userId || !tenantId) {
        redirect('/auth/login');
    }

    const resolvedParams = await searchParams;
    const page = Number(resolvedParams.page) || 1;
    const query = typeof resolvedParams.search === 'string' ? resolvedParams.search : undefined;

    const { data, pagination } = await getCustomers({
        page,
        pageSize: 10,
        search: query,
    });

    return (
        <div className="space-y-6">
            <CustomerHeader userId={userId} tenantId={tenantId} />

            <div className="flex items-center space-x-2">
                <form className="flex-1 max-w-sm flex items-center space-x-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            name="search"
                            type="search"
                            placeholder="搜索姓名、电话、编号..."
                            className="pl-9"
                            defaultValue={query}
                        />
                    </div>
                    {/* Add filter dropdowns here later (Level, Type) */}
                    <Button type="submit" variant="secondary">搜索</Button>
                </form>
            </div>

            <Suspense fallback={<div>加载中...</div>}>
                <CustomerTable
                    data={data}
                    page={page}
                    pageSize={10}
                />
            </Suspense>

            <div className="mt-4">
                <Pagination
                    currentPage={page}
                    totalPages={pagination.totalPages}
                />
            </div>
        </div>
    );
}
