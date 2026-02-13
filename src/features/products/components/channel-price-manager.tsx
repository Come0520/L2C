'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getAllChannelPrices,
    addChannelPrice,
    updateChannelPrice,
    removeChannelPrice,
} from '../actions/channel-price-actions';
import { getChannels } from '@/features/settings/actions';
import { getProducts } from '../actions';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { toast } from 'sonner';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

/**
 * 渠道专属价数据类型
 */
interface ChannelPrice {
    id: string;
    productId: string;
    channelId: string;
    specialPrice: string;
    isActive: boolean | null;
    product: {
        id: string;
        name: string;
        sku: string;
        retailPrice: string | null;
    } | null;
    channel: {
        id: string;
        name: string;
        code: string;
    } | null;
}

/**
 * 渠道数据类型
 */
interface Channel {
    id: string;
    name: string;
    code: string | null;
}

/**
 * 商品数据类型
 */
interface Product {
    id: string;
    name: string;
    sku: string;
    retailPrice: string | null;
}

/**
 * 渠道专属价管理组件
 * 
 * 功能：
 * - 展示渠道专属价列表
 * - 新增/编辑/删除渠道专属价
 * - 按渠道/商品筛选
 */
export function ChannelPriceManager() {
    const [prices, setPrices] = useState<ChannelPrice[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPrice, setEditingPrice] = useState<ChannelPrice | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // 表单状态
    const [formData, setFormData] = useState({
        productId: '',
        channelId: '',
        specialPrice: '',
    });

    /**
     * 加载渠道专属价列表
     */
    const loadPrices = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getAllChannelPrices();
            if (result.success && result.data) {
                setPrices(result.data as ChannelPrice[]);
            } else if (result.error) {
                toast.error('加载失败', { description: result.error });
            }
        } catch (_error) {
            toast.error('加载失败', { description: '无法加载渠道专属价列表' });
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * 加载渠道和商品列表（用于新增对话框）
     */
    const loadPickerData = useCallback(async () => {
        try {
            // 加载渠道
            const channelResult = await getChannels();
            if (channelResult.success && Array.isArray(channelResult.data)) {
                setChannels(channelResult.data as Channel[]);
            }

            // 加载商品（获取前100个商品用于选择）
            const productResult = await getProducts({ page: 1, pageSize: 100 });
            if (productResult.data && Array.isArray(productResult.data)) {
                setProducts(productResult.data as Product[]);
            }
        } catch (_error) {
            console.error('加载选择器数据失败:', _error);
        }
    }, []);

    useEffect(() => {
        loadPrices();
        loadPickerData();
    }, [loadPrices, loadPickerData]);

    /**
     * 打开新增对话框
     */
    const handleCreate = () => {
        setEditingPrice(null);
        setFormData({ productId: '', channelId: '', specialPrice: '' });
        setDialogOpen(true);
    };

    /**
     * 打开编辑对话框
     */
    const handleEdit = (price: ChannelPrice) => {
        setEditingPrice(price);
        setFormData({
            productId: price.productId,
            channelId: price.channelId,
            specialPrice: price.specialPrice,
        });
        setDialogOpen(true);
    };

    /**
     * 删除渠道专属价
     */
    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除此渠道专属价吗？')) return;

        try {
            const result = await removeChannelPrice(id);
            if (result.success) {
                setPrices(prices.filter(p => p.id !== id));
                toast.success('删除成功');
            } else {
                throw new Error(result.error || '删除失败');
            }
        } catch (error) {
            toast.error('删除失败', {
                description: error instanceof Error ? error.message : '无法删除渠道专属价'
            });
        }
    };

    /**
     * 提交表单
     */
    const handleSubmit = async () => {
        if (!editingPrice && (!formData.productId || !formData.channelId)) {
            toast.error('请选择渠道和商品');
            return;
        }
        if (!formData.specialPrice) {
            toast.error('请输入专属价格');
            return;
        }

        setSubmitting(true);
        try {
            if (editingPrice) {
                const result = await updateChannelPrice(editingPrice.id, {
                    specialPrice: formData.specialPrice,
                });
                if (!result.success) {
                    throw new Error(result.error || '更新失败');
                }
                toast.success('更新成功');
            } else {
                const result = await addChannelPrice(formData.productId, {
                    channelId: formData.channelId,
                    specialPrice: formData.specialPrice,
                });
                if (!result.success) {
                    throw new Error(result.error || '创建失败');
                }
                toast.success('创建成功');
            }

            setDialogOpen(false);
            loadPrices();
        } catch (error) {
            toast.error('保存失败', {
                description: error instanceof Error ? error.message : '无法保存渠道专属价'
            });
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * 过滤数据
     */
    const filteredPrices = prices.filter(p => {
        const productName = p.product?.name || '';
        const channelName = p.channel?.name || '';
        const productSku = p.product?.sku || '';

        return productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            channelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            productSku.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="space-y-4">
            {/* 工具栏 */}
            <div className="flex items-center justify-between">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索商品或渠道..."
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    新增渠道专属价
                </Button>
            </div>

            {/* 列表 */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>渠道</TableHead>
                            <TableHead>商品</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead className="text-right">标准价</TableHead>
                            <TableHead className="text-right">专属价</TableHead>
                            <TableHead className="text-right">优惠幅度</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : filteredPrices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    暂无渠道专属价数据
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPrices.map((price) => {
                                const retailPrice = parseFloat(price.product?.retailPrice || '0');
                                const specialPrice = parseFloat(price.specialPrice);
                                const discount = retailPrice > 0
                                    ? ((1 - specialPrice / retailPrice) * 100).toFixed(0)
                                    : '0';

                                return (
                                    <TableRow key={price.id}>
                                        <TableCell className="font-medium">
                                            {price.channel?.name || '-'}
                                        </TableCell>
                                        <TableCell>{price.product?.name || '-'}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {price.product?.sku || '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            ¥{retailPrice.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-primary">
                                            ¥{specialPrice.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600">
                                            -{discount}%
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={price.isActive ? 'default' : 'secondary'}>
                                                {price.isActive ? '启用' : '禁用'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(price)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(price.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* 新增/编辑对话框 */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingPrice ? '编辑渠道专属价' : '新增渠道专属价'}
                        </DialogTitle>
                        <DialogDescription>
                            为特定渠道设置商品的专属结算价格
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {!editingPrice && (
                            <>
                                <div className="space-y-2">
                                    <Label>渠道 <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={formData.channelId}
                                        onValueChange={(value: string) => setFormData({ ...formData, channelId: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="选择渠道" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {channels.length === 0 ? (
                                                <SelectItem value="empty" disabled>
                                                    暂无渠道，请先在渠道管理中添加
                                                </SelectItem>
                                            ) : (
                                                channels.map((channel) => (
                                                    <SelectItem key={channel.id} value={channel.id}>
                                                        {channel.name}
                                                        {channel.code && <span className="text-muted-foreground ml-2">({channel.code})</span>}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>商品 <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={formData.productId}
                                        onValueChange={(value: string) => setFormData({ ...formData, productId: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="选择商品" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.length === 0 ? (
                                                <SelectItem value="empty" disabled>
                                                    暂无商品，请先在商品管理中添加
                                                </SelectItem>
                                            ) : (
                                                products.map((product) => (
                                                    <SelectItem key={product.id} value={product.id}>
                                                        {product.name}
                                                        <span className="text-muted-foreground ml-2">
                                                            ({product.sku})
                                                            {product.retailPrice && ` ¥${product.retailPrice}`}
                                                        </span>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}
                        <div className="space-y-2">
                            <Label>专属价格 <span className="text-red-500">*</span></Label>
                            <Input
                                type="number"
                                placeholder="输入专属价格"
                                value={formData.specialPrice}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, specialPrice: e.target.value })}
                            />
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
