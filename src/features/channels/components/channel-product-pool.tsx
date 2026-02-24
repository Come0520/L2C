'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog';
import { Badge } from '@/shared/ui/badge';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash';
import Save from 'lucide-react/dist/esm/icons/save';
import Search from 'lucide-react/dist/esm/icons/search';
import {
    updateProductChannelPrice,
    removeFromChannelPool,
} from '../actions/channel-products';

interface Product {
    id: string;
    sku: string;
    name: string;
    category: string;
    retailPrice: string | null;
    channelPrice: string | null;
}

interface ChannelProductPoolProps {
    channelProducts: Product[];
    availableProducts: Product[];
}

export function ChannelProductPool({
    channelProducts,
    availableProducts,
}: ChannelProductPoolProps) {
    const [isPending, startTransition] = useTransition();
    const [editingPrices, setEditingPrices] = useState<Record<string, string>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    // 过滤已在选品池中的商品
    const productsNotInPool = availableProducts.filter(
        (p) => !channelProducts.some((cp) => cp.id === p.id)
    );

    // 搜索过滤
    const filteredAvailable = productsNotInPool.filter(
        (p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handlePriceChange = (productId: string, value: string) => {
        setEditingPrices((prev) => ({ ...prev, [productId]: value }));
    };

    const handleSavePrice = (productId: string) => {
        const price = parseFloat(editingPrices[productId] || '0');
        if (isNaN(price) || price < 0) {
            toast.error('请输入有效的价格');
            return;
        }

        startTransition(async () => {
            const res = await updateProductChannelPrice({ productId, channelPrice: price });
            if (res.success) {
                toast.success('底价已更新');
                // 清除编辑状态
                setEditingPrices((prev) => {
                    const next = { ...prev };
                    delete next[productId];
                    return next;
                });
            } else {
                toast.error(res.error || '更新失败');
            }
        });
    };

    const handleAddToPool = (productId: string, basePrice: number) => {
        startTransition(async () => {
            const res = await updateProductChannelPrice({ productId, channelPrice: basePrice });
            if (res.success) {
                toast.success('已添加到选品池');
                setIsAddDialogOpen(false);
            } else {
                toast.error(res.error || '添加失败');
            }
        });
    };

    const handleRemove = (productId: string) => {
        startTransition(async () => {
            const res = await removeFromChannelPool(productId);
            if (res.success) {
                toast.success('已从选品池移除');
            } else {
                toast.error(res.error || '移除失败');
            }
        });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>渠道选品池</CardTitle>
                    <CardDescription>
                        管理可供渠道分销的商品及其底价
                    </CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            添加商品
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>添加商品到选品池</DialogTitle>
                            <DialogDescription>
                                选择商品并设置渠道底价
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="搜索商品名称或SKU..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="border rounded-md max-h-96 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>商品</TableHead>
                                            <TableHead>零售价</TableHead>
                                            <TableHead>底价</TableHead>
                                            <TableHead className="w-24">操作</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAvailable.map((product) => (
                                            <AddProductRow
                                                key={product.id}
                                                product={product}
                                                onAdd={handleAddToPool}
                                                isPending={isPending}
                                            />
                                        ))}
                                        {filteredAvailable.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                    {searchTerm ? '无匹配商品' : '所有商品已添加'}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {channelProducts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        尚未添加任何渠道商品
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>SKU</TableHead>
                                <TableHead>商品名称</TableHead>
                                <TableHead>分类</TableHead>
                                <TableHead>零售价</TableHead>
                                <TableHead>渠道底价</TableHead>
                                <TableHead className="w-32">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {channelProducts.map((product) => {
                                const isEditing = editingPrices[product.id] !== undefined;
                                const currentValue = isEditing
                                    ? editingPrices[product.id]
                                    : product.channelPrice || '0';

                                return (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                                        <TableCell>{product.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{product.category}</Badge>
                                        </TableCell>
                                        <TableCell>¥{product.retailPrice}</TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={currentValue}
                                                onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                                className="w-28"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {isEditing && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleSavePrice(product.id)}
                                                        disabled={isPending}
                                                    >
                                                        {isPending ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Save className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                )}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleRemove(product.id)}
                                                    disabled={isPending}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

// 添加商品行组件
function AddProductRow({
    product,
    onAdd,
    isPending,
}: {
    product: Product;
    onAdd: (id: string, price: number) => void;
    isPending: boolean;
}) {
    const [price, setPrice] = useState(product.retailPrice || '0');

    return (
        <TableRow>
            <TableCell>
                <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">{product.sku}</div>
                </div>
            </TableCell>
            <TableCell>¥{product.retailPrice}</TableCell>
            <TableCell>
                <Input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-28"
                />
            </TableCell>
            <TableCell>
                <Button
                    size="sm"
                    onClick={() => onAdd(product.id, parseFloat(price) || 0)}
                    disabled={isPending}
                >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '添加'}
                </Button>
            </TableCell>
        </TableRow>
    );
}
