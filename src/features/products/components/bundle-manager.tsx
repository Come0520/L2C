'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getBundles,
    deleteBundle,
} from '../actions/bundle-actions';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { toast } from 'sonner';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Package from 'lucide-react/dist/esm/icons/package';

/**
 * 组合商品数据类型
 */
interface ProductBundle {
    id: string;
    bundleSku: string;
    bundleName: string;
    category: string;
    retailPrice: number | null;
    channelPrice: number | null;
    isActive: boolean;
    itemCount?: number;
    totalCost?: number;
}

/**
 * 组合商品管理组件
 * 
 * 功能：
 * - 展示组合商品列表
 * - 新增/编辑/删除组合商品
 * - 管理子商品明细
 */
export function BundleManager() {
    const [bundles, setBundles] = useState<ProductBundle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingBundle, setEditingBundle] = useState<ProductBundle | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // 表单状态
    const [formData, setFormData] = useState({
        bundleSku: '',
        bundleName: '',
        category: '',
        retailPrice: '',
        channelPrice: '',
    });

    /**
     * 加载组合商品列表
     */
    const loadBundles = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getBundles();
            if (result.data) {
                // 将 API 返回的数据映射到组件使用的类型
                const mappedBundles: ProductBundle[] = result.data.map(item => ({
                    id: item.id,
                    bundleSku: item.bundleSku,
                    bundleName: item.name,  // API 返回 name，组件使用 bundleName
                    category: item.category || '',
                    retailPrice: item.retailPrice ? parseFloat(item.retailPrice) : null,
                    channelPrice: item.channelPrice ? parseFloat(item.channelPrice) : null,
                    isActive: item.isActive ?? true,
                }));
                setBundles(mappedBundles);
            }
        } catch (_error) {
            toast.error('加载失败', { description: '无法加载组合商品列表' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBundles();
    }, [loadBundles]);

    /**
     * 打开新增对话框
     */
    const handleCreate = () => {
        setEditingBundle(null);
        setFormData({
            bundleSku: '',
            bundleName: '',
            category: '',
            retailPrice: '',
            channelPrice: '',
        });
        setDialogOpen(true);
    };

    /**
     * 打开编辑对话框
     */
    const handleEdit = (bundle: ProductBundle) => {
        setEditingBundle(bundle);
        setFormData({
            bundleSku: bundle.bundleSku,
            bundleName: bundle.bundleName,
            category: bundle.category || '',
            retailPrice: bundle.retailPrice?.toString() || '',
            channelPrice: bundle.channelPrice?.toString() || '',
        });
        setDialogOpen(true);
    };

    /**
     * 删除组合商品
     */
    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除此组合商品吗？删除后不可恢复。')) return;

        try {
            const result = await deleteBundle(id);
            if (result.error) {
                throw new Error(result.error);
            }

            setBundles(bundles.filter(b => b.id !== id));
            toast.success('删除成功');
        } catch (error) {
            toast.error('删除失败', {
                description: error instanceof Error ? error.message : '无法删除组合商品'
            });
        }
    };

    /**
     * 提交表单
     */
    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // TODO: 调用 Server Action 保存
            // if (editingBundle) {
            //     await updateBundle(editingBundle.id, formData);
            // } else {
            //     await createBundle(formData);
            // }

            toast.success(editingBundle ? '更新成功' : '创建成功');
            setDialogOpen(false);
            loadBundles();
        } catch (_error) {
            toast.error('保存失败', { description: '无法保存组合商品' });
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * 过滤数据
     */
    const filteredBundles = bundles.filter(b =>
        b.bundleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.bundleSku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    /**
     * 格式化价格
     */
    const formatPrice = (price: number | null) => {
        if (price === null || price === undefined) return '-';
        return `¥${Number(price).toFixed(2)}`;
    };

    return (
        <div className="space-y-4">
            {/* 工具栏 */}
            <div className="flex items-center justify-between">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索组合商品..."
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    新建组合商品
                </Button>
            </div>

            {/* 列表 */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>组合SKU</TableHead>
                            <TableHead>组合名称</TableHead>
                            <TableHead className="text-center">子商品数</TableHead>
                            <TableHead className="text-right">组合成本</TableHead>
                            <TableHead className="text-right">零售价</TableHead>
                            <TableHead className="text-right">渠道价</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : filteredBundles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Package className="h-8 w-8" />
                                        <p>暂无组合商品数据</p>
                                        <Button variant="outline" size="sm" onClick={handleCreate}>
                                            创建第一个组合商品
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredBundles.map((bundle) => (
                                <TableRow key={bundle.id}>
                                    <TableCell className="font-mono text-sm">{bundle.bundleSku}</TableCell>
                                    <TableCell className="font-medium">{bundle.bundleName}</TableCell>
                                    <TableCell className="text-center">
                                        {bundle.itemCount || 0} 件
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {formatPrice(bundle.totalCost || null)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatPrice(bundle.retailPrice)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatPrice(bundle.channelPrice)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(bundle)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(bundle.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* 新增/编辑对话框 */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingBundle ? '编辑组合商品' : '新建组合商品'}
                        </DialogTitle>
                        <DialogDescription>
                            创建组合SKU，将多个商品打包销售
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>组合SKU</Label>
                                <Input
                                    placeholder="如：BDL001"
                                    value={formData.bundleSku}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, bundleSku: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>组合名称</Label>
                                <Input
                                    placeholder="如：窗帘基础套装"
                                    value={formData.bundleName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, bundleName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>组合零售价</Label>
                                <Input
                                    type="number"
                                    placeholder="输入零售价"
                                    value={formData.retailPrice}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, retailPrice: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>组合渠道价</Label>
                                <Input
                                    type="number"
                                    placeholder="输入渠道价"
                                    value={formData.channelPrice}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, channelPrice: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* TODO: 添加子商品管理 */}
                        <div className="border rounded-lg p-4 bg-muted/30">
                            <p className="text-sm text-muted-foreground text-center">
                                子商品管理功能开发中...
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            保存
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
