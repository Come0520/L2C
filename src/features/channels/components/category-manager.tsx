'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Textarea } from '@/shared/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    createChannelCategory,
    updateChannelCategory,
    deleteChannelCategory,
} from '@/features/channels/actions/categories';
import type { ChannelCategoryInput } from '@/features/channels/actions/schema';

// 渠道类型数据结构（从 Server Action 返回）
interface ChannelCategory {
    id: string;
    tenantId: string;
    name: string;
    code: string;
    description: string | null;
    isActive: boolean | null;
    sortOrder: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

interface CategoryManagerProps {
    initialData: ChannelCategory[];
    tenantId: string;
}

/**
 * 渠道类型管理组件
 * 支持增删改查、启用/禁用渠道类型
 */
export function CategoryManager({ initialData, tenantId: _tenantId }: CategoryManagerProps) {
    const [categories, setCategories] = useState<ChannelCategory[]>(initialData);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ChannelCategory | null>(null);
    const [isPending, startTransition] = useTransition();

    // 表单状态
    const [formData, setFormData] = useState<ChannelCategoryInput>({
        name: '',
        code: '',
        description: '',
        isActive: true,
        sortOrder: 0,
    });

    // 打开新建对话框
    const handleAdd = () => {
        setEditingCategory(null);
        setFormData({
            name: '',
            code: '',
            description: '',
            isActive: true,
            sortOrder: categories.length,
        });
        setIsDialogOpen(true);
    };

    // 打开编辑对话框
    const handleEdit = (category: ChannelCategory) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            code: category.code,
            description: category.description || '',
            isActive: category.isActive ?? true,
            sortOrder: category.sortOrder ?? 0,
        });
        setIsDialogOpen(true);
    };

    // 提交表单
    const handleSubmit = () => {
        if (!formData.name || !formData.code) {
            toast.error('请填写名称和代码');
            return;
        }

        startTransition(async () => {
            try {
                if (editingCategory) {
                    // 更新
                    const updated = await updateChannelCategory(editingCategory.id, formData);
                    if (updated) {
                        setCategories(prev =>
                            prev.map(c => c.id === editingCategory.id ? { ...c, ...updated } : c)
                        );
                        toast.success('渠道类型更新成功');
                    }
                } else {
                    // 新建
                    const created = await createChannelCategory(formData);
                    if (created) {
                        setCategories(prev => [...prev, created]);
                        toast.success('渠道类型创建成功');
                    }
                }
                setIsDialogOpen(false);
            } catch (error) {
                toast.error('操作失败，请重试');
                console.error(error);
            }
        });
    };

    // 删除
    const handleDelete = (category: ChannelCategory) => {
        if (!confirm(`确定删除「${category.name}」吗？`)) return;

        startTransition(async () => {
            try {
                await deleteChannelCategory(category.id);
                setCategories(prev => prev.filter(c => c.id !== category.id));
                toast.success('渠道类型删除成功');
            } catch (error) {
                toast.error('删除失败，请重试');
                console.error(error);
            }
        });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>渠道类型管理</CardTitle>
                <Button onClick={handleAdd} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    添加类型
                </Button>
            </CardHeader>
            <CardContent>
                {categories.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        暂无渠道类型，点击上方按钮添加
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>名称</TableHead>
                                <TableHead>代码</TableHead>
                                <TableHead>描述</TableHead>
                                <TableHead>状态</TableHead>
                                <TableHead>排序</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">{category.name}</TableCell>
                                    <TableCell>
                                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                            {category.code}
                                        </code>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                                        {category.description || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={category.isActive ? 'default' : 'secondary'}>
                                            {category.isActive ? '启用' : '禁用'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{category.sortOrder}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(category)}
                                            disabled={isPending}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(category)}
                                            disabled={isPending}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                {/* 编辑/新建对话框 */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingCategory ? '编辑渠道类型' : '新建渠道类型'}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">类型名称 *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="如：装修公司"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="code">类型代码 *</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                                    placeholder="如：DECORATION_CO"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">描述</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="可选的描述信息"
                                    rows={2}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <Label htmlFor="isActive">启用状态</Label>
                                <Switch
                                    id="isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sortOrder">排序</Label>
                                <Input
                                    id="sortOrder"
                                    type="number"
                                    value={formData.sortOrder}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                取消
                            </Button>
                            <Button onClick={handleSubmit} disabled={isPending}>
                                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {editingCategory ? '保存' : '创建'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
