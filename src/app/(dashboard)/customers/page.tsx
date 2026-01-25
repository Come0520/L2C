/**
 * 客户列表页
 */

import { Suspense } from 'react';
import { getCustomers } from '@/features/customers/actions/queries';
import { CustomerTable } from '@/features/customers/components/customer-table';
import { CustomerHeader } from '@/features/customers/components/CustomerHeader';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import Search from 'lucide-react/dist/esm/icons/search';
import { Pagination } from '@/shared/ui/pagination';
import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';

export const revalidate = 60; // Revalidate every minute

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [session, resolvedParams] = await Promise.all([auth(), searchParams]);

  const userId = session?.user?.id;
  const tenantId = session?.user?.tenantId;

  if (!userId || !tenantId) {
    redirect('/auth/login');
  }
  const page = Number(resolvedParams.page) || 1;
  const query = typeof resolvedParams.search === 'string' ? resolvedParams.search : undefined;

  let data = [];
  let pagination = { page: 1, pageSize: 10, total: 0, totalPages: 0 };

  try {
    const result = await getCustomers({
      page,
      pageSize: 10,
      search: query,
      type: typeof resolvedParams.type === 'string' ? resolvedParams.type : undefined,
      level: typeof resolvedParams.level === 'string' ? resolvedParams.level : undefined,
      lifecycleStage:
        typeof resolvedParams.lifecycleStage === 'string'
          ? resolvedParams.lifecycleStage
          : undefined,
      pipelineStatus:
        typeof resolvedParams.pipelineStatus === 'string'
          ? resolvedParams.pipelineStatus
          : undefined,
    });
    data = result.data;
    pagination = result.pagination;
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    // Optionally pass error state to UI or just return empty list to avoid white screen
  }

  return (
    <div className="space-y-6">
      <CustomerHeader userId={userId} tenantId={tenantId} />

      <div className="flex items-center space-x-2">
        <form className="flex max-w-sm flex-1 items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-gray-500" />
            <Input
              name="search"
              type="search"
              placeholder="搜索姓名、电话、编号..."
              className="pl-9"
              defaultValue={query}
            />
          </div>
          {/* Add filter dropdowns here later (Level, Type) */}
          <Button type="submit" variant="secondary">
            搜索
          </Button>
        </form>
      </div>

      <Suspense fallback={<div>加载中...</div>}>
        <CustomerTable data={data} currentUser={session.user} />
      </Suspense>

      <div className="mt-4">
        <Pagination currentPage={page} totalPages={pagination.totalPages} />
      </div>
    </div>
  );
}
