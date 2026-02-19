'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { splitRuleSchema, type SplitRuleInput } from '../actions/rules.schema';
import { createSplitRule, updateSplitRule, deleteSplitRule } from '../actions/rules';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Switch } from '@/shared/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { toast } from 'sonner';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

import { SplitRule } from '../types';

interface SplitRuleManagerProps {
    initialRules: SplitRule[];
    suppliers: { id: string; name: string; supplierNo: string }[];
}

export function SplitRuleManager({ initialRules, suppliers }: SplitRuleManagerProps) {
    const [rules, setRules] = useState<SplitRule[]>(initialRules);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<SplitRule | null>(null);
    const router = useRouter();

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这条规则吗？')) return;
        try {
            await deleteSplitRule(id);
            toast.success('规则已删除');
            router.refresh();
            // Optimistic update
            setRules(rules.filter(r => r.id !== id));
        } catch (error: any) {
            toast.error(error.message || '删除失败');
        }
    };

    const handleEdit = (rule: SplitRule) => {
        setEditingRule(rule);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingRule(null);
        setIsDialogOpen(true);
    };

    const onDialogClose = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) setEditingRule(null);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle>拆单规则配置</CardTitle>
                    <CardDescription>定义订单自动拆分和分配的规则</CardDescription>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    添加规则
                </Button>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">优先级</TableHead>
                                <TableHead>规则名称</TableHead>
                                <TableHead>目标类型</TableHead>
                                <TableHead>目标供应商</TableHead>
                                <TableHead>状态</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rules.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        暂无规则
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rules.map((rule) => (
                                    <TableRow key={rule.id}>
                                        <TableCell>{rule.priority}</TableCell>
                                        <TableCell className="font-medium">{rule.name}</TableCell>
                                        <TableCell>{rule.targetType}</TableCell>
                                        <TableCell>
                                            {suppliers.find(s => s.id === rule.targetSupplierId)?.name || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {rule.isActive ? '启用' : '禁用'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            <RuleDialog
                open={isDialogOpen}
                onOpenChange={onDialogClose}
                item={editingRule || undefined}
                suppliers={suppliers}
            />
        </Card>
    );
}

interface RuleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // item is likely a full record from DB, so it should have id and other fields
    // Assuming SplitRuleInput matches the DB columns mostly, but we need ID
    item?: SplitRule | null;
    suppliers: { id: string; name: string; supplierNo: string }[];
}

function RuleDialog({ open, onOpenChange, item, suppliers }: RuleDialogProps) {
    const router = useRouter();
    const isEditing = !!item?.id; // Check for ID to confirm editing mode

    const form = useForm<SplitRuleInput>({
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
            priority: item.priority || 0,
            conditions: item.conditions ? (typeof item.conditions === 'string' ? item.conditions : JSON.stringify(item.conditions)) : '[]',
            targetType: (item.targetType as any) || 'PURCHASE_ORDER',
            targetSupplierId: item.targetSupplierId,
            isActive: item.isActive ?? true,
        } : undefined,
    });

    const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = form;
    const targetType = watch('targetType');

    const onSubmit: SubmitHandler<SplitRuleInput> = async (data) => {
        try {
            // Validate JSON
            try {
                JSON.parse(data.conditions);
            } catch (e) {
                form.setError('conditions', { message: '无效的 JSON 格式' });
                return;
            }

            if (isEditing && item?.id) {
                await updateSplitRule(item.id, data);
                toast.success('规则已更新');
            } else {
                await createSplitRule(data);
                toast.success('规则已创建');
            }
            router.refresh();
            onOpenChange(false);
            if (!isEditing) form.reset();
        } catch (error: any) {
            toast.error(error.message || '操作失败');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? '编辑规则' : '添加规则'}</DialogTitle>
                    <DialogDescription>
                        配置自动拆单和分配规则。条件字段需为有效的 JSON 数组。
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">规则名称</Label>
                            <Input id="name" {...register('name')} placeholder="例如：面料自动分配" />
                            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="priority">优先级 (越大越优先)</Label>
                            <Input id="priority" type="number" {...register('priority')} />
                            {errors.priority && <p className="text-sm text-red-500">{errors.priority.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="targetType">目标类型</Label>
                        <Select
                            onValueChange={(val: any) => setValue('targetType', val)}
                            defaultValue={targetType}
                            value={watch('targetType')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="选择类型" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PURCHASE_ORDER">采购单 (PURCHASE_ORDER)</SelectItem>
                                <SelectItem value="SERVICE_TASK">服务任务 (SERVICE_TASK)</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.targetType && <p className="text-sm text-red-500">{errors.targetType.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="targetSupplierId">目标供应商 (可选)</Label>
                        <Select
                            onValueChange={(val) => setValue('targetSupplierId', val === 'none' ? null : val)}
                            value={watch('targetSupplierId') || 'none'}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="选择供应商" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">无 (动态分配)</SelectItem>
                                {suppliers.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name} ({s.supplierNo})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="conditions">规则条件 (JSON)</Label>
                        <Textarea
                            id="conditions"
                            {...register('conditions')}
                            placeholder='[{"field": "category", "operator": "eq", "value": "FABRIC"}]'
                            className="font-mono h-32"
                        />
                        {errors.conditions && <p className="text-sm text-red-500">{errors.conditions.message}</p>}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="isActive"
                            checked={watch('isActive')}
                            onCheckedChange={(checked) => setValue('isActive', checked)}
                        />
                        <Label htmlFor="isActive">启用此规则</Label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            取消
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            保存
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
