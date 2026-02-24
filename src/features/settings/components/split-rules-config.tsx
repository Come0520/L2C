'use client';
import { logger } from '@/shared/lib/logger';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/shared/ui/button';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash';
import Edit from 'lucide-react/dist/esm/icons/edit';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import Save from 'lucide-react/dist/esm/icons/save';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Switch } from '@/shared/ui/switch';
import { Input } from '@/shared/ui/input';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { Label } from '@/shared/ui/label';
import {
    getSplitRules,
    createSplitRule,
    updateSplitRule,
    deleteSplitRule,
} from '@/features/supply-chain/actions/rules';
import type { SplitRuleInput } from '@/features/supply-chain/actions/rules.schema';

/**
 * 采购拆单规则配置组件
 * 定义订单如何拆分为采购单
 */

interface SplitRule {
    id: string;
    name: string;
    priority: number;
    conditions: string;
    targetType: string;
    targetSupplierId: string | null;
    isActive: boolean;
}

const RULE_TYPE_OPTIONS = [
    { value: 'supplier', label: '按供应商', conditions: '{"type":"supplier"}' },
    { value: 'product_type', label: '按产品类型', conditions: '{"type":"product_type"}' },
    { value: 'urgency', label: '按紧急程度', conditions: '{"type":"urgency"}' },
];

export function SplitRulesConfig() {
    const [rules, setRules] = useState<SplitRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<SplitRule | null>(null);

    // 表单状态
    const [formData, setFormData] = useState({
        name: '',
        ruleType: 'supplier',
        priority: 0,
    });

    // 加载规则
    useEffect(() => {
        async function loadRules() {
            setIsLoading(true);
            try {
                const data = await getSplitRules();
                setRules(data as SplitRule[]);
            } catch (error) {
                logger.error('加载拆单规则失败:', error);
                toast.error('加载拆单规则失败');
            } finally {
                setIsLoading(false);
            }
        }
        loadRules();
    }, []);

    // 切换规则状态
    const handleToggle = (rule: SplitRule) => {
        startTransition(async () => {
            try {
                await updateSplitRule(rule.id, {
                    name: rule.name,
                    priority: rule.priority,
                    conditions: rule.conditions,
                    targetType: rule.targetType as 'PURCHASE_ORDER' | 'SERVICE_TASK',
                    targetSupplierId: rule.targetSupplierId,
                    isActive: !rule.isActive,
                });
                setRules(rules.map(r =>
                    r.id === rule.id ? { ...r, isActive: !r.isActive } : r
                ));
                toast.success('状态已更新');
            } catch (error) {
                logger.error('更新失败:', error);
                toast.error('更新失败');
            }
        });
    };

    // 打开新增/编辑对话框
    const openDialog = (rule?: SplitRule) => {
        if (rule) {
            setEditingRule(rule);
            const ruleType = RULE_TYPE_OPTIONS.find(
                opt => opt.conditions === rule.conditions
            )?.value || 'supplier';
            setFormData({
                name: rule.name,
                ruleType,
                priority: rule.priority,
            });
        } else {
            setEditingRule(null);
            setFormData({ name: '', ruleType: 'supplier', priority: 0 });
        }
        setDialogOpen(true);
    };

    // 保存规则
    const handleSave = () => {
        startTransition(async () => {
            try {
                const selectedType = RULE_TYPE_OPTIONS.find(
                    opt => opt.value === formData.ruleType
                );
                const input: SplitRuleInput = {
                    name: formData.name,
                    priority: formData.priority,
                    conditions: selectedType?.conditions || '{}',
                    targetType: 'PURCHASE_ORDER',
                    isActive: true,
                };

                if (editingRule) {
                    await updateSplitRule(editingRule.id, input);
                    setRules(rules.map(r =>
                        r.id === editingRule.id ? { ...r, ...input, isActive: true } : r
                    ));
                    toast.success('规则已更新');
                } else {
                    await createSplitRule(input);
                    // 重新加载列表获取新ID
                    const data = await getSplitRules();
                    setRules(data as SplitRule[]);
                    toast.success('规则已创建');
                }
                setDialogOpen(false);
            } catch (error) {
                logger.error('保存失败:', error);
                toast.error('保存失败');
            }
        });
    };

    // 删除规则
    const handleDelete = (id: string) => {
        startTransition(async () => {
            try {
                await deleteSplitRule(id);
                setRules(rules.filter(r => r.id !== id));
                toast.success('规则已删除');
            } catch (error) {
                logger.error('删除失败:', error);
                toast.error('删除失败');
            }
        });
    };

    // 获取规则类型标签
    const getRuleTypeLabel = (conditions: string) => {
        try {
            const parsed = JSON.parse(conditions);
            const option = RULE_TYPE_OPTIONS.find(opt => {
                const optParsed = JSON.parse(opt.conditions);
                return optParsed.type === parsed.type;
            });
            return option?.label || '未知';
        } catch {
            return '未知';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                    规则按优先级顺序执行（数字越大优先级越高）
                </p>
                <Button size="sm" onClick={() => openDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    添加规则
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60px]">优先级</TableHead>
                            <TableHead>规则名称</TableHead>
                            <TableHead>类型</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rules.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    暂无拆单规则，点击上方按钮添加
                                </TableCell>
                            </TableRow>
                        ) : (
                            rules.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell className="font-mono text-center">
                                        {rule.priority}
                                    </TableCell>
                                    <TableCell className="font-medium">{rule.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {getRuleTypeLabel(rule.conditions)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={rule.isActive}
                                            onCheckedChange={() => handleToggle(rule)}
                                            disabled={isPending}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openDialog(rule)}
                                            disabled={isPending}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive"
                                            onClick={() => handleDelete(rule.id)}
                                            disabled={isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* 新增/编辑对话框 */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingRule ? '编辑拆单规则' : '新增拆单规则'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>规则名称</Label>
                            <Input
                                placeholder="如：按供应商拆分"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>规则类型</Label>
                            <Select
                                value={formData.ruleType}
                                onValueChange={(v) => setFormData({ ...formData, ruleType: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {RULE_TYPE_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>优先级</Label>
                            <Input
                                type="number"
                                placeholder="数字越大优先级越高"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleSave} disabled={isPending || !formData.name}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            保存
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
