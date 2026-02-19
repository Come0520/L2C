'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import RefreshCcw from 'lucide-react/dist/esm/icons/refresh-ccw';
import { toast } from 'sonner';
import { createChannel, updateChannel } from '@/features/channels/actions/mutations';
import { ChannelInput } from '@/features/channels/actions/schema';

// 表单验证 Schema
const formSchema = z.object({
    // 层级
    parentId: z.string().optional().nullable(),
    hierarchyLevel: z.number().int().min(1).max(3).default(1),
    categoryId: z.string().optional().nullable(),

    // 基础信息
    name: z.string().min(1, '请输入渠道名称'),
    channelNo: z.string().min(1, '请输入渠道编号'),
    category: z.enum(['ONLINE', 'OFFLINE', 'REFERRAL']).default('OFFLINE'),
    channelType: z.enum(['DECORATION_CO', 'DESIGNER', 'CROSS_INDUSTRY', 'DOUYIN', 'XIAOHONGSHU', 'STORE', 'OTHER']),
    customChannelType: z.string().max(50, '自定义类型不能超过50字').optional(),
    level: z.enum(['S', 'A', 'B', 'C']).default('C'),
    contactName: z.string().min(1, '请输入联系人'),
    phone: z.string().min(1, '请输入联系电话'),

    // 财务配置
    commissionRate: z.coerce.number().min(0).max(100).default(10),
    commissionType: z.enum(['FIXED', 'TIERED']).default('FIXED'),
    cooperationMode: z.enum(['BASE_PRICE', 'COMMISSION']).default('COMMISSION'),
    commissionTriggerMode: z.enum(['ORDER_CREATED', 'ORDER_COMPLETED', 'PAYMENT_COMPLETED']).default('PAYMENT_COMPLETED'),
    priceDiscountRate: z.coerce.number().min(0).max(2).optional(),
    settlementType: z.enum(['PREPAY', 'MONTHLY']).default('PREPAY'),
}).refine((data) => {
    if (data.channelType === 'OTHER' && !data.customChannelType) {
        return false;
    }
    return true;
}, {
    message: '请输入自定义类型名称',
    path: ['customChannelType'],
});

type FormData = z.infer<typeof formSchema>;

interface ChannelFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    channel?: {
        id: string;
        name: string;
        channelNo: string;
        level: string | null;
        parentId: string | null;
        categoryId: string | null;
        hierarchyLevel: number;
        contactName: string | null;
        phone: string | null;
        category?: string | null;
    } | null;
    parentChannel?: {
        id: string;
        name: string;
        hierarchyLevel: number;
        categoryId?: string | null;
        category?: string | null;
        channelType?: string | null;
        customChannelType?: string | null;
    } | null;
    categoryTypes: Array<{ id: string; name: string; code: string }>;
    tenantId: string;
    onSuccess: () => void;
}

/**
 * 渠道表单弹窗
 * 支持新建和编辑渠道
 */
export function ChannelFormDialog({
    open,
    onOpenChange,
    channel,
    parentChannel,
    categoryTypes,
    tenantId: _tenantId,
    onSuccess,
}: ChannelFormDialogProps) {
    const [isPending, startTransition] = useTransition();
    const isEdit = !!channel;

    const form = useForm<FormData>({
        // zodResolver 与 react-hook-form 泛型不完全兼容，需保留 as any（已知问题）
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            parentId: parentChannel?.id || channel?.parentId || null,
            hierarchyLevel: parentChannel ? parentChannel.hierarchyLevel + 1 : (channel?.hierarchyLevel || 1),
            categoryId: channel?.categoryId || parentChannel?.categoryId || null,
            name: channel?.name || '',
            channelNo: channel?.channelNo || (() => {
                const date = new Date();
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const random = Math.floor(Math.random() * 9000 + 1000);
                return `QD${year}${month}${day}${random}`;
            })(),
            // 继承父级 Category，如果有的话
            category: (channel?.category || parentChannel?.category || 'OFFLINE') as 'ONLINE' | 'OFFLINE' | 'REFERRAL',
            // 继承父级 channelType (作为默认值)
            channelType: (channel as unknown as { channelType: string })?.channelType as 'DECORATION_CO' || (parentChannel?.channelType as 'DECORATION_CO') || 'DECORATION_CO',
            customChannelType: (channel as unknown as { customChannelType?: string })?.customChannelType || '',
            level: (channel?.level as 'S' | 'A' | 'B' | 'C') || 'C',
            contactName: channel?.contactName || '',
            phone: channel?.phone || '',
            commissionRate: parseFloat((channel as unknown as { commissionRate: string })?.commissionRate || '10'),
            commissionType: (channel as unknown as { commissionType: string })?.commissionType as 'FIXED' | 'TIERED' || 'FIXED',
            cooperationMode: (channel as unknown as { cooperationMode: string })?.cooperationMode as 'BASE_PRICE' | 'COMMISSION' || 'COMMISSION',
            settlementType: (channel as unknown as { settlementType: string })?.settlementType as 'PREPAY' | 'MONTHLY' || 'PREPAY',
        },
    });

    const onSubmit = (data: FormData) => {
        startTransition(async () => {
            try {
                if (isEdit && channel) {
                    await updateChannel(channel.id, data as unknown as ChannelInput);
                    toast.success('渠道更新成功');
                } else {
                    await createChannel(data as unknown as ChannelInput);
                    toast.success('渠道创建成功');
                }
                onSuccess();
            } catch (error) {
                toast.error('操作失败，请重试');
                console.error(error);
            }
        });
    };

    // 渠道类型选项
    const channelTypeOptions = [
        { value: 'DECORATION_CO', label: '装修公司' },
        { value: 'DESIGNER', label: '设计师' },
        { value: 'CROSS_INDUSTRY', label: '跨界合作' },
        { value: 'DOUYIN', label: '抖音' },
        { value: 'XIAOHONGSHU', label: '小红书' },
        { value: 'STORE', label: '门店' },
        { value: 'OTHER', label: '自定义' },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? '编辑渠道' : parentChannel ? `新建子渠道 - ${parentChannel.name}` : '新建渠道'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit as Parameters<typeof form.handleSubmit>[0])}>
                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="basic">基础信息</TabsTrigger>
                            <TabsTrigger value="finance">财务配置</TabsTrigger>
                        </TabsList>

                        {/* 基础信息 Tab */}
                        <TabsContent value="basic" className="space-y-4 py-4">
                            {/* 层级信息（只读显示） */}
                            {parentChannel && (
                                <div className="p-3 bg-muted rounded-lg text-sm">
                                    <span className="text-muted-foreground">父级渠道：</span>
                                    <span className="font-medium">{parentChannel.name}</span>
                                    <span className="text-muted-foreground ml-4">层级：</span>
                                    <span className="font-medium">第 {parentChannel.hierarchyLevel + 1} 级</span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                {/* 渠道名称 */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">渠道名称 *</Label>
                                    <Input
                                        id="name"
                                        {...form.register('name')}
                                        placeholder="如：XX装饰公司"
                                    />
                                    {form.formState.errors.name && (
                                        <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                                    )}
                                </div>

                                {/* 渠道编号 */}
                                <div className="space-y-2">
                                    <Label htmlFor="channelNo">渠道编号 *</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="channelNo"
                                            {...form.register('channelNo')}
                                            placeholder="如：QD202601001"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            title="自动生成编号"
                                            onClick={() => {
                                                const date = new Date();
                                                const year = date.getFullYear();
                                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                                const day = String(date.getDate()).padStart(2, '0');
                                                const random = Math.floor(Math.random() * 9000 + 1000);
                                                const code = `QD${year}${month}${day}${random}`;
                                                form.setValue('channelNo', code);
                                            }}
                                        >
                                            <RefreshCcw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {form.formState.errors.channelNo && (
                                        <p className="text-xs text-destructive">{form.formState.errors.channelNo.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* 渠道类型 */}
                                <div className="space-y-2">
                                    <Label>渠道类型</Label>
                                    <Select
                                        value={form.watch('channelType')}
                                        onValueChange={(v) => form.setValue('channelType', v as FormData['channelType'])}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="选择类型" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {channelTypeOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* 自定义类型名称 */}
                                {form.watch('channelType') === 'OTHER' && (
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="customChannelType">自定义类型名称 *</Label>
                                        <Input
                                            id="customChannelType"
                                            {...form.register('customChannelType')}
                                            placeholder="请输入自定义渠道类型"
                                        />
                                        {form.formState.errors.customChannelType && (
                                            <p className="text-xs text-destructive">{form.formState.errors.customChannelType.message}</p>
                                        )}
                                    </div>
                                )}

                                {/* 渠道等级 */}
                                <div className="space-y-2">
                                    <Label>渠道等级</Label>
                                    <Select
                                        value={form.watch('level')}
                                        onValueChange={(v) => form.setValue('level', v as 'S' | 'A' | 'B' | 'C')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="选择等级" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="S">S 级（战略合作）</SelectItem>
                                            <SelectItem value="A">A 级（核心渠道）</SelectItem>
                                            <SelectItem value="B">B 级（重要渠道）</SelectItem>
                                            <SelectItem value="C">C 级（普通渠道）</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* 渠道分类（类型表） */}
                            {categoryTypes.length > 0 && (
                                <div className="space-y-2">
                                    <Label>渠道分类</Label>
                                    <Select
                                        value={form.watch('categoryId') || ''}
                                        onValueChange={(v) => form.setValue('categoryId', v || null)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="选择分类（可选）" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categoryTypes.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                {/* 联系人 */}
                                <div className="space-y-2">
                                    <Label htmlFor="contactName">核心联系人 *</Label>
                                    <Input
                                        id="contactName"
                                        {...form.register('contactName')}
                                        placeholder="联系人姓名"
                                    />
                                </div>

                                {/* 电话 */}
                                <div className="space-y-2">
                                    <Label htmlFor="phone">联系电话 *</Label>
                                    <Input
                                        id="phone"
                                        {...form.register('phone')}
                                        placeholder="手机号码"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* 财务配置 Tab */}
                        <TabsContent value="finance" className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* 合作模式 */}
                                <div className="space-y-2">
                                    <Label>合作模式</Label>
                                    <Select
                                        value={form.watch('cooperationMode')}
                                        onValueChange={(v) => form.setValue('cooperationMode', v as 'BASE_PRICE' | 'COMMISSION')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="COMMISSION">返佣模式</SelectItem>
                                            <SelectItem value="BASE_PRICE">底价供货</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* 结算方式 */}
                                <div className="space-y-2">
                                    <Label>结算方式</Label>
                                    <Select
                                        value={form.watch('settlementType')}
                                        onValueChange={(v) => form.setValue('settlementType', v as 'PREPAY' | 'MONTHLY')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PREPAY">预付结算</SelectItem>
                                            <SelectItem value="MONTHLY">月结</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* 返点比例 */}
                                <div className="space-y-2">
                                    <Label htmlFor="commissionRate">返点比例 (%)</Label>
                                    <Input
                                        id="commissionRate"
                                        type="number"
                                        step="0.1"
                                        {...form.register('commissionRate')}
                                    />
                                </div>

                                {/* 返点类型 */}
                                <div className="space-y-2">
                                    <Label>返点类型</Label>
                                    <Select
                                        value={form.watch('commissionType')}
                                        onValueChange={(v) => form.setValue('commissionType', v as 'FIXED' | 'TIERED')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FIXED">固定比例</SelectItem>
                                            <SelectItem value="TIERED">阶梯返点</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* 佣金触发模式 */}
                            <div className="space-y-2">
                                <Label>佣金触发时机</Label>
                                <Select
                                    value={form.watch('commissionTriggerMode')}
                                    onValueChange={(v) => form.setValue('commissionTriggerMode', v as 'ORDER_CREATED' | 'ORDER_COMPLETED' | 'PAYMENT_COMPLETED')}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PAYMENT_COMPLETED">收款完成后（默认）</SelectItem>
                                        <SelectItem value="ORDER_COMPLETED">订单完成时</SelectItem>
                                        <SelectItem value="ORDER_CREATED">订单创建时</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            取消
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {isEdit ? '保存' : '创建'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
