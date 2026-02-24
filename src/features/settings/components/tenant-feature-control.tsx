'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Switch } from '@/shared/ui/switch';
import { Button } from '@/shared/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/shared/ui/form';
import { toast } from 'sonner';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import Save from 'lucide-react/dist/esm/icons/save';
import Shield from 'lucide-react/dist/esm/icons/shield';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Bell from 'lucide-react/dist/esm/icons/bell';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Users from 'lucide-react/dist/esm/icons/users';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import { useState } from 'react';

/**
 * 租户功能控制
 * 
 * 功能：
 * 1. 模块启用/禁用
 * 2. 功能开关
 * 3. 权限控制
 */

const tenantFeatureSchema = z.object({
    // 模块控制
    enableQuoteModule: z.boolean(),      // 报价模块
    enableOrderModule: z.boolean(),      // 订单模块
    enableFinanceModule: z.boolean(),    // 财务模块
    enableServiceModule: z.boolean(),    // 服务模块
    enableAfterSalesModule: z.boolean(), // 售后模块
    enableAnalyticsModule: z.boolean(),  // 报表模块

    // 功能开关
    enableApprovalWorkflow: z.boolean(), // 审批流程
    enableNotifications: z.boolean(),    // 消息通知
    enableMobileApp: z.boolean(),        // 移动端访问
    enableApiAccess: z.boolean(),        // API 接口访问

    // 安全设置
    requireMfaForAdmin: z.boolean(),     // 管理员 MFA
    sessionTimeoutMinutes: z.number().min(5).max(480),
    maxLoginAttempts: z.number().min(3).max(10),

    // 高级功能
    enableAuditLog: z.boolean(),         // 操作日志
    enableDataExport: z.boolean(),       // 数据导出
    enableCustomFields: z.boolean(),     // 自定义字段
});

type TenantFeatureFormData = z.infer<typeof tenantFeatureSchema>;

interface TenantFeatureControlProps {
    initialValues?: Partial<TenantFeatureFormData>;
    onSave?: (data: TenantFeatureFormData) => Promise<void>;
}

export function TenantFeatureControl({ initialValues, onSave }: TenantFeatureControlProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<TenantFeatureFormData>({
        resolver: zodResolver(tenantFeatureSchema),
        defaultValues: {
            // 模块默认全开
            enableQuoteModule: initialValues?.enableQuoteModule ?? true,
            enableOrderModule: initialValues?.enableOrderModule ?? true,
            enableFinanceModule: initialValues?.enableFinanceModule ?? true,
            enableServiceModule: initialValues?.enableServiceModule ?? true,
            enableAfterSalesModule: initialValues?.enableAfterSalesModule ?? true,
            enableAnalyticsModule: initialValues?.enableAnalyticsModule ?? true,

            // 功能开关
            enableApprovalWorkflow: initialValues?.enableApprovalWorkflow ?? true,
            enableNotifications: initialValues?.enableNotifications ?? true,
            enableMobileApp: initialValues?.enableMobileApp ?? true,
            enableApiAccess: initialValues?.enableApiAccess ?? false,

            // 安全设置
            requireMfaForAdmin: initialValues?.requireMfaForAdmin ?? false,
            sessionTimeoutMinutes: initialValues?.sessionTimeoutMinutes ?? 60,
            maxLoginAttempts: initialValues?.maxLoginAttempts ?? 5,

            // 高级功能
            enableAuditLog: initialValues?.enableAuditLog ?? true,
            enableDataExport: initialValues?.enableDataExport ?? true,
            enableCustomFields: initialValues?.enableCustomFields ?? false,
        },
    });

    const onSubmit = async (data: TenantFeatureFormData) => {
        try {
            setIsLoading(true);
            if (onSave) {
                await onSave(data);
            }
            toast.success('租户功能配置已保存');
        } catch (error) {
            toast.error('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
        } finally {
            setIsLoading(false);
        }
    };

    const FeatureSwitch = ({ name, label, description, icon: Icon }: {
        name: keyof TenantFeatureFormData;
        label: string;
        description: string;
        icon: React.ComponentType<{ className?: string }>;
    }) => (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">{label}</FormLabel>
                            <FormDescription>{description}</FormDescription>
                        </div>
                    </div>
                    <FormControl>
                        <Switch
                            checked={field.value as boolean}
                            onCheckedChange={field.onChange}
                        />
                    </FormControl>
                </FormItem>
            )}
        />
    );

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* 模块控制 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5" />
                                模块控制
                            </CardTitle>
                            <CardDescription>启用或禁用系统模块</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <FeatureSwitch
                                name="enableQuoteModule"
                                label="报价模块"
                                description="报价单创建、编辑、快速报价"
                                icon={FileText}
                            />
                            <FeatureSwitch
                                name="enableOrderModule"
                                label="订单模块"
                                description="订单管理、拆单、发货"
                                icon={FileText}
                            />
                            <FeatureSwitch
                                name="enableFinanceModule"
                                label="财务模块"
                                description="收付款、对账、结算"
                                icon={Wallet}
                            />
                            <FeatureSwitch
                                name="enableServiceModule"
                                label="服务模块"
                                description="测量、安装任务管理"
                                icon={Users}
                            />
                        </CardContent>
                    </Card>

                    {/* 功能开关 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                功能开关
                            </CardTitle>
                            <CardDescription>控制系统功能特性</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <FeatureSwitch
                                name="enableApprovalWorkflow"
                                label="审批流程"
                                description="启用业务审批流程"
                                icon={FileText}
                            />
                            <FeatureSwitch
                                name="enableNotifications"
                                label="消息通知"
                                description="系统通知和提醒"
                                icon={Bell}
                            />
                            <FeatureSwitch
                                name="enableMobileApp"
                                label="移动端访问"
                                description="允许通过移动端 APP 访问"
                                icon={Users}
                            />
                        </CardContent>
                    </Card>

                    {/* 安全设置 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                安全设置
                            </CardTitle>
                            <CardDescription>账户和访问安全配置</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <FeatureSwitch
                                name="requireMfaForAdmin"
                                label="管理员双因素认证"
                                description="要求管理员账户启用 MFA"
                                icon={Shield}
                            />
                            <FeatureSwitch
                                name="enableAuditLog"
                                label="操作日志"
                                description="记录用户关键操作"
                                icon={FileText}
                            />
                            <FeatureSwitch
                                name="enableDataExport"
                                label="数据导出"
                                description="允许导出业务数据"
                                icon={FileText}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            保存配置
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
