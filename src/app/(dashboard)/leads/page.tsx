/**
 * 线索管理页面
 */
import { Suspense } from 'react';
import { getLeads, getChannels } from '@/features/leads/actions';
import { LeadsFilterBar } from '@/features/leads/components/leads-filter-bar';
import { LeadsAdvancedFilter } from '@/features/leads/components/leads-advanced-filter';
import { LeadTable } from '@/features/leads/components/lead-table';
import { CreateLeadDialog } from '@/features/leads/components/create-lead-dialog';
import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';

export const revalidate = 60;

export default async function LeadsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await auth();
    const tenantId = session?.user?.tenantId;
    const userId = session?.user?.id;

    if (!tenantId || !userId) redirect('/auth/signin');

    const resolvedParams = await searchParams;
    const page = Number(resolvedParams?.page) || 1;
    const status = resolvedParams?.status as any;
    const search = resolvedParams?.search as string;

    const [leadsResult, channels] = await Promise.all([
        getLeads({
            page,
            pageSize: 10,
            status: status === 'ALL' ? undefined : status,
            search,
        }),
        getChannels()
    ]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">线索管理</h1>
                <CreateLeadDialog channels={channels} userId={userId} tenantId={tenantId} />
            </div>

            <div className="flex items-center space-x-4">
                <LeadsFilterBar />
                <div className="ml-auto">
                    <LeadsAdvancedFilter tenantId={tenantId} />
                </div>
            </div>

            <Suspense fallback={<div>Loading leads...</div>}>
                <LeadTable
                    data={leadsResult.data}
                    page={page}
                    pageSize={10}
                    total={leadsResult.total}
                />
            </Suspense>
        </div>
    );
}
