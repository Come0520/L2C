'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLeadSchema, updateLeadSchema, LeadFormValues } from '../schemas';
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
import { useTransition } from 'react';

interface LeadFormProps {
    onSuccess?: () => void;
    userId: string;
    tenantId: string;
    initialData?: any;
    channels: any[];
}

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SmartDuplicateCheck } from './SmartDuplicateCheck';

export function LeadForm({ onSuccess, userId, tenantId, initialData, channels }: LeadFormProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const isEdit = !!initialData;
    const [conflictData, setConflictData] = useState<any>(null);
    const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

    const form = useForm<LeadFormValues>({
        resolver: zodResolver(isEdit ? updateLeadSchema : createLeadSchema) as any,
        defaultValues: {
            customerName: initialData?.customerName || '',
            customerPhone: initialData?.customerPhone || '',
            customerWechat: initialData?.customerWechat || '',
            community: initialData?.community || '',
            houseType: initialData?.houseType || '',
            address: initialData?.address || '',
            remark: initialData?.notes || '',
            sourceDetail: initialData?.sourceDetail || '',
            channelId: initialData?.channelId || initialData?.sourceChannelId || undefined,
            id: initialData?.id,
            intentionLevel: initialData?.intentionLevel || undefined,
            estimatedAmount: initialData?.estimatedAmount ? Number(initialData.estimatedAmount) : undefined,
        } as any,
    });

    const onSubmit = (values: LeadFormValues) => {
        startTransition(async () => {
            try {
                let result;
                if (isEdit) {
                    result = await updateLead({ ...values, id: initialData.id }, userId);
                    toast.success('线索更新成功');
                    onSuccess?.();
                } else {
                    const res = await createLead(values, userId, tenantId);
                    if (!res.success && res.status === 'DUPLICATE') {
                        setConflictData(res.conflict);
                        setShowDuplicateDialog(true);
                        return;
                    }
                    if (!res.success) {
                        throw new Error(res.error || '创建失败');
                    }
                    toast.success('线索创建成功');
                    onSuccess?.();
                }
            } catch (error: any) {
                toast.error(error.message || (isEdit ? '更新失败' : '创建失败'));
            }
        });
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="customerName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>客户姓名 *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="输入姓名" {...field} />
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
                                        <Input placeholder="输入11位手机号" {...field} />
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
                                            tenantId={tenantId}
                                            value={field.value || ''}
                                            onChange={field.onChange}
                                            placeholder="选择渠道"
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
                        <Button type="submit" disabled={isPending} data-testid="submit-lead-btn">
                            {isPending ? '保存中...' : (isEdit ? '保存更新' : '创建线索')}
                        </Button>
                    </div>
                </form>
            </Form>
        </>
    );
}
