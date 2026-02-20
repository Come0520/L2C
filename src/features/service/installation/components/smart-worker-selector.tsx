'use client';

import { useState, useEffect } from 'react';
import User from 'lucide-react/dist/esm/icons/user';
import Check from 'lucide-react/dist/esm/icons/check';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import { cn } from '@/shared/utils';
import { getInstallWorkersAction } from '../actions';

/**
 * 智能安装师选择器
 * 
 * 功能：
 * - 从 API 动态加载可用安装师列表
 * - 显示当前工作负载
 * - 支持选中状态
 */

interface Worker {
    id: string;
    name: string | null;
    workload?: number;
}

interface SmartWorkerSelectorProps {
    /** 当前选中的安装师 ID */
    value?: string;
    /** 选择回调 */
    onSelect: (id: string) => void;
    /** 可选：指定日期查询工作负载 */
    scheduledDate?: Date;
}

export function SmartWorkerSelector({ value, onSelect, scheduledDate: _scheduledDate }: SmartWorkerSelectorProps) {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 从 API 加载安装师列表
    useEffect(() => {
        async function loadWorkers() {
            setLoading(true);
            setError(null);

            try {
                const result = await getInstallWorkersAction();
                if (result.success && result.data) {
                    // 转换为组件需要的格式
                    const workerList = result.data.map(user => ({
                        id: user.id,
                        name: user.name,
                        workload: 0,  // NOTE: 后续可从 API 获取实际工作负载
                    }));
                    setWorkers(workerList);
                } else {
                    setError(result.error || '加载失败');
                }
            } catch (_err) {
                setError('网络错误，请重试');
            } finally {
                setLoading(false);
            }
        }

        loadWorkers();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">加载安装师列表...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-8 text-destructive">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="text-sm">{error}</span>
            </div>
        );
    }

    if (workers.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无可用安装师</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <h4 className="text-sm font-medium">选择安装师</h4>
            <div className="grid grid-cols-1 gap-2">
                {workers.map((worker) => (
                    <div
                        key={worker.id}
                        className={cn(
                            "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors",
                            value === worker.id ? "border-primary bg-primary/5" : "hover:bg-accent"
                        )}
                        onClick={() => onSelect(worker.id)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">{worker.name || '未命名'}</p>
                                <p className="text-xs text-muted-foreground">
                                    当日任务: {worker.workload || 0} 个
                                </p>
                            </div>
                        </div>
                        {value === worker.id && <Check className="h-4 w-4 text-primary" />}
                    </div>
                ))}
            </div>
        </div>
    );
}
