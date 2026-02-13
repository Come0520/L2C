'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Badge } from '@/shared/ui/badge';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Card } from '@/shared/ui/card';
import { Search, Grid, List, Check, Package, Loader2 } from 'lucide-react';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { cn } from '@/shared/lib/utils';
import {
  searchProducts,
  type ProductSearchResult,
} from '@/features/quotes/actions/product-actions';

import { CATEGORY_GROUPS, CATEGORY_LABELS } from '@/features/quotes/constants';

// Add 'ALL' option
const GROUP_OPTIONS = [{ label: '全部', value: 'ALL', categories: [] }, ...CATEGORY_GROUPS];

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
  const [selectedGroup, setSelectedGroup] = React.useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  // Initial sync
  React.useEffect(() => {
    if (defaultCategory) {
      // Find group for default category
      const group = CATEGORY_GROUPS.find((g) => g.categories.includes(defaultCategory));
      if (group) {
        setSelectedGroup(group.value);
        setSelectedCategory(defaultCategory);
      }
    }
  }, [defaultCategory]);

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
        // Logic:
        // 1. If specific category selected, use it.
        // 2. If group selected (and not ALL), use allowedCategories = group.categories.
        // 3. If ALL group, no filter.

        let categoryFilter: string | undefined;
        let allowedCategoriesFilter: string[] | undefined;

        if (selectedCategory && selectedCategory !== 'ALL') {
          categoryFilter = selectedCategory;
        } else if (selectedGroup !== 'ALL') {
          const group = CATEGORY_GROUPS.find((g) => g.value === selectedGroup);
          if (group) {
            allowedCategoriesFilter = group.categories;
          }
        }

        const results = await searchProducts(
          debouncedQuery,
          categoryFilter,
          undefined,
          allowedCategoriesFilter
        );
        setProducts(results);
      } catch (error) {
        console.error('搜索商品失败:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [open, debouncedQuery, selectedGroup, selectedCategory]);

  // 重置状态
  React.useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedProduct(null);
      setSelectedGroup('ALL');
      setSelectedCategory(null);
    }
  }, [open]);

  // 确认选择
  const handleConfirm = () => {
    if (selectedProduct) {
      onSelect(selectedProduct);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-4xl flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>选择商品</DialogTitle>
        </DialogHeader>

        {/* 筛选区域 */}
        <div className="shrink-0 space-y-3 border-b px-6 py-3">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="输入商品名称、SKU 或拼音首字母搜索..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* 品类筛选 (两级) */}
          <div className="flex w-full flex-col gap-2">
            {/* Level 1: Groups */}
            <div className="flex items-center justify-between gap-4">
              <Tabs
                value={selectedGroup}
                onValueChange={(val) => {
                  setSelectedGroup(val);
                  setSelectedCategory(null); // Reset sub-category when switching group
                }}
                className="min-w-0 flex-1"
              >
                <TabsList className="bg-muted/50 flex h-auto flex-wrap justify-start gap-1 p-1">
                  {GROUP_OPTIONS.map((group) => (
                    <TabsTrigger
                      key={group.value}
                      value={group.value}
                      className="h-auto px-3 py-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      {group.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* 视图切换 */}
              <div className="flex shrink-0 items-center gap-1">
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

            {/* Level 2: Categories (Chips) - Only show if specific group selected */}
            {selectedGroup !== 'ALL' && (
              <div className="animate-in fade-in slide-in-from-top-1 flex flex-wrap gap-2 px-1 duration-200">
                <Badge
                  variant={selectedCategory === null ? 'default' : 'outline'}
                  className="hover:bg-primary/90 cursor-pointer"
                  onClick={() => setSelectedCategory(null)}
                >
                  全部
                </Badge>
                {CATEGORY_GROUPS.find((g) => g.value === selectedGroup)?.categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    className="hover:bg-primary/90 cursor-pointer"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {CATEGORY_LABELS[cat] || cat}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex min-h-0 flex-1">
          {/* 商品列表 */}
          <ScrollArea className="h-[400px] flex-1">
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
                  <Package className="mb-2 h-12 w-12 opacity-50" />
                  <p>未找到相关商品</p>
                  <p className="mt-1 text-xs">尝试换个关键词或品类</p>
                </div>
              ) : viewMode === 'list' ? (
                /* 列表视图 */
                <div className="space-y-2">
                  {products.map((product) => (
                    <Card
                      key={product.id}
                      className={cn(
                        'cursor-pointer p-3 transition-all hover:shadow-md',
                        selectedProduct?.id === product.id
                          ? 'ring-primary bg-primary/5 ring-2'
                          : 'hover:bg-accent/50'
                      )}
                      onClick={() => setSelectedProduct(product)}
                      onDoubleClick={() => {
                        onSelect(product);
                        onOpenChange(false);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {/* 商品图片 */}
                        <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md">
                          {product.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="text-muted-foreground h-5 w-5" />
                          )}
                        </div>

                        {/* 商品信息 */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">{product.name}</span>
                            <Badge variant="secondary" className="shrink-0 px-1 text-[10px]">
                              {CATEGORY_LABELS[product.category] || product.category}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground mt-0.5 flex items-center gap-3 text-xs">
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
                          <Check className="text-primary h-5 w-5 shrink-0" />
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
                        'cursor-pointer p-3 transition-all hover:shadow-md',
                        selectedProduct?.id === product.id
                          ? 'ring-primary bg-primary/5 ring-2'
                          : 'hover:bg-accent/50'
                      )}
                      onClick={() => setSelectedProduct(product)}
                      onDoubleClick={() => {
                        onSelect(product);
                        onOpenChange(false);
                      }}
                    >
                      {/* 商品图片 */}
                      <div className="bg-muted relative mb-2 flex aspect-square items-center justify-center overflow-hidden rounded-md">
                        {product.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="text-muted-foreground h-8 w-8" />
                        )}
                        {selectedProduct?.id === product.id && (
                          <div className="bg-primary absolute top-1 right-1 rounded-full p-0.5">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>

                      {/* 商品信息 */}
                      <div className="space-y-1">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        <p className="text-muted-foreground text-xs">{product.sku}</p>
                        {product.unitPrice && (
                          <p className="text-primary text-sm font-medium">¥{product.unitPrice}</p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* 详情预览面板 */}
          <div className="hidden w-72 shrink-0 border-l p-4 md:block">
            {selectedProduct ? (
              <div className="space-y-4">
                {/* 大图 */}
                <div className="bg-muted flex aspect-square items-center justify-center overflow-hidden rounded-lg">
                  {selectedProduct.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedProduct.images[0]}
                      alt={selectedProduct.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="text-muted-foreground h-16 w-16" />
                  )}
                </div>

                {/* 详细信息 */}
                <div className="space-y-2">
                  <h3 className="font-semibold">{selectedProduct.name}</h3>
                  <div className="text-muted-foreground space-y-1 text-sm">
                    <p>SKU: {selectedProduct.sku}</p>
                    <p>品类: {CATEGORY_LABELS[selectedProduct.category]}</p>
                    {selectedProduct.unitPrice && (
                      <p className="text-primary text-base font-medium">
                        ¥{selectedProduct.unitPrice}/{selectedProduct.unit || '件'}
                      </p>
                    )}
                  </div>

                  {/* 规格参数 */}
                  {selectedProduct.specs && Object.keys(selectedProduct.specs).length > 0 && (
                    <div className="border-t pt-2">
                      <p className="mb-1 text-xs font-medium">规格参数</p>
                      <div className="text-muted-foreground space-y-0.5 text-xs">
                        {Object.entries(selectedProduct.specs)
                          .slice(0, 5)
                          .map(([key, value]) => (
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
              <div className="text-muted-foreground flex h-full flex-col items-center justify-center">
                <Package className="mb-2 h-12 w-12 opacity-30" />
                <p className="text-sm">选择商品查看详情</p>
              </div>
            )}
          </div>
        </div>

        {/* 底部操作 */}
        <DialogFooter className="shrink-0 border-t px-6 py-3">
          <div className="flex w-full items-center justify-between">
            <p className="text-muted-foreground text-sm">
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
