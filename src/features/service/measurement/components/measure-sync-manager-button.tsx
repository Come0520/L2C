'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { RefreshCw } from 'lucide-react';

export function MeasureSyncManagerButton({ quoteId }: { quoteId: string }) {
    const [loading, setLoading] = useState(false);

    const handleSync = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(true);
            alert('Syncing measurement data (mock)');
            setLoading(false);
        }, 1000);
    };

    return (
        <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleSync}
            disabled={loading}
        >
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Sync Measurement
        </Button>
    );
}
