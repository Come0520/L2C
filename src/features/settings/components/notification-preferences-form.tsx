'use client';
import { logger } from '@/shared/lib/logger';

import { useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Checkbox } from '@/shared/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Bell, Mail, MessageSquare, Send, Smartphone } from 'lucide-react';
import {
    getNotificationPreferencesAction,
    updateNotificationPreferenceAction
} from '@/features/notifications/actions';

/**
 * 通知类型的中文标签映射
 */
const NOTIFICATION_TYPE_LABELS: Record<string, { label: string; description: string }> = {
    SYSTEM: { label: '系统通知', description: '系统公告、功能更新' },
    ORDER_STATUS: { label: '订单状态', description: '订单发货、安装完成' },
    APPROVAL: { label: '审批通知', description: '审批待处理、审批结果' },
    ALERT: { label: '预警通知', description: 'SLA超时、业务异常' },
    MENTION: { label: '@提及', description: '被人@提醒' },
    INFO: { label: '信息通知', description: '一般信息提示' },
    SUCCESS: { label: '成功通知', description: '操作成功反馈' },
    WARNING: { label: '警告通知', description: '需要注意的事项' },
    ERROR: { label: '错误通知', description: '系统错误、操作失败' }
};

/**
 * 通知渠道的配置
 */
const CHANNEL_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; disabled?: boolean }> = {
    IN_APP: { label: '站内通知', icon: Bell, disabled: true }, // 始终开启，不可关闭
    SMS: { label: '短信', icon: MessageSquare },
    WECHAT: { label: '微信服务号', icon: Smartphone },
    WECHAT_MINI: { label: '微信小程序', icon: Smartphone },
    LARK: { label: '飞书', icon: Send },
    EMAIL: { label: '邮件', icon: Mail }
};

interface PreferencesData {
    preferences: Record<string, string[]>;
    notificationTypes: string[];
    channels: string[];
}

export function NotificationPreferencesForm() {
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);
    const [prefsData, setPrefsData] = useState<PreferencesData | null>(null);

    // 加载偏好设置
    useEffect(() => {
        async function loadPreferences() {
            try {
                const result = await getNotificationPreferencesAction();
                if (result.success) {
                    /** createSafeAction 返回的 data 字段包含偏好设置响应 */
                    const responseData = result as { success: boolean; data?: { data: PreferencesData } };
                    if (responseData.data?.data) {
                        setPrefsData({
                            preferences: responseData.data.data.preferences,
                            notificationTypes: [...responseData.data.data.notificationTypes],
                            channels: [...responseData.data.data.channels]
                        });
                    }
                }
            } catch (error) {
                logger.error('加载偏好设置失败:', error);
                toast.error('加载偏好设置失败');
            } finally {
                setIsLoading(false);
            }
        }
        loadPreferences();
    }, []); // Run once on mount

    // 切换渠道
    const handleChannelToggle = (notificationType: string, channel: string, enabled: boolean) => {
        if (!prefsData) return;

        const currentChannels = prefsData.preferences[notificationType] || ['IN_APP'];
        let newChannels: string[];

        if (enabled) {
            newChannels = [...currentChannels, channel];
        } else {
            newChannels = currentChannels.filter(c => c !== channel);
        }

        // 确保 IN_APP 始终存在
        if (!newChannels.includes('IN_APP')) {
            newChannels = ['IN_APP', ...newChannels];
        }

        // 乐观更新 UI
        setPrefsData({
            ...prefsData,
            preferences: {
                ...prefsData.preferences,
                [notificationType]: newChannels
            }
        });

        // 发送更新请求
        startTransition(async () => {
            try {
                const result = await updateNotificationPreferenceAction({
                    notificationType: notificationType as Parameters<typeof updateNotificationPreferenceAction>[0]['notificationType'],
                    channels: newChannels as Parameters<typeof updateNotificationPreferenceAction>[0]['channels']
                });
                if (result.success) {
                    toast.success('偏好设置已更新');
                } else {
                    toast.error('更新失败');
                    // 回滚
                    setPrefsData({
                        ...prefsData,
                        preferences: {
                            ...prefsData.preferences,
                            [notificationType]: currentChannels
                        }
                    });
                }
            } catch {
                toast.error('更新失败');
                // 回滚
                setPrefsData({
                    ...prefsData,
                    preferences: {
                        ...prefsData.preferences,
                        [notificationType]: currentChannels
                    }
                });
            }
        });
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (!prefsData) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    加载偏好设置失败，请刷新页面重试
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>通知偏好设置</CardTitle>
                <CardDescription>管理您接收通知的方式。站内通知始终开启，确保您不会错过重要信息。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* 渠道图例 */}
                <div className="flex flex-wrap gap-4 pb-4 border-b">
                    {Object.entries(CHANNEL_CONFIG).map(([channel, config]) => {
                        const Icon = config.icon;
                        return (
                            <div key={channel} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Icon className="h-4 w-4" />
                                <span>{config.label}</span>
                                {config.disabled && <span className="text-xs">(必选)</span>}
                            </div>
                        );
                    })}
                </div>

                {/* 偏好设置列表 */}
                <div className="space-y-4">
                    {prefsData.notificationTypes.map((type) => {
                        const typeConfig = NOTIFICATION_TYPE_LABELS[type] || { label: type, description: '' };
                        const currentChannels = prefsData.preferences[type] || ['IN_APP'];

                        return (
                            <div key={type} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                                {/* 通知类型说明 */}
                                <div className="space-y-1">
                                    <Label className="text-base font-medium">{typeConfig.label}</Label>
                                    <p className="text-sm text-muted-foreground">{typeConfig.description}</p>
                                </div>

                                {/* 渠道选择 */}
                                <div className="flex flex-wrap gap-3">
                                    {Object.entries(CHANNEL_CONFIG).map(([channel, config]) => {
                                        const Icon = config.icon;
                                        const isChecked = currentChannels.includes(channel);
                                        const isDisabled = config.disabled || isPending;

                                        return (
                                            <div key={channel} className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`${type}-${channel}`}
                                                    checked={isChecked}
                                                    disabled={isDisabled}
                                                    onCheckedChange={(checked) => {
                                                        if (!config.disabled) {
                                                            handleChannelToggle(type, channel, checked as boolean);
                                                        }
                                                    }}
                                                />
                                                <Label
                                                    htmlFor={`${type}-${channel}`}
                                                    className={`flex items-center gap-1.5 cursor-pointer text-sm ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                    <span className="hidden sm:inline">{config.label}</span>
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 保存状态提示 */}
                {isPending && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        正在保存...
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
