'use client';


import { logger } from '@/shared/lib/logger';
import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { checkInMeasureTask } from '../actions/check-in';

interface GPSCheckInProps {
    taskId: string;
}

export function GPSCheckIn({ taskId }: GPSCheckInProps) {
    const [loading, setLoading] = useState(false);
    const [checkedIn, setCheckedIn] = useState(false);

    const handleCheckIn = () => {
        if (!navigator.geolocation) {
            toast.error('浏览器不支持地理定位');
            return;
        }

        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const result = await checkInMeasureTask({
                        taskId,
                        latitude,
                        longitude,
                    });

                    if (result.success) {
                        setCheckedIn(true);
                        // 安全访问嵌套数据：result.data 由 createSafeAction 包装
                        const actionData = result.data as Record<string, unknown> | undefined;
                        const gpsResult = actionData?.gpsResult as Record<string, unknown> | undefined;
                        const msg = (gpsResult?.message as string) || '签到成功';
                        toast.success(msg);
                    } else {
                        toast.error(result.error || '签到失败');
                    }
                } catch (error) {
                    logger.error('GPS Check-in error:', error);
                    toast.error('签到过程中发生错误');
                } finally {
                    setLoading(false);
                }
            },
            (error) => {
                setLoading(false);
                logger.error('Geolocation error:', error);
                toast.error('获取地理位置失败，请在浏览器中允许定位权限');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant={checkedIn ? "outline" : "default"}
                size="sm"
                onClick={handleCheckIn}
                disabled={loading || checkedIn}
            >
                <MapPin className="mr-2 h-4 w-4" />
                {loading ? '定位中...' : checkedIn ? '已签到' : 'GPS 签到'}
            </Button>
            {checkedIn && <span className="text-xs text-green-600 font-medium">已完成上门签到</span>}
        </div>
    );
}
