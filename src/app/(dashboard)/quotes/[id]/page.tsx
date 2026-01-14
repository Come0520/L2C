
import { getQuoteById, activateQuote } from '@/features/quotes/actions';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader, CardContent } from '@/shared/ui/card';
import { StatusBadge } from '@/shared/ui/status-badge';
import { ArrowLeft, Printer, FileText } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { QuoteDetailView, type QuoteData, type QuoteItemData } from '@/features/quotes/components/quote-detail-view';
import { QuoteToOrderButton } from '@/features/quotes/components/quote-to-order-button';
import { MeasureSyncManagerButton } from '@/features/service/measurement/components/measure-sync-manager-button';
import type { quoteItems, products, rooms } from '@/shared/api/schema';

interface AttachmentItem {
    id: string;
    type: string;
    name: string;
    price: number;
    quantity: number;
    amount: number;
    pillowSize?: string | null;
}

type QuoteItemWithRelations = typeof quoteItems.$inferSelect & {
    product?: typeof products.$inferSelect | null;
    room?: typeof rooms.$inferSelect | null;
};

export default async function QuoteDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const result = await getQuoteById({ id });
    const quote = result.data;

    if (!quote) {
        notFound();
    }


    // 映射数据到组件期望的类型
    const mappedQuote: QuoteData = {
        id: quote.id,
        quoteNo: quote.quoteNo,
        status: quote.status,
        totalAmount: quote.totalAmount || '0',
        discountAmount: quote.discountAmount || '0',
        finalAmount: quote.finalAmount || '0',
        remark: quote.remark,
        createdAt: quote.createdAt || new Date(),
        customer: {
            name: quote.customer.name,
            phone: quote.customer.phone,
        },
        lead: quote.lead ? { leadNo: quote.lead.leadNo } : null,
    };

    // Separate main items and attachments
    const allItems = quote.items as QuoteItemWithRelations[];
    const attachmentMap = new Map<string, QuoteItemWithRelations[]>();

    // First pass: Group attachments
    allItems.forEach(item => {
        if (item.parentItemId) {
            const current = attachmentMap.get(item.parentItemId) || [];
            current.push(item);
            attachmentMap.set(item.parentItemId, current);
        }
    });

    // Second pass: Map main items with attachments
    const mappedItems = allItems
        .filter(item => !item.parentItemId) // Only main items
        .map((item): QuoteItemData => {
            const attachments = attachmentMap.get(item.id) || [];
            return {
                id: item.id,
                productName: item.product?.name || item.productName,
                category: item.category,
                roomId: item.roomId,
                room: item.room ? { name: item.room.name } : null,
                width: item.width,
                height: item.height,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                materialUsage: item.materialUsage,
                processFee: item.processFee,
                subtotal: item.subtotal,
                // Curtain Specifics
                foldRatio: item.foldRatio,
                installMethod: item.installMethod,
                fabricWidth: item.fabricWidth,
                openingStyle: item.openingStyle,
                // Map attachments
                attachments: attachments.map((att): AttachmentItem => ({
                    id: att.id,
                    name: att.productName,
                    type: att.attachmentType || 'CUSTOM',
                    quantity: Number(att.quantity),
                    price: Number(att.unitPrice),
                    amount: Number(att.quantity) * Number(att.unitPrice),
                    pillowSize: att.pillowSize,
                })),
            };
        });

    const mappedRooms = quote.rooms.map((room): { id: string; name: string } => ({
        id: room.id,
        name: room.name,
    }));

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/quotes">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">{quote.quoteNo}</h1>
                            <StatusBadge status={quote.status || 'DRAFT'} />
                        </div>
                        <p className="text-muted-foreground text-sm">
                            创建于 {quote.createdAt ? format(new Date(quote.createdAt), 'yyyy-MM-dd HH:mm') : '-'} · 由 {quote.creator?.name || '未知'} 创建
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {quote.status === 'DRAFT' && (
                        <form action={async () => {
                            'use server';
                            await activateQuote({ quoteId: id });
                        }}>
                            <Button type="submit">确认生效</Button>
                        </form>
                    )}
                    {quote.status === 'DRAFT' && (
                        <MeasureSyncManagerButton
                            quoteId={id}
                            leadId={quote.leadId}
                            isEditable={true}
                        />
                    )}
                    {quote.status === 'ACTIVE' && (
                        <QuoteToOrderButton quoteId={id} />
                    )}
                    {quote.order && (
                        <Button variant="outline" asChild>
                            <Link href={`/orders/${quote.order.id}`}>
                                查看订单
                            </Link>
                        </Button>
                    )}
                    <Button variant="outline">
                        <Printer className="h-4 w-4 mr-2" />
                        打印
                    </Button>
                    <Button variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        导出 PDF
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <QuoteDetailView
                        quote={mappedQuote}
                        items={mappedItems as QuoteItemData[]}
                        rooms={mappedRooms}
                        isEditable={quote.status === 'DRAFT'}
                    />
                </div>

                {/* Right Column: Customer Info & Meta */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader title="客户信息" />
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-xs text-gray-400">客户名称</div>
                                <div className="font-medium text-lg text-primary-600">
                                    <Link href={`/customers/${quote.customerId}`} className="hover:underline">
                                        {quote.customer.name}
                                    </Link>
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">关联线索</div>
                                <div className="font-medium">
                                    {quote.lead ? (
                                        <Link href={`/leads/${quote.leadId}`} className="hover:underline text-blue-600">
                                            {quote.lead.leadNo}
                                        </Link>
                                    ) : '-'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">联系电话</div>
                                <div>{quote.customer.phone}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">地址</div>
                                <div>{quote.customer.defaultAddress || '-'}</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader title="备注信息" />
                        <CardContent>
                            <p className="text-sm text-gray-600 min-h-[60px]">
                                {quote.remark || '无备注'}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
