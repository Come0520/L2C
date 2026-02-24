'use client';

import React from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';

interface SnapshotItem {
    productName: string;
    specification?: string;
    quantity: number;
    unit: string;
    unitPrice: string;
    subtotal: string;
}

interface SnapshotComparisonProps {
    currentItems?: SnapshotItem[]; // Optional if we want to compare
    snapshotData: {
        generatedAt?: string;
        quote?: {
            items?: SnapshotItem[];
            totalAmount?: string | number;
        }
    };
}

export function SnapshotComparison({ snapshotData }: SnapshotComparisonProps) {
    const snapshotItems = (snapshotData?.quote?.items || []) as SnapshotItem[];

    if (snapshotItems.length === 0) {
        return null;
    }

    // Simple length comparison or deep comparison
    // For now, let's just show a warning if counts differ or total amounts differ
    const snapshotTotal = Number(snapshotData?.quote?.totalAmount || 0);
    // Calculate current total from items if needed, or pass it in. 
    // Usually order.totalAmount is the source of truth for current.

    // We will render a subtle "Original Snapshot" block if changes detected.
    // Or just always allow expanding it.

    return (
        <Card className="border-dashed border-border bg-muted/10 glass-empty-state">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            订单快照 (下单时刻)
                            <Badge variant="outline" className="text-[10px] h-5 bg-card">
                                {snapshotData.generatedAt ? new Date(snapshotData.generatedAt).toLocaleDateString() : 'Unknown Date'}
                            </Badge>
                        </h4>
                        <div className="mt-2 text-xs text-muted-foreground">
                            原始金额: <span className="font-mono text-foreground font-medium">¥{snapshotTotal.toLocaleString()}</span>
                            <span className="mx-2">|</span>
                            原始项数: {snapshotItems.length}
                        </div>

                        {/* Expandable or detailed view could go here. For now, just summary */}
                        <div className="mt-3 grid grid-cols-1 gap-1">
                            {snapshotItems.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs text-muted-foreground border-b border-border/50 pb-1 last:border-0">
                                    <span>{item.productName}</span>
                                    <span>x{item.quantity}</span>
                                </div>
                            ))}
                            {snapshotItems.length > 3 && (
                                <div className="text-[10px] text-muted-foreground/70 pt-1">...以及其他 {snapshotItems.length - 3} 项</div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
