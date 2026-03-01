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
    };
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
    <Card className="border-border bg-muted/10 glass-empty-state border-dashed">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />
          <div className="flex-1">
            <h4 className="text-foreground flex items-center gap-2 text-sm font-semibold">
              订单快照 (下单时刻)
              <Badge variant="outline" className="bg-card h-5 text-[10px]">
                {snapshotData.generatedAt
                  ? new Date(snapshotData.generatedAt).toLocaleDateString()
                  : 'Unknown Date'}
              </Badge>
            </h4>
            <div className="text-muted-foreground mt-2 text-xs">
              原始金额:{' '}
              <span className="text-foreground font-mono font-medium">
                ¥{snapshotTotal.toLocaleString()}
              </span>
              <span className="mx-2">|</span>
              原始项数: {snapshotItems.length}
            </div>

            {/* Expandable or detailed view could go here. For now, just summary */}
            <div className="mt-3 grid grid-cols-1 gap-1">
              {snapshotItems.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className="text-muted-foreground border-border/50 flex justify-between border-b pb-1 text-xs last:border-0"
                >
                  <span>{item.productName}</span>
                  <span>x{item.quantity}</span>
                </div>
              ))}
              {snapshotItems.length > 3 && (
                <div className="text-muted-foreground/70 pt-1 text-[10px]">
                  ...以及其他 {snapshotItems.length - 3} 项
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
