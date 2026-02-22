'use client';

import { logger } from "@/shared/lib/logger";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLeadSchema, LeadFormValues } from '../schemas';

interface ConflictData {
    type: 'PHONE' | 'ADDRESS';
    existingEntity: {
        id: string;
        name: string;
        owner?: string | null;
    };
}
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { ChannelPicker } from '@/features/channels/components/channel-picker';
import { createLead, updateLead } from '../actions/mutations';
import { toast } from 'sonner';
// useTransition removed

interface LeadFormProps {
    onSuccess?: () => void;
    initialData?: Record<string, unknown>;
    channels?: Array<{ id: string; name: string; type?: string }>;
    isEdit?: boolean;
    tenantId: string;
}

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SmartDuplicateCheck } from './SmartDuplicateCheck';

export function LeadForm({ initialData, isEdit = false, onSuccess, tenantId }: LeadFormProps) {
    const router = useRouter();
    const [conflictData, setConflictData] = useState<ConflictData | null>(null);
    const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

    const form = useForm<LeadFormValues>({
        resolver: zodResolver(createLeadSchema),
        defaultValues: {
            customerName: (initialData?.customerName as string) || '',
            customerPhone: (initialData?.customerPhone as string) || '',
            customerWechat: (initialData?.customerWechat as string) || '',
            community: (initialData?.community as string) || '',
            houseType: (initialData?.houseType as string) || '',
            address: (initialData?.address as string) || '',
            remark: (initialData?.notes as string) || '', // 'notes' in DB, 'remark' in form? Check schema map
            sourceDetail: (initialData?.sourceDetail as string) || '',
            channelId: (initialData?.channelId as string) || (initialData?.sourceChannelId as string) || undefined,
            // id removed as it is not in LeadFormValues
            intentionLevel: (initialData?.intentionLevel as 'HIGH' | 'MEDIUM' | 'LOW') || undefined,
            estimatedAmount: initialData?.estimatedAmount ? Number(initialData.estimatedAmount) : undefined,
        },
    });

    const onSubmit = async (values: LeadFormValues) => {
        try {
            if (isEdit) {
                if (!initialData?.id || typeof initialData.id !== 'string') return;
                const res = await updateLead({ ...values, id: initialData.id });
                if (res.success) {
                    toast.success('线索更新成功');
                    onSuccess?.();
                } else {
                    toast.error(res.error || '更新失败');
                }
            } else {
                const res = await createLead(values);
                if (!res.success && res.status === 'DUPLICATE') {
                    setConflictData({
                        type: res.conflict.type as 'PHONE' | 'ADDRESS',
                        existingEntity: {
                            ...res.conflict.existingEntity,
                            owner: res.conflict.existingEntity.owner ?? undefined
                        }
                    });
                    setShowDuplicateDialog(true);
                    return;
                }
                if (!res.success) {
                    throw new Error(res.error || '创建失败');
                }
                toast.success('线索创建成功');
                onSuccess?.();
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : (isEdit ? '更新失败' : '创建失败');
            toast.error(message);
        }
    };

    const handleStrategySelect = (strategy: 'LINK' | 'OVERWRITE' | 'CANCEL') => {
        setShowDuplicateDialog(false);
        if (strategy === 'LINK' && conflictData?.existingEntity?.id) {
            router.push(`/leads/${conflictData.existingEntity.id}`);
        }
        // Overwrite not implemented yet
    };

    return (
        <>
            <SmartDuplicateCheck
                isOpen={showDuplicateDialog}
                onOpenChange={setShowDuplicateDialog}
                conflictData={conflictData}
                onStrategySelect={handleStrategySelect}
            />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="customerName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>客户姓名 *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="输入姓名" {...field} data-testid="lead-name-input" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="customerPhone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>手机号 *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="输入11位手机号" {...field} data-testid="lead-phone-input" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="customerWechat"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>微信号</FormLabel>
                                    <FormControl>
                                        <Input placeholder="输入微信号" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="community"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>小区/楼盘</FormLabel>
                                    <FormControl>
                                        <Input placeholder="例如：万科城市花园" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="sourceDetail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>来源备注</FormLabel>
                                    <FormControl>
                                        <Input placeholder="输入来源详情" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="channelId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>来源渠道</FormLabel>
                                    <FormControl>
                                        <ChannelPicker
                                            value={field.value || ''}
                                            onChange={field.onChange}
                                            placeholder="选择渠道"
                                            tenantId={tenantId}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="intentionLevel"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>意向等级</FormLabel>
                                    <FormControl>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            {...field}
                                            value={field.value || ''}
                                        >
                                            <option value="">选择等级</option>
                                            <option value="HIGH">高</option>
                                            <option value="MEDIUM">中</option>
                                            <option value="LOW">低</option>
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="estimatedAmount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>预计金额</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="输入预计金额"
                                            {...field}
                                            value={field.value || ''}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="remark"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>备注/需求</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="备注信息..." {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="submit" disabled={form.formState.isSubmitting} data-testid="submit-lead-btn">
                            {form.formState.isSubmitting ? '保存中...' : (isEdit ? '保存更新' : '创建线索')}
                        </Button>
                    </div>
                </form>
            </Form>
        </>
    );
}
