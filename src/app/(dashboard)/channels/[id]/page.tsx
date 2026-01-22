import { notFound } from 'next/navigation';
import { auth } from '@/shared/lib/auth';
import { getChannelById } from '@/features/channels/actions/queries';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { ChannelDetail } from '@/features/channels/components/channel-detail';
import { Button } from '@/shared/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

/**
 * 渠道详情页
 */
export default async function ChannelDetailPage({ params }: PageProps) {
    const resolvedParams = await params;
    const session = await auth();
    const tenantId = session?.user?.tenantId;

    if (!tenantId) {
        return <div>请先登录</div>;
    }

    const channel = await getChannelById(resolvedParams.id);

    if (!channel) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/channels">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <DashboardPageHeader
                    title={channel.name}
                    subtitle={`渠道编号：${channel.code}`}
                />
            </div>

            <ChannelDetail channel={channel} tenantId={tenantId} />
        </div>
    );
}
