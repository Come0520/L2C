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
import { HeightOverflowDialog } from './height-overflow-dialog';
import type { AlternativeSolution } from '../logic/calculator';

/**
 * 产品接口类型 (Product Interface)
 * 用于类型安全的产品选择
 */
interface ProductItem {
    id: string;
    name: string;
    sku: string;
    retailPrice?: string | number;
    unitPrice?: string | number;
    specs?: Record<string, unknown>;
    images?: string[];
    defaultFoldRatio?: number;
}

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

    const [category, setCategory] = useState<string>('CURTAIN_FABRIC');
    const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
    const [productOpen, setProductOpen] = useState(false);
    const [products, setProducts] = useState<ProductItem[]>([]);;
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Form State
    const [quantity, setQuantity] = useState<number>(1);
    const [width, setWidth] = useState<number>(0);
    const [height, setHeight] = useState<number>(0);
    const [foldRatio, setFoldRatio] = useState<number>(2.0);
    const [remark, setRemark] = useState('');

    // 超高弹窗状态 (Height Overflow Dialog State)
    const [heightOverflowOpen, setHeightOverflowOpen] = useState(false);
    const [alternatives, setAlternatives] = useState<AlternativeSolution[]>([]);
    const [selectedHeaderType, setSelectedHeaderType] = useState<'WRAPPED' | 'ATTACHED'>('WRAPPED');
    const [selectedBottomLoss, setSelectedBottomLoss] = useState<number>(10);
    const [heightOverflowConfirmed, setHeightOverflowConfirmed] = useState(false);

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
                    category: category,
                    search: searchQuery,
                    isActive: true
                });
                // createSafeAction 返回 { data: { data: [], total, ... }, success }
                // 需要解构两层才能获取到产品数组
                const productList = res?.data?.data ?? [];
                setProducts(productList as ProductItem[]);
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

        // 超高预检测 - 窗帘品类时动态计算是否需要弹窗
        if (['CURTAIN_FABRIC', 'CURTAIN_SHEER'].includes(category) && !heightOverflowConfirmed) {
            const fabricWidth = (selectedProduct?.specs?.fabricWidth as number) || 280;
            const headerLoss = selectedHeaderType === 'WRAPPED' ? 20 : 7;
            const bottomLoss = selectedBottomLoss;
            const maxEffectiveHeight = fabricWidth - headerLoss - bottomLoss;

            if (height > maxEffectiveHeight) {
                // 生成替代方案并打开弹窗
                const altSolutions: AlternativeSolution[] = [];
                const wFinished = width * foldRatio;
                const baseQty = (wFinished + 10) / 100; // 基础用料
                const unitPrice = Number(selectedProduct?.retailPrice || selectedProduct?.unitPrice || 0);

                // 方案1：贴布带
                const maxH1 = fabricWidth - 7 - bottomLoss;
                if (height <= maxH1) {
                    altSolutions.push({
                        name: '改用贴布带',
                        description: '帘头改为贴布带 (7cm)，保留标准底边',
                        headerType: 'ATTACHED',
                        headerLoss: 7,
                        bottomLoss: bottomLoss,
                        quantity: Number(baseQty.toFixed(2)),
                        priceDiff: 0,
                        recommended: true,
                    });
                }

                // 方案2：小底边
                const smallBottom = 5;
                const maxH2 = fabricWidth - headerLoss - smallBottom;
                if (height <= maxH2) {
                    altSolutions.push({
                        name: '减小底边',
                        description: `保留包布带，底边减至 ${smallBottom}cm`,
                        headerType: 'WRAPPED',
                        headerLoss: 20,
                        bottomLoss: smallBottom,
                        quantity: Number(baseQty.toFixed(2)),
                        priceDiff: 0,
                    });
                }

                // 方案3：拼接
                const splicedQty = baseQty * 2;
                altSolutions.push({
                    name: '接布拼接',
                    description: '需要拼接工艺，用料翻倍',
                    headerType: 'WRAPPED',
                    headerLoss: 20,
                    bottomLoss: bottomLoss,
                    quantity: Number(splicedQty.toFixed(2)),
                    priceDiff: Number(((splicedQty - baseQty) * unitPrice).toFixed(0)),
                });

                setAlternatives(altSolutions);
                setHeightOverflowOpen(true);
                return; // 等待用户选择
            }
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
                foldRatio: ['CURTAIN_FABRIC', 'CURTAIN_SHEER'].includes(category) ? foldRatio : undefined,
                remark,
                attributes: {
                    ...selectedProduct.specs,
                    productImage: selectedProduct.images?.[0],
                    // 传递帘头工艺和底边配置
                    headerType: selectedHeaderType,
                    bottomLoss: selectedBottomLoss,
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
            setHeightOverflowConfirmed(false);
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
                                <SelectItem value="CURTAIN_FABRIC">窗帘面料</SelectItem>
                                <SelectItem value="CURTAIN_SHEER">纱帘</SelectItem>
                                <SelectItem value="CURTAIN_TRACK">窗帘轨道</SelectItem>
                                <SelectItem value="CURTAIN_ACCESSORY">窗帘配件</SelectItem>
                                <SelectItem value="MOTOR">电机</SelectItem>
                                <SelectItem value="WALLCLOTH">墙布</SelectItem>
                                <SelectItem value="WALLPANEL">墙板</SelectItem>
                                <SelectItem value="WINDOWPAD">飘窗垫</SelectItem>
                                <SelectItem value="STANDARD">标品</SelectItem>
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

                    {['CURTAIN_FABRIC', 'CURTAIN_SHEER'].includes(category) && isVisible('foldRatio') && (
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

                    {['CURTAIN_FABRIC', 'CURTAIN_SHEER'].includes(category) && isVisible('installType') && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">安装方式</Label>
                            <Select onValueChange={(_val) => { /* Update State (missing state) */ }}>
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

            {/* 超高方案对比弹窗 */}
            <HeightOverflowDialog
                open={heightOverflowOpen}
                onOpenChange={setHeightOverflowOpen}
                alternatives={alternatives}
                baseQuantity={quantity}
                unitPrice={Number(selectedProduct?.retailPrice || selectedProduct?.unitPrice || 0)}
                onSelectSolution={(solution) => {
                    setSelectedHeaderType(solution.headerType);
                    setSelectedBottomLoss(solution.bottomLoss);
                    setHeightOverflowConfirmed(true);
                    toast.success(`已应用方案: ${solution.name}`);
                    // 延迟触发提交，让状态更新完成
                    setTimeout(() => handleSubmit(), 100);
                }}
                onIgnore={() => {
                    setHeightOverflowConfirmed(true);
                    toast.info('已继续使用当前设置');
                    setTimeout(() => handleSubmit(), 100);
                }}
            />
        </Dialog>
    );
}
