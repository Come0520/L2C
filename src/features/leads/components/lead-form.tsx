'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLeadSchema, LeadFormValues } from '../schemas';
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
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SmartDuplicateCheck } from './SmartDuplicateCheck';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

interface ConflictData {
    type: 'PHONE' | 'ADDRESS';
    existingEntity: {
        id: string;
        name: string;
        owner?: string | null;
    };
}

interface LeadFormProps {
    onSuccess?: () => void;
    initialData?: Record<string, unknown>;
    isEdit?: boolean;
    tenantId: string;
}

const INTENTION_LEVELS = [
    { value: 'HIGH', label: '高意向' },
    { value: 'MEDIUM', label: '中意向' },
    { value: 'LOW', label: '低意向' },
] as const;

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
            remark: (initialData?.notes as string) || '',
            sourceDetail: (initialData?.sourceDetail as string) || '',
            channelId: (initialData?.channelId as string) || (initialData?.sourceChannelId as string) || undefined,
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
                if (!res.success && res.status === 'DUPLICATE' && res.conflict) {
                    setConflictData({
                        type: res.conflict.type as 'PHONE' | 'ADDRESS',
                        existingEntity: res.conflict.existingEntity
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
    };

    return (
        <>
            <SmartDuplicateCheck
                isOpen={showDuplicateDialog}
                onOpenChange={setShowDuplicateDialog}
                onStrategySelect={handleStrategySelect}
                conflictData={conflictData}
            />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="customerName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>客户名称</FormLabel>
                                    <FormControl>
                                        <Input placeholder="输入客户姓名" {...field} />
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
                                    <FormLabel>联系电话</FormLabel>
                                    <FormControl>
                                        <Input placeholder="输入手机号" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="customerWechat"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>微信</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="可留空"
                                            {...field}
                                            value={field.value ?? ''}
                                        />
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
                                    <FormLabel>小区名称</FormLabel>
                                    <FormControl>
                                        <Input placeholder="地址所属小区" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="houseType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>户型</FormLabel>
                                    <FormControl>
                                        <Input placeholder="如：三室二厅" {...field} value={field.value ?? ''} />
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
                                    <FormLabel>预估金额 (元)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="数值"
                                            {...field}
                                            value={field.value ?? ''}
                                            onChange={e => field.onChange(e.target.valueAsNumber)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>详细地址</FormLabel>
                                <FormControl>
                                    <Input placeholder="街道、门牌号" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="channelId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>渠道来源</FormLabel>
                                    <FormControl>
                                        <ChannelPicker
                                            value={field.value ?? undefined}
                                            onChange={field.onChange}
                                            tenantId={tenantId}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="intentionLevel"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>意向等级</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择意向..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {INTENTION_LEVELS.map(level => (
                                                <SelectItem key={level.value} value={level.value}>
                                                    {level.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                <FormLabel>备注/详情</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="输入补充资料..." {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full md:w-auto">
                            {form.formState.isSubmitting ? '正在提交...' : (isEdit ? '保存更新' : '创建线索')}
                        </Button>
                    </div>
                </form>
            </Form>
        </>
    );
}
