'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import Truck from 'lucide-react/dist/esm/icons/truck';

import { ShipmentTrackingData } from '../types';

interface ShipmentTrackerProps {
    orderId?: string;
    company?: string;
    trackingNo?: string;
    status?: string;
    trackingData?: ShipmentTrackingData;
    updatedAt?: string | Date;
}

export function ShipmentTracker({ orderId, company, trackingNo, status, trackingData }: ShipmentTrackerProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Logistics Tracking</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{status || 'No Data'}</div>
                <p className="text-xs text-muted-foreground">
                    {company} - {trackingNo}
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
