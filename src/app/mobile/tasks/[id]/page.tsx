'use client';

/**
 * 移动端任务详情页面
 */

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useMobileAuth } from '@/shared/auth/mobile-auth-context';
import { mobileGet, mobilePost } from '@/shared/lib/mobile-api-client';
import { Button } from '@/shared/ui/button';
import {
    ArrowLeft,
    MapPin,
    Phone,
    Clock,
    CheckCircle,
    Loader2,
    Navigation,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================
// 类型定义
// ============================================================

interface TaskDetail {
    taskId: string;
    taskType: 'measure' | 'install';
    id: string;
    measureNo?: string;
    taskNo?: string;
    status: string | null;
    scheduledAt?: string | null;
    scheduledDate?: string | null;
    customer?: {
        name: string | null;
        phone: string | null;
        address: string | null;
    } | null;
    address?: string | null;
}

interface PageProps {
    params: Promise<{ id: string }>;
}

// ============================================================
// 打卡按钮组件
// ============================================================

function CheckInButton({
    taskId,
    onSuccess,
}: {
    taskId: string;
    onSuccess: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState('');

    // 获取地理位置
    const getLocation = () => {
        setLocationError('');
        if (!navigator.geolocation) {
            setLocationError('您的设备不支持定位');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            (error) => {
                console.error('Geolocation error:', error);
                setLocationError(
                    error.code === 1
                        ? '请允许获取位置权限'
                        : '获取位置失败，请重试'
                );
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // 提交打卡
    const handleCheckIn = async () => {
        if (!location) {
            getLocation();
            return;
        }

        setIsLoading(true);
        const response = await mobilePost(`/tasks/${taskId}/checkin`, {
            latitude: location.lat,
            longitude: location.lng,
            type: 'in',
        });
        setIsLoading(false);

        if (response.success) {
            toast.success('打卡成功');
            onSuccess();
        } else {
            toast.error(response.message || '打卡失败');
        }
    };

    return (
        <div className="space-y-2">
            {locationError && (
                <p className="text-sm text-red-500 text-center">{locationError}</p>
            )}
            {location && (
                <p className="text-xs text-green-600 text-center">
                    位置已获取: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
            )}
            <Button
                onClick={location ? handleCheckIn : getLocation}
                disabled={isLoading}
                className="w-full h-12"
            >
                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Navigation className="mr-2 h-4 w-4" />
                )}
                {location ? '确认打卡' : '获取位置并打卡'}
            </Button>
        </div>
    );
}

// ============================================================
// 主页面
// ============================================================

export default function MobileTaskDetailPage({ params }: PageProps) {
    const { id: taskId } = use(params);
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useMobileAuth();
    const [task, setTask] = useState<TaskDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 未登录跳转
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.replace('/mobile/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // 加载任务详情
    const fetchTask = async () => {
        if (!isAuthenticated) return;

        setIsLoading(true);
        const response = await mobileGet<TaskDetail>(`/tasks/${taskId}`);
        if (response.success && response.data) {
            setTask(response.data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchTask();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, taskId]);

    // 状态文本
    const getStatusText = (status: string | null) => {
        const map: Record<string, string> = {
            PENDING_DISPATCH: '待派单',
            DISPATCHING: '派单中',
            PENDING_ACCEPT: '待接单',
            PENDING_VISIT: '待上门',
            IN_PROGRESS: '进行中',
            COMPLETED: '已完成',
            PENDING_CONFIRM: '待确认',
        };
        return map[status || ''] || status || '未知';
    };

    // 接单
    const handleAccept = async (accept: boolean) => {
        const response = await mobilePost(`/tasks/${taskId}/accept`, { accept });
        if (response.success) {
            toast.success(accept ? '接单成功' : '已拒绝');
            fetchTask();
        } else {
            toast.error(response.message || '操作失败');
        }
    };

    // 完工
    const handleComplete = async () => {
        const response = await mobilePost(`/tasks/${taskId}/complete`, {});
        if (response.success) {
            toast.success('提交完工成功');
            fetchTask();
        } else {
            toast.error(response.message || '提交失败');
        }
    };

    // 加载状态
    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!task) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
                <p>任务不存在</p>
                <Button variant="link" onClick={() => router.back()}>
                    返回
                </Button>
            </div>
        );
    }

    const address = task.customer?.address || task.address || '';

    return (
        <div className="px-4 py-4">
            {/* 返回按钮 */}
            <button
                onClick={() => router.back()}
                className="flex items-center text-gray-500 mb-4"
            >
                <ArrowLeft className="h-5 w-5 mr-1" />
                返回
            </button>

            {/* 任务信息卡片 */}
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${task.taskType === 'measure' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                        {task.taskType === 'measure' ? '测量任务' : '安装任务'}
                    </span>
                    <span className="text-sm text-gray-500">
                        {task.measureNo || task.taskNo || task.id.slice(0, 8)}
                    </span>
                </div>

                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {task.customer?.name || '未知客户'}
                </h2>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {task.customer?.phone && (
                        <a
                            href={`tel:${task.customer.phone}`}
                            className="flex items-center gap-2 text-blue-600"
                        >
                            <Phone className="h-4 w-4" />
                            {task.customer.phone}
                        </a>
                    )}
                    {address && (
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5" />
                            <span>{address}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>状态: {getStatusText(task.status)}</span>
                    </div>
                </div>
            </div>

            {/* 操作区域 */}
            <div className="space-y-3">
                {/* 待接单状态 */}
                {task.status === 'PENDING_ACCEPT' && (
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 h-12"
                            onClick={() => handleAccept(false)}
                        >
                            拒绝
                        </Button>
                        <Button className="flex-1 h-12" onClick={() => handleAccept(true)}>
                            接单
                        </Button>
                    </div>
                )}

                {/* 待上门状态 - 打卡 */}
                {task.status === 'PENDING_VISIT' && (
                    <CheckInButton taskId={taskId} onSuccess={fetchTask} />
                )}

                {/* 进行中状态 - 完工 */}
                {task.status === 'IN_PROGRESS' && (
                    <Button className="w-full h-12" onClick={handleComplete}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        提交完工
                    </Button>
                )}

                {/* 已完成状态 */}
                {(task.status === 'COMPLETED' || task.status === 'PENDING_CONFIRM') && (
                    <div className="text-center text-green-600 py-4">
                        <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                        <p>任务已完成</p>
                    </div>
                )}
            </div>
        </div>
    );
}
