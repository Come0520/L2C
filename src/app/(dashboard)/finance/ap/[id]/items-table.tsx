
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Separator } from '@/shared/ui/separator';
import { FileText } from 'lucide-react';

export function ApItemsTable({ items, totalAmount }: { items: any[]; totalAmount: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>款项明细</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {items.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 flex items-center justify-center bg-primary/10 text-primary rounded-md">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">
                                        {item.statementType === 'SUPPLIER_STATEMENT' ? '供应商对账单' : '其他'}
                                        #{item.statementNo}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.statement?.id || item.statementId}
                                    </p>
                                </div>
                            </div>
                            <div className="font-mono font-medium">
                                ¥{Number(item.amount).toFixed(2)}
                            </div>
                        </div>
                    ))}
                    <Separator />
                    <div className="flex justify-end items-center gap-4 pt-2">
                        <span className="text-sm text-muted-foreground">总金额</span>
                        <span className="text-2xl font-bold font-mono">¥{Number(totalAmount).toFixed(2)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
