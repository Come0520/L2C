'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Separator } from '@/shared/ui/separator';

import { QuoteSummaryData } from '../types';

export function QuoteSummary({ quote }: { quote: QuoteSummaryData }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>金额汇总</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">商品合计</span>
                    <span>¥{quote.totalAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">折扣</span>
                    <span>- ¥{quote.discountAmount}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                    <span>最终报价</span>
                    <span className="text-primary">¥{quote.finalAmount}</span>
                </div>
            </CardContent>
        </Card>
    );
}
