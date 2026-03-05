'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function PendingPurchasePool() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Purchase Pool</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground py-8 text-center">
          Pending Purchase Pool not available in recovery mode.
        </div>
      </CardContent>
    </Card>
  );
}
