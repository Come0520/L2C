'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { MoreHorizontal, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/shared/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Switch } from '@/shared/ui/switch';
import { Badge } from '@/shared/ui/badge';
import { SplitRuleWithRelations } from '../types';
import { splitRuleSchema, SplitRuleInput } from '../actions/rules.schema';
import { createSplitRule, updateSplitRule, deleteSplitRule } from '../actions/rules';
import { EmptyUI } from '@/shared/ui/empty-ui';

interface SplitRuleManagerProps {
    rules: SplitRuleWithRelations[];
    suppliers: { id: string; name: string; supplierNo: string }[];
}

export function SplitRuleManager({ rules, suppliers }: SplitRuleManagerProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<SplitRuleWithRelations | null>(null);

    const handleAdd = () => {
        setSelectedRule(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (rule: SplitRuleWithRelations) => {
        setSelectedRule(rule);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除此规则吗？')) return;

        try {
            const res = await deleteSplitRule(id);
            if (res.success) {
                toast.success('删除成功');
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : '操作失败';
            toast.error(message);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle>智能拆单规则</CardTitle>
                    <CardDescription>管理订单自动拆分和路由到供应商的逻辑</CardDescription>
                </div>
                <Button onClick={handleAdd} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    新建规则
                </Button>
            </CardHeader>
            <CardContent>
                {rules.length === 0 ? (
                    <EmptyUI
                        message="暂无拆单规则，创建一个规则来开始自动分配订单"
                    />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>名称</TableHead>
                                <TableHead>优先级</TableHead>
                                <TableHead>目标类型</TableHead>
                                <TableHead>目标供应商</TableHead>
                                <TableHead>状态</TableHead>
                                <TableHead className="w-[80px]">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rules.sort((a, b) => (b.priority || 0) - (a.priority || 0)).map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell className="font-medium">{rule.name}</TableCell>
                                    <TableCell>{rule.priority}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {rule.targetType === 'PURCHASE_ORDER' ? '采购单' : '加工任务'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{rule.supplier?.name || '-'}</TableCell>
                                    <TableCell>
                                        {rule.isActive ? (
                                            <Badge className="bg-green-500">启用中</Badge>
                                        ) : (
                                            <Badge variant="secondary">已禁用</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>操作</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEdit(rule)}>
                                                    <Edit className="mr-2 h-4 w-4" /> 编辑
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(rule.id)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> 删除
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            <RuleDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                item={selectedRule}
                suppliers={suppliers}
            />
        </Card>
    );
}

interface RuleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: SplitRuleWithRelations | null;
    suppliers: { id: string; name: string; supplierNo: string }[];
}

function RuleDialog({ open, onOpenChange, item, suppliers }: RuleDialogProps) {
    const router = useRouter();
    const isEditing = !!item?.id;

    const form = useForm<z.infer<typeof splitRuleSchema>>({
        resolver: zodResolver(splitRuleSchema),
        defaultValues: {
            name: '',
            priority: 0,
            conditions: '[]',
            targetType: 'PURCHASE_ORDER',
            targetSupplierId: null,
            isActive: true,
        },
        values: item ? {
            name: item.name || '',
            priority: Number(item.priority) || 0,
            conditions: item.conditions ? (typeof item.conditions === 'string' ? item.conditions : JSON.stringify(item.conditions)) : '[]',
            targetType: item.targetType === 'SERVICE_TASK' ? 'SERVICE_TASK' : 'PURCHASE_ORDER',
            targetSupplierId: item.targetSupplierId,
            isActive: item.isActive ?? true,
        } : undefined,
    });

    const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = form;
    /* eslint-disable-next-line */
    const targetType = watch('targetType');

    const onSubmit = async (data: z.infer<typeof splitRuleSchema>) => {
        try {
            // Validate JSON
            try {
                JSON.parse(data.conditions);
            } catch (_e) {
                form.setError('conditions', { message: '无效的 JSON 格式' });
                return;
            }

            if (isEditing && item) {
                const res = await updateSplitRule(item.id, data);
                if (res.success) {
                    toast.success('规则已更新');
                    onOpenChange(false);
                    router.refresh();
                }
            } else {
                const res = await createSplitRule(data);
                if (res.success) {
                    toast.success('规则已创建');
                    onOpenChange(false);
                    router.refresh();
                }
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : '保存失败';
            toast.error(message);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? '编辑规则' : '新建规则'}</DialogTitle>
                        <DialogDescription>
                            设置拆单条件和路由的目标供应商。
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">规则名称</Label>
                            <Input
                                id="name"
                                {...register('name')}
                                placeholder="如：默认采购路由"
                            />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="priority">优先级</Label>
                                <Input
                                    id="priority"
                                    type="number"
                                    {...register('priority', { valueAsNumber: true })}
                                />
                                <p className="text-[10px] text-muted-foreground">数字越大优先级越高</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="targetType">目标类型</Label>
                                <Select
                                    onValueChange={(val) => setValue('targetType', val as SplitRuleInput['targetType'])}
                                    defaultValue={targetType}
                                    value={watch('targetType')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择目标" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PURCHASE_ORDER">采购单</SelectItem>
                                        <SelectItem value="SERVICE_TASK">加工任务</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="targetSupplierId">路由到供应商</Label>
                            <Select
                                onValueChange={(val) => setValue('targetSupplierId', val)}
                                defaultValue={watch('targetSupplierId') || undefined}
                                value={watch('targetSupplierId') || undefined}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="选择供应商" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="conditions">过滤条件 (JSON)</Label>
                            <Textarea
                                id="conditions"
                                {...register('conditions')}
                                className="font-mono text-xs min-h-[100px]"
                                placeholder='[{"field": "category", "operator": "eq", "value": "CLOTHING"}]'
                            />
                            {errors.conditions && <p className="text-xs text-red-500">{errors.conditions.message}</p>}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="isActive"
                                checked={watch('isActive')}
                                onCheckedChange={(checked) => setValue('isActive', checked)}
                            />
                            <Label htmlFor="isActive">启用此规则</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            取消
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? '保存中...' : '提交保存'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
