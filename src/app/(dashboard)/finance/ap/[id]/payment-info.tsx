
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function ApPaymentInfo({ bill }: { bill: any }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>支付信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <span className="text-muted-foreground">收款方</span>
                    <span className="font-medium text-right">{bill.payeeName}</span>

                    <span className="text-muted-foreground">支付方式</span>
                    <span className="font-medium text-right">{bill.paymentMethod}</span>

                    <span className="text-muted-foreground">预计支付时间</span>
                    <span className="font-medium text-right">{bill.paymentDate ? new Date(bill.paymentDate).toLocaleDateString() : '-'}</span>
                </div>
            </CardContent>
        </Card>
    );
}
