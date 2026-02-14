/**
 * 客户列表页
 */

import { Suspense } from 'react';
import { getCustomers } from '@/features/customers/actions/queries';
import { CustomerTable } from '@/features/customers/components/customer-table';
import { CreateCustomerDialog } from '@/features/customers/components/create-customer-dialog';
import Plus from 'lucide-react/dist/esm/icons/plus';
import { Button } from '@/shared/ui/button';
import { Pagination } from '@/shared/ui/pagination';
import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { CustomersToolbar } from '@/features/customers/components/customers-toolbar';

interface Customer {
    id: string;
    customerNo: string | null;
    name: string;
    phone: string | null;
    level: string | null;
    type: string | null;
    totalAmount: string | number | null;
    totalOrders: number | null;
    assignedSales?: { name: string | null } | null;
    lastOrderAt: Date | null | string;
}

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

  let data: Customer[] = [];
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
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <CustomersToolbar />
        </div>
        <div className="flex items-center gap-2 glass-layout-card p-2 rounded-xl border border-white/10 shadow-sm">
          <CreateCustomerDialog
            userId={userId}
            tenantId={tenantId}
            trigger={
              <Button className="h-9">
                <Plus className="mr-2 h-4 w-4" />
                新建客户
              </Button>
            }
          />
        </div>
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
