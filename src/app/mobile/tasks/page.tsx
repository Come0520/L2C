'use client';

/**
 * 移动端任务列表页面
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMobileAuth } from '@/shared/auth/mobile-auth-context';
import { mobileGet } from '@/shared/lib/mobile-api-client';
import { MapPin, Clock, ChevronRight, Loader2 } from 'lucide-react';

// ============================================================
// 类型定义
// ============================================================

interface Task {
    id: string;
    type: 'measure' | 'install';
    docNo: string;
    status: string;
    customer: {
        name: string | null;
        phone: string | null;
    } | null;
    scheduledAt: string | null;
    address: string;
}

// ============================================================
// 任务卡片组件
// ============================================================

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
    const statusColors: Record<string, string> = {
        PENDING_DISPATCH: 'bg-yellow-100 text-yellow-800',
        DISPATCHING: 'bg-yellow-100 text-yellow-800',
        PENDING_ACCEPT: 'bg-orange-100 text-orange-800',
        PENDING_VISIT: 'bg-blue-100 text-blue-800',
        IN_PROGRESS: 'bg-green-100 text-green-800',
        COMPLETED: 'bg-gray-100 text-gray-800',
    };

    const statusLabels: Record<string, string> = {
        PENDING_DISPATCH: '待派单',
        DISPATCHING: '派单中',
        PENDING_ACCEPT: '待接单',
        PENDING_VISIT: '待上门',
        IN_PROGRESS: '进行中',
        COMPLETED: '已完成',
    };

    return (
        <div
            onClick={onClick}
            className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-4 mb-3 active:bg-gray-50 dark:active:bg-zinc-700"
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${task.type === 'measure' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                        {task.type === 'measure' ? '测量' : '安装'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[task.status] || 'bg-gray-100 text-gray-800'
                        }`}>
                        {statusLabels[task.status] || task.status}
                    </span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>

            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                {task.customer?.name || '未知客户'}
            </h3>

            <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{task.address || '暂无地址'}</span>
                </div>
                {task.scheduledAt && (
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(task.scheduledAt).toLocaleString('zh-CN', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================
// 主页面
// ============================================================

export default function MobileTasksPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useMobileAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'inProgress' | 'completed'>('pending');

    // 未登录跳转
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.replace('/mobile/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // 加载任务列表
    useEffect(() => {
        async function fetchTasks() {
            if (!isAuthenticated) return;

            setIsLoading(true);
            const response = await mobileGet<Task[]>('/tasks');
            if (response.success && response.data) {
                setTasks(response.data);
            }
            setIsLoading(false);
        }

        fetchTasks();
    }, [isAuthenticated]);

    // 过滤任务
    const filteredTasks = tasks.filter((task) => {
        const pendingStatuses = ['PENDING_DISPATCH', 'DISPATCHING', 'PENDING_ACCEPT', 'PENDING_VISIT'];
        const inProgressStatuses = ['IN_PROGRESS'];
        const completedStatuses = ['COMPLETED', 'PENDING_CONFIRM'];

        if (activeTab === 'pending') return pendingStatuses.includes(task.status);
        if (activeTab === 'inProgress') return inProgressStatuses.includes(task.status);
        if (activeTab === 'completed') return completedStatuses.includes(task.status);
        return true;
    });

    // 加载状态
    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="px-4 py-4">
            {/* Tab 切换 */}
            <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1 mb-4">
                {[
                    { key: 'pending', label: '待处理' },
                    { key: 'inProgress', label: '进行中' },
                    { key: 'completed', label: '已完成' },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as typeof activeTab)}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.key
                                ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 任务列表 */}
            {filteredTasks.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                    暂无{activeTab === 'pending' ? '待处理' : activeTab === 'inProgress' ? '进行中' : '已完成'}任务
                </div>
            ) : (
                filteredTasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => router.push(`/mobile/tasks/${task.id}`)}
                    />
                ))
            )}
        </div>
    );
}
