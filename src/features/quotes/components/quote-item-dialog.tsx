'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
// Tabs 组件导入已移除（未使用）
import { getProducts } from '@/features/products/actions/queries';
import { createQuoteItem } from '@/features/quotes/actions/mutations';
import { toast } from 'sonner';
import { Check, ChevronsUpDown, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/shared/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { DimensionLimits } from '@/services/quote-config.service';
import { getHeightStatus, getWidthStatus, validateDimensions } from '@/features/quotes/utils/dimension-validation';

interface QuoteItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quoteId: string;
    roomId?: string | null;
    onSuccess?: () => void;
    /** 尺寸限制配置 (从父组件传入，默认使用系统配置) */
    dimensionLimits?: DimensionLimits;
    /** 可见字段列表 (如果不传，默认全部显示或根据简单逻辑显示) */
    visibleFields?: string[];
}

/** 默认尺寸限制配置 (系统级默认值) */
const DEFAULT_DIMENSION_LIMITS: DimensionLimits = {
    heightWarning: 400,
    heightMax: 1000,
    widthWarning: 1000,
    widthMax: 2000,
    enabled: true
};

export function QuoteItemDialog({ open, onOpenChange, quoteId, roomId, onSuccess, dimensionLimits, visibleFields }: QuoteItemDialogProps) {
    const limits = dimensionLimits ?? DEFAULT_DIMENSION_LIMITS;

    // Helper to check visibility
    const isVisible = (field: string) => !visibleFields || visibleFields.includes(field);

    const [category, setCategory] = useState<string>('CURTAIN');
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [productOpen, setProductOpen] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Form State
    const [quantity, setQuantity] = useState<number>(1);
    const [width, setWidth] = useState<number>(0);
    const [height, setHeight] = useState<number>(0);
    const [foldRatio, setFoldRatio] = useState<number>(2.0);
    const [remark, setRemark] = useState('');

    // 尺寸校验状态 (Dimension Validation States)
    const heightStatus = useMemo(() => getHeightStatus(height, limits), [height, limits]);
    const widthStatus = useMemo(() => getWidthStatus(width, limits), [width, limits]);

    // Load products on search or category change
    useEffect(() => {
        if (!open) return;
        const fetchProducts = async () => {
            setLoadingProducts(true);
            try {
                const res = await getProducts({
                    page: 1,
                    pageSize: 20,
                    category: category as any,
                    search: searchQuery,
                    isActive: true
                });
                // createSafeAction 返回 { data: { data: [], total, ... }, success }
                // 需要解构两层才能获取到产品数组
                const productList = res?.data?.data ?? [];
                setProducts(productList as any[]);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load products");
            } finally {
                setLoadingProducts(false);
            }
        };

        const timeout = setTimeout(fetchProducts, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery, category, open]);

    const handleSubmit = async () => {
        if (!selectedProduct) {
            toast.error("请选择商品");
            return;
        }

        // 尺寸校验 - 硬限制检查
        const dimensionCheck = validateDimensions(height, width, limits);
        if (!dimensionCheck.valid) {
            toast.error(dimensionCheck.message || "尺寸超出限制");
            return;
        }

        // 尺寸警告 - 提示但不阻止
        if (dimensionCheck.type === 'warning') {
            toast.warning(dimensionCheck.message);
        }

        try {
            await createQuoteItem({
                quoteId,
                roomId: roomId || undefined,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                category: category as any,
                productId: selectedProduct.id,
                productName: selectedProduct.name,
                unitPrice: Number(selectedProduct.retailPrice || selectedProduct.unitPrice || 0),
                quantity,
                width,
                height,
                foldRatio: category === 'CURTAIN' ? foldRatio : undefined,
                remark,
                attributes: {
                    ...selectedProduct.specs,
                    productImage: selectedProduct.images?.[0]
                }
            });
            toast.success("报价项添加成功");
            onOpenChange(false);
            if (onSuccess) onSuccess();

            // Reset form
            setSelectedProduct(null);
            setWidth(0);
            setHeight(0);
            setQuantity(1);
        } catch (error) {
            console.error(error);
            toast.error("添加失败");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>添加报价项 (Add Item)</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Category Selection */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">品类</Label>
                        <Select value={category} onValueChange={(val) => {
                            setCategory(val);
                            setSelectedProduct(null);
                        }}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CURTAIN">窗帘 (Curtain)</SelectItem>
                                <SelectItem value="WALLPAPER">墙纸 (Wallpaper)</SelectItem>
                                <SelectItem value="WALLCLOTH">墙布 (Wallcloth)</SelectItem>
                                <SelectItem value="ACCESSORY">附件 (Accessory)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Product Selection (Combobox) */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">产品</Label>
                        <div className="col-span-3">
                            <Popover open={productOpen} onOpenChange={setProductOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={productOpen}
                                        className="w-full justify-between"
                                    >
                                        {selectedProduct ? selectedProduct.name : "Select product..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Search product..."
                                            value={searchQuery}
                                            onValueChange={setSearchQuery}
                                        />
                                        <CommandList>
                                            {loadingProducts && <CommandItem>Loading...</CommandItem>}
                                            {!loadingProducts && products.length === 0 && <CommandEmpty>No products found.</CommandEmpty>}
                                            {products.map((product) => (
                                                <CommandItem
                                                    key={product.id}
                                                    value={product.id}
                                                    onSelect={() => {
                                                        setSelectedProduct(product);
                                                        setProductOpen(false);
                                                        // Auto-fill defaults if any
                                                        if (product.defaultFoldRatio) setFoldRatio(Number(product.defaultFoldRatio));
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedProduct?.id === product.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span>{product.name}</span>
                                                        <span className="text-xs text-muted-foreground">{product.sku}</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Dynamic Fields based on Category */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">宽度 (cm)</Label>
                        <div className="col-span-3 space-y-1">
                            <Input
                                type="number"
                                className={cn(
                                    widthStatus.status === 'error' && 'border-red-500 focus-visible:ring-red-500',
                                    widthStatus.status === 'warning' && 'border-yellow-500 focus-visible:ring-yellow-500'
                                )}
                                value={width}
                                onChange={(e) => setWidth(Number(e.target.value))}
                                max={limits.widthMax}
                            />
                            {widthStatus.message && (
                                <div className={cn(
                                    'flex items-center gap-1 text-xs',
                                    widthStatus.status === 'error' ? 'text-red-500' : 'text-yellow-600'
                                )}>
                                    {widthStatus.status === 'error'
                                        ? <XCircle className="h-3 w-3" />
                                        : <AlertTriangle className="h-3 w-3" />
                                    }
                                    {widthStatus.message}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">高度 (cm)</Label>
                        <div className="col-span-3 space-y-1">
                            <Input
                                type="number"
                                className={cn(
                                    heightStatus.status === 'error' && 'border-red-500 focus-visible:ring-red-500',
                                    heightStatus.status === 'warning' && 'border-yellow-500 focus-visible:ring-yellow-500'
                                )}
                                value={height}
                                onChange={(e) => setHeight(Number(e.target.value))}
                                max={limits.heightMax}
                            />
                            {heightStatus.message && (
                                <div className={cn(
                                    'flex items-center gap-1 text-xs',
                                    heightStatus.status === 'error' ? 'text-red-500' : 'text-yellow-600'
                                )}>
                                    {heightStatus.status === 'error'
                                        ? <XCircle className="h-3 w-3" />
                                        : <AlertTriangle className="h-3 w-3" />
                                    }
                                    {heightStatus.message}
                                </div>
                            )}
                        </div>
                    </div>

                    {category === 'CURTAIN' && isVisible('foldRatio') && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">褶皱倍数</Label>
                            <Input
                                type="number"
                                className="col-span-3"
                                value={foldRatio}
                                step="0.1"
                                onChange={(e) => setFoldRatio(Number(e.target.value))}
                            />
                        </div>
                    )}

                    {category === 'CURTAIN' && isVisible('installType') && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">安装方式</Label>
                            <Select onValueChange={(val) => { /* Update State (missing state) */ }}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="顶装/侧装" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="top">顶装</SelectItem>
                                    <SelectItem value="side">侧装</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">数量</Label>
                        <Input
                            type="number"
                            className="col-span-3"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                        />
                    </div>

                    {isVisible('remark') && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">备注</Label>
                            <Input
                                className="col-span-3"
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>Add Item</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
