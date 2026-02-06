import { Suspense } from 'react';
import { getServiceTickets } from '@/features/service/actions/ticket-actions';
import { TicketList } from '@/features/service/components/ticket-list';


export default async function ServiceTicketsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;

    // Parse filters
    const page = Number(resolvedParams?.page) || 1;
    const search = resolvedParams?.search as string | undefined;
    const status = resolvedParams?.status as string | undefined;

    const { data: tickets, total, totalPages } = await getServiceTickets({
        page,
        pageSize: 20,
        search,
        status,
    });

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Title moved to Layout/Header, so we can remove it here or keep it if strictly needed, 
                but based on task list "移除页面内部标题", we should remove it. 
                However, to stay safe, I'll remove the header div. */}
            <Suspense fallback={<div>Loading tickets...</div>}>
                <TicketList
                    tickets={tickets || []}
                    total={total || 0}
                    currentPage={page}
                    totalPages={totalPages || 1}
                />
            </Suspense>
        </div>
    );
}
