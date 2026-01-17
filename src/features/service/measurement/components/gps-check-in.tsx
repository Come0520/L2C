'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import { toast } from 'sonner';

export function GPSCheckIn() {
    const [loading, setLoading] = useState(false);
    const [checkedIn, setCheckedIn] = useState(false);

    const handleCheckIn = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setCheckedIn(true);
            toast.success('GPS checked in (mock)');
        }, 1000);
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant={checkedIn ? "outline" : "default"}
                size="sm"
                onClick={handleCheckIn}
                disabled={loading}
            >
                <MapPin className="mr-2 h-4 w-4" />
                {loading ? 'Checking in...' : checkedIn ? 'Checked In' : 'Check In'}
            </Button>
            {checkedIn && <span className="text-xs text-muted-foreground">Location: Mock City, 123 St.</span>}
        </div>
    );
}
