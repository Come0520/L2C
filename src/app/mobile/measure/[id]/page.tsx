
'use client';

import { useEffect, useState, use } from 'react';
import { offlineStore, OfflineMeasurement } from '@/shared/lib/offline-store';

import { toast } from 'sonner';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { MeasurementMobileForm } from '@/features/service/measurement/components/mobile-form';

export default function MobileMeasurePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const [task, setTask] = useState<OfflineMeasurement | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);

    // 监听在线状态
    useEffect(() => {
        setIsOnline(navigator.onLine);
        window.addEventListener('online', () => setIsOnline(true));
        window.addEventListener('offline', () => setIsOnline(false));
    }, []);

    // 加载任务 (Offline First)
    useEffect(() => {
        async function loadTask() {
            try {
                // 1. 尝试从本地加载
                const localTask = await offlineStore.measurements.get(params.id);
                if (localTask) {
                    setTask(localTask);
                } else {
                    // 2. 本地没有，尝试联网 Pull (如果在线)
                    // 实际场景通常是在列表页 Pull All，这里做个 fallback
                    toast.error('本地未找到该任务，请返回列表刷新');
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadTask();
    }, [params.id]);

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!task) return <div className="p-8 text-center">任务不存在</div>;



    return (
        <div className="p-4 space-y-4 pb-20">
            {/* 上下文栏 */}
            <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                <span>任务 ID: {task.taskId.slice(0, 8)}...</span>
                <span className="flex items-center gap-1">
                    {isOnline ? <Wifi className="h-3 w-3 text-green-500" /> : <WifiOff className="h-3 w-3 text-destructive" />}
                    {task.status === 'synced' ? '已同步' : '未同步'}
                </span>
            </div>

            <div className="bg-card p-4 rounded-lg shadow-sm border">
                <h2 className="text-lg font-bold">{task.customerName}</h2>
                <p className="text-muted-foreground text-sm">{task.address}</p>
            </div>

            {/* 测量表单 */}
            <MeasurementMobileForm
                taskId={params.id}
                onSuccess={() => {
                    // 状态改为已同步（实际应由后端同步，此处做展示提示）
                    setTask(t => t ? { ...t, status: 'synced' } : null);
                }}
            />
        </div>
    );
}
