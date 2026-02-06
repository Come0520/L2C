'use client';

import { useState } from 'react';
import { ActivityTimeline } from './ActivityTimeline';
import { ActivityForm } from './ActivityForm';
import { Card, CardContent } from '@/shared/ui/card';

interface Props {
    customerId: string;
}

export function CustomerActivitiesSection({ customerId }: Props) {
    const [refreshKey, setRefreshKey] = useState(0);

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="grid grid-cols-1 gap-6">
            <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0 space-y-6">
                    <ActivityForm customerId={customerId} onSuccess={handleSuccess} />
                    <ActivityTimeline customerId={customerId} refreshTrigger={refreshKey} />
                </CardContent>
            </Card>
        </div>
    );
}
