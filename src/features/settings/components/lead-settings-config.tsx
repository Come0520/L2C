'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Switch } from '@/shared/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/shared/ui/form';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { getSettingsByCategory, batchUpdateSettings } from '../actions/system-settings-actions';
import { Skeleton } from '@/shared/ui/skeleton';

/**
 * 线索设置组件
 * 包含：公海机制、自动分配、查重规则、跟进规则
 */

interface LeadSettingsFormData {
    // 公海机制
    ENABLE_LEAD_AUTO_RECYCLE: boolean;
    LEAD_AUTO_RECYCLE_TIMEOUT: number;
    LEAD_AUTO_RECYCLE_DAYS: number;
    LEAD_DAILY_CLAIM_LIMIT: number;
    // 分配规则
    LEAD_AUTO_ASSIGN_RULE: string;
    // 查重规则
    LEAD_DUPLICATE_STRATEGY: string;
    ENABLE_SECOND_KEY_DUPLICATE_CHECK: boolean;
}

const ASSIGN_RULES = [
    { value: 'ROUND_ROBIN', label: '轮转分配' },
    { value: 'LOAD_BALANCE', label: '负载均衡' },
    { value: 'CHANNEL_SPECIFIC', label: '渠道指定' },
    { value: 'TOP_PERFORMER', label: '优秀奖励' },
    { value: 'MANUAL', label: '手动分配' },
];

const DUPLICATE_STRATEGIES = [
    { value: 'AUTO_LINK', label: '自动归集' },
    { value: 'FORBID', label: '禁止重复' },
    { value: 'ALLOW_INDEPENDENT', label: '允许独立' },
];

export function LeadSettingsConfig() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<LeadSettingsFormData>({
        defaultValues: {
            ENABLE_LEAD_AUTO_RECYCLE: true,
            LEAD_AUTO_RECYCLE_TIMEOUT: 24,
            LEAD_AUTO_RECYCLE_DAYS: 30,
            LEAD_DAILY_CLAIM_LIMIT: 10,
            LEAD_AUTO_ASSIGN_RULE: 'ROUND_ROBIN',
            LEAD_DUPLICATE_STRATEGY: 'AUTO_LINK',
            ENABLE_SECOND_KEY_DUPLICATE_CHECK: true,
        },
    });

    // 加载现有配置
    useEffect(() => {
        let isMounted = true;
        async function loadSettings() {
            try {
                setError(null);
                const settings = await getSettingsByCategory('LEAD');
                if (settings && Object.keys(settings).length > 0 && isMounted) {
                    form.reset(settings as unknown as LeadSettingsFormData);
                }
            } catch (err) {
                if (isMounted) {
                    console.error('加载线索设置失败:', err);
                    setError(err instanceof Error ? err.message : '获取配置失败');
                    toast.error('加载线索设置失败');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }
        loadSettings();
        return () => { isMounted = false; };
    }, [form]);

    const onSubmit = async (data: LeadSettingsFormData) => {
        try {
            setIsSaving(true);
            await batchUpdateSettings(data as unknown as Record<string, unknown>);
            toast.success('线索设置已保存');
        } catch (error) {
            toast.error('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-3">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-3 w-48 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-14 w-full rounded-lg" />
                        <div className="grid grid-cols-3 gap-3">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <Skeleton className="h-5 w-32" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-destructive/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center text-destructive">
                    <p className="text-sm font-medium mb-2">配置加载失败</p>
                    <p className="text-xs text-muted-foreground mb-4">{error}</p>
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                        刷新重试
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <fieldset disabled={isSaving} className="space-y-6">
                    {/* 公海机制设置 */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">公海机制设置</CardTitle>
                            <CardDescription className="text-xs">配置线索自动回收规则</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="ENABLE_LEAD_AUTO_RECYCLE"
                                render={({ field }) => (
                                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                        <div className="space-y-0.5">
                                            <FormLabel>启用自动回收</FormLabel>
                                            <FormDescription className="text-xs">线索超时未跟进自动回收至公海</FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-3 gap-3">
                                <FormField
                                    control={form.control}
                                    name="LEAD_AUTO_RECYCLE_TIMEOUT"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm">超时未联系（小时）</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={168}
                                                    className="h-9"
                                                    value={field.value}
                                                    onChange={e => field.onChange(parseInt(e.target.value) || 24)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="LEAD_AUTO_RECYCLE_DAYS"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm">超时未成交（天）</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={365}
                                                    className="h-9"
                                                    value={field.value}
                                                    onChange={e => field.onChange(parseInt(e.target.value) || 30)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="LEAD_DAILY_CLAIM_LIMIT"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm">每日认领上限</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={100}
                                                    className="h-9"
                                                    value={field.value}
                                                    onChange={e => field.onChange(parseInt(e.target.value) || 10)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* 自动分配规则 */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">自动分配规则</CardTitle>
                            <CardDescription className="text-xs">配置新线索的分配策略</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="LEAD_AUTO_ASSIGN_RULE"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>分配策略</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="选择分配策略" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {ASSIGN_RULES.map(rule => (
                                                    <SelectItem key={rule.value} value={rule.value}>
                                                        {rule.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* 查重规则 */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">查重规则</CardTitle>
                            <CardDescription className="text-xs">配置重复线索的处理策略</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="LEAD_DUPLICATE_STRATEGY"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>处理策略</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="选择处理策略" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {DUPLICATE_STRATEGIES.map(strategy => (
                                                    <SelectItem key={strategy.value} value={strategy.value}>
                                                        {strategy.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="ENABLE_SECOND_KEY_DUPLICATE_CHECK"
                                render={({ field }) => (
                                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                        <div className="space-y-0.5">
                                            <FormLabel>启用地址查重</FormLabel>
                                            <FormDescription className="text-xs">当手机号为空时，使用地址作为查重依据</FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </fieldset>

                {/* 保存按钮 */}
                <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        保存设置
                    </Button>
                </div>
            </form>
        </Form>
    );
}
