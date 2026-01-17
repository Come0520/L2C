import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export const dynamic = 'force-dynamic';

export default async function ApDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    if (!id) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">应付账款详情</h1>
            <Card>
                <CardHeader>
                    <CardTitle>对账单 #{id}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">详情页功能正在开发中...</p>
                </CardContent>
            </Card>
        </div>
    );
}
