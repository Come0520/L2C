/**
 * 线索管理页面
 */
import { Suspense } from 'react';
import { getLeads, getChannels } from '@/features/leads/actions';
import { LeadsFilterBar } from '@/features/leads/components/leads-filter-bar';
import { LeadsAdvancedFilter } from '@/features/leads/components/leads-advanced-filter';
import { LeadTable } from '@/features/leads/components/lead-table';
import { CreateLeadDialog } from '@/features/leads/components/create-lead-dialog';
import { ExcelImportDialog } from '@/features/leads/components/excel-import-dialog';
import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';

export const revalidate = 60;

export default async function LeadsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const [session, resolvedParams] = await Promise.all([
        auth(),
        searchParams
    ]);

    const tenantId = session?.user?.tenantId;
    const userId = session?.user?.id;

    if (!tenantId || !userId) redirect('/auth/signin');
    const page = Number(resolvedParams?.page) || 1;
    const statusParam = resolvedParams?.status;
    const search = resolvedParams?.search as string;

    const status = statusParam === 'ALL' || !statusParam
        ? undefined
        : Array.isArray(statusParam)
            ? statusParam
            : [statusParam];

    const [leadsResult, channels] = await Promise.all([
        getLeads({
            page,
            pageSize: 10,
            status,
            search,
        }),
        getChannels()
    ]);

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="线索管理"
                description="管理和追踪所有潜在客户线索"
                action={
                    <>
                        <ExcelImportDialog userId={userId} tenantId={tenantId} />
                        <CreateLeadDialog channels={channels} userId={userId} tenantId={tenantId} />
                    </>
                }
            />

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
