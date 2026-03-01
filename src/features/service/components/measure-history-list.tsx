'use client';

import { Card, CardHeader, CardContent, CardTitle } from '@/shared/ui/card';

export function MeasureHistoryList({ orderId }: { orderId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Measurement History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground py-4 text-center">
          Measurement history not available in recovery mode.
        </div>
      </CardContent>
    </Card>
  );
}
