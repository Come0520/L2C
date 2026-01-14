'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Truck } from 'lucide-react';

interface ShipmentTrackerProps {
    orderId: string;
}

export function ShipmentTracker({ orderId }: ShipmentTrackerProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Logistics Tracking</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">No Data</div>
                <p className="text-xs text-muted-foreground">
                    Tracking information for {orderId} is unavailable in recovery mode.
                </p>
                <div className="mt-4 space-y-2">
                    {/* Mock timeline */}
                    <div className="flex gap-2 text-sm">
                        <span className="text-muted-foreground">--:--</span>
                        <span>Tracking service unavailable</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
