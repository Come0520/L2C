'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { channelSchema, ChannelInput } from '../actions/schema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { createChannel, updateChannel } from '../actions/mutations';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ChannelFormProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData?: any; // 渠道数据结构复杂，后续可定义具体类型
    tenantId: string;
}

export function ChannelForm({ initialData, tenantId: _tenantId }: ChannelFormProps) {
    const router = useRouter();
    const form = useForm<ChannelInput>({
        resolver: zodResolver(channelSchema) as any,
        defaultValues: initialData || {
            category: 'OFFLINE',
            channelType: 'DECORATION_CO',
            level: 'C',
            name: '',
            code: '',
            contactName: '',
            phone: '',
            commissionRate: 0,
            commissionType: 'FIXED',
            cooperationMode: 'COMMISSION',
            priceDiscountRate: 1,
            settlementType: 'MONTHLY',
        },
    });

    const onSubmit = async (data: ChannelInput) => {
        try {
            if (initialData?.id) {
                await updateChannel(initialData.id, data);
                toast.success('渠道更新成功');
            } else {
                await createChannel(data);
                toast.success('渠道创建成功');
            }
            router.push('/channels');
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : '操作失败';
            toast.error(message);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>基本信息</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>渠道名称</FormLabel>
                                    <FormControl>
                                        <Input placeholder="请输入结算单位/公司名称" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>渠道编码</FormLabel>
                                    <FormControl>
                                        <Input placeholder="例如: QD2026001" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>渠道大类</FormLabel>
                                    <Select onValueChange={(val) => {
                                        field.onChange(val);
                                        // Reset channel type when category changes
                                        form.setValue('channelType', val === 'ONLINE' ? 'DOUYIN' : val === 'OFFLINE' ? 'DECORATION_CO' : 'OTHER');
                                    }} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择大类" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="ONLINE">线上渠道</SelectItem>
                                            <SelectItem value="OFFLINE">线下渠道</SelectItem>
                                            <SelectItem value="REFERRAL">转介绍</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="channelType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>子渠道类型</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择类型" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {form.watch('category') === 'ONLINE' && (
                                                <>
                                                    <SelectItem value="DOUYIN">抖音</SelectItem>
                                                    <SelectItem value="XIAOHONGSHU">小红书</SelectItem>
                                                    <SelectItem value="OTHER">其他线上</SelectItem>
                                                </>
                                            )}
                                            {form.watch('category') === 'OFFLINE' && (
                                                <>
                                                    <SelectItem value="DECORATION_CO">装饰公司</SelectItem>
                                                    <SelectItem value="DESIGNER">独立设计师</SelectItem>
                                                    <SelectItem value="CROSS_INDUSTRY">异业合作</SelectItem>
                                                    <SelectItem value="STORE">自营门店</SelectItem>
                                                </>
                                            )}
                                            {form.watch('category') === 'REFERRAL' && (
                                                <>
                                                    <SelectItem value="OTHER">通用转介绍</SelectItem>
                                                </>
                                            )}
                                            {/* Fallback to show all if no category selected (should not happen with default) */}
                                            {!form.watch('category') && <SelectItem value="OTHER">请先选择大类</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="level"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>渠道等级</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择等级" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="S">S级 (核心)</SelectItem>
                                            <SelectItem value="A">A级 (优质)</SelectItem>
                                            <SelectItem value="B">B级 (普通)</SelectItem>
                                            <SelectItem value="C">C级 (潜在)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>联系人信息</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="contactName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>主要联系人</FormLabel>
                                    <FormControl>
                                        <Input placeholder="姓名" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>联系电话</FormLabel>
                                    <FormControl>
                                        <Input placeholder="手机号" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>财务与商务</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="cooperationMode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>合作模式</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择模式" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="BASE_PRICE">供货价模式 (差价即佣金)</SelectItem>
                                            <SelectItem value="COMMISSION">佣金模式 (按比例结算)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="commissionRate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>返佣比例 (%)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            {...field}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="settlementType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>结算方式</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择方式" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="PREPAY">预付 (先款后货)</SelectItem>
                                            <SelectItem value="MONTHLY">月结 (定期结算)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button variant="outline" onClick={() => router.back()}>取消</Button>
                    <Button type="submit">提交保存</Button>
                </div>
            </form>
        </Form>
    );
}
