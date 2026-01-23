'use client';

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Badge } from '@/shared/ui/badge';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Card } from '@/shared/ui/card';
import { Search, Grid, List, Check, Package, Loader2 } from 'lucide-react';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { cn } from '@/shared/lib/utils';
import { searchProducts, type ProductSearchResult } from '@/features/quotes/actions/product-actions';

/** 品类选项配置 */
const CATEGORY_OPTIONS = [
    { value: 'ALL', label: '全部' },
    { value: 'CURTAIN_FABRIC', label: '窗帘面料' },
    { value: 'CURTAIN_SHEER', label: '纱帘' },
    { value: 'WALLCLOTH', label: '墙布' },
    { value: 'WALLPANEL', label: '墙板' },
    { value: 'WINDOWPAD', label: '飘窗垫' },
    { value: 'CURTAIN_TRACK', label: '轨道' },
    { value: 'CURTAIN_ACCESSORY', label: '配件' },
    { value: 'MOTOR', label: '电机' },
    { value: 'STANDARD', label: '标品' },
] as const;

interface ProductPickerDialogProps {
    /** 对话框是否打开 */
    open: boolean;
    /** 对话框状态变更回调 */
    onOpenChange: (open: boolean) => void;
    /** 选择商品后的回调 */
    onSelect: (product: ProductSearchResult) => void;
    /** 默认品类筛选 */
    defaultCategory?: string;
}

/**
 * 增强版商品选择对话框
 * 
 * 功能：
 * 1. 品类 Tab 筛选
 * 2. 搜索框（支持中文、拼音首字母）
 * 3. 列表/网格视图切换
 * 4. 商品详情预览
 */
export function ProductPickerDialog({
    open,
    onOpenChange,
    onSelect,
    defaultCategory,
}: ProductPickerDialogProps) {
    // 搜索状态
    const [query, setQuery] = React.useState('');
    const debouncedQuery = useDebounce(query, 200);

    // 筛选状态
    const [category, setCategory] = React.useState(defaultCategory || 'ALL');

    // 视图状态
    const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list');

    // 选中状态
    const [selectedProduct, setSelectedProduct] = React.useState<ProductSearchResult | null>(null);

    // 数据状态
    const [products, setProducts] = React.useState<ProductSearchResult[]>([]);
    const [loading, setLoading] = React.useState(false);

    // 搜索商品
    React.useEffect(() => {
        if (!open) return;

        const fetchProducts = async () => {
            setLoading(true);
            try {
                const categoryFilter = category === 'ALL' ? undefined : category;
                const results = await searchProducts(debouncedQuery, categoryFilter);
                setProducts(results);
            } catch (error) {
                console.error('搜索商品失败:', error);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [open, debouncedQuery, category]);

    // 重置状态
    React.useEffect(() => {
        if (!open) {
            setQuery('');
            setSelectedProduct(null);
            setCategory(defaultCategory || 'ALL');
        }
    }, [open, defaultCategory]);

    // 确认选择
    const handleConfirm = () => {
        if (selectedProduct) {
            onSelect(selectedProduct);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <DialogTitle>选择商品</DialogTitle>
                </DialogHeader>

                {/* 筛选区域 */}
                <div className="px-6 py-3 border-b space-y-3 shrink-0">
                    {/* 搜索框 */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="输入商品名称、SKU 或拼音首字母搜索..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-9"
                            autoFocus
                        />
                    </div>

                    {/* 品类筛选 + 视图切换 */}
                    <div className="flex items-center justify-between gap-4">
                        <Tabs value={category} onValueChange={setCategory} className="flex-1 min-w-0">
                            <TabsList className="h-auto p-1 flex flex-wrap gap-1 bg-muted/50">
                                {CATEGORY_OPTIONS.map((opt) => (
                                    <TabsTrigger
                                        key={opt.value}
                                        value={opt.value}
                                        className="text-xs px-2 py-1 h-auto"
                                    >
                                        {opt.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>

                        {/* 视图切换 */}
                        <div className="flex items-center gap-1 shrink-0">
                            <Button
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setViewMode('list')}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setViewMode('grid')}
                            >
                                <Grid className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 内容区域 */}
                <div className="flex flex-1 min-h-0">
                    {/* 商品列表 */}
                    <ScrollArea className="flex-1 h-[400px]">
                        <div className="p-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : products.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Package className="h-12 w-12 mb-2 opacity-50" />
                                    <p>未找到相关商品</p>
                                    <p className="text-xs mt-1">尝试换个关键词或品类</p>
                                </div>
                            ) : viewMode === 'list' ? (
                                /* 列表视图 */
                                <div className="space-y-2">
                                    {products.map((product) => (
                                        <Card
                                            key={product.id}
                                            className={cn(
                                                'p-3 cursor-pointer transition-all hover:shadow-md',
                                                selectedProduct?.id === product.id
                                                    ? 'ring-2 ring-primary bg-primary/5'
                                                    : 'hover:bg-accent/50'
                                            )}
                                            onClick={() => setSelectedProduct(product)}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* 商品图片 */}
                                                <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                                                    {product.images?.[0] ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={product.images[0]}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Package className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>

                                                {/* 商品信息 */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium truncate">{product.name}</span>
                                                        <Badge variant="secondary" className="text-[10px] px-1 shrink-0">
                                                            {CATEGORY_OPTIONS.find(c => c.value === product.category)?.label || product.category}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                        <span>{product.sku}</span>
                                                        {product.unitPrice && (
                                                            <span className="text-primary font-medium">
                                                                ¥{product.unitPrice}/{product.unit || '件'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* 选中标记 */}
                                                {selectedProduct?.id === product.id && (
                                                    <Check className="h-5 w-5 text-primary shrink-0" />
                                                )}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                /* 网格视图 */
                                <div className="grid grid-cols-3 gap-3">
                                    {products.map((product) => (
                                        <Card
                                            key={product.id}
                                            className={cn(
                                                'p-3 cursor-pointer transition-all hover:shadow-md',
                                                selectedProduct?.id === product.id
                                                    ? 'ring-2 ring-primary bg-primary/5'
                                                    : 'hover:bg-accent/50'
                                            )}
                                            onClick={() => setSelectedProduct(product)}
                                        >
                                            {/* 商品图片 */}
                                            <div className="aspect-square rounded-md bg-muted flex items-center justify-center mb-2 overflow-hidden relative">
                                                {product.images?.[0] ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={product.images[0]}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Package className="h-8 w-8 text-muted-foreground" />
                                                )}
                                                {selectedProduct?.id === product.id && (
                                                    <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
                                                        <Check className="h-3 w-3 text-white" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* 商品信息 */}
                                            <div className="space-y-1">
                                                <p className="font-medium text-sm truncate">{product.name}</p>
                                                <p className="text-xs text-muted-foreground">{product.sku}</p>
                                                {product.unitPrice && (
                                                    <p className="text-sm text-primary font-medium">
                                                        ¥{product.unitPrice}
                                                    </p>
                                                )}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* 详情预览面板 */}
                    <div className="w-72 border-l p-4 shrink-0 hidden md:block">
                        {selectedProduct ? (
                            <div className="space-y-4">
                                {/* 大图 */}
                                <div className="aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                                    {selectedProduct.images?.[0] ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={selectedProduct.images[0]}
                                            alt={selectedProduct.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Package className="h-16 w-16 text-muted-foreground" />
                                    )}
                                </div>

                                {/* 详细信息 */}
                                <div className="space-y-2">
                                    <h3 className="font-semibold">{selectedProduct.name}</h3>
                                    <div className="text-sm space-y-1 text-muted-foreground">
                                        <p>SKU: {selectedProduct.sku}</p>
                                        <p>品类: {CATEGORY_OPTIONS.find(c => c.value === selectedProduct.category)?.label}</p>
                                        {selectedProduct.unitPrice && (
                                            <p className="text-primary font-medium text-base">
                                                ¥{selectedProduct.unitPrice}/{selectedProduct.unit || '件'}
                                            </p>
                                        )}
                                    </div>

                                    {/* 规格参数 */}
                                    {selectedProduct.specs && Object.keys(selectedProduct.specs).length > 0 && (
                                        <div className="pt-2 border-t">
                                            <p className="text-xs font-medium mb-1">规格参数</p>
                                            <div className="text-xs text-muted-foreground space-y-0.5">
                                                {Object.entries(selectedProduct.specs).slice(0, 5).map(([key, value]) => (
                                                    <p key={key}>
                                                        {key}: {String(value)}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                <Package className="h-12 w-12 mb-2 opacity-30" />
                                <p className="text-sm">选择商品查看详情</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 底部操作 */}
                <DialogFooter className="px-6 py-3 border-t shrink-0">
                    <div className="flex items-center justify-between w-full">
                        <p className="text-sm text-muted-foreground">
                            {products.length} 件商品
                            {selectedProduct && ` · 已选: ${selectedProduct.name}`}
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                取消
                            </Button>
                            <Button onClick={handleConfirm} disabled={!selectedProduct}>
                                确认选择
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
