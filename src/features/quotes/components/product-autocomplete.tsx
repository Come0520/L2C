'use client';

import { CATEGORY_LABELS, type ProductCategory } from '@/features/quotes/constants';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2, Clock } from 'lucide-react';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import {
  searchProducts,
  type ProductSearchResult,
} from '@/features/quotes/actions/product-actions';
import { useRecentProducts } from '@/features/quotes/hooks/use-recent-products';

interface ProductAutocompleteProps {
  value?: string;
  onSelect: (product: ProductSearchResult) => void;
  /** 单一品类过滤 */
  category?: string;
  /** 允许的品类列表（用于限制可选商品范围，优先于 category） */
  allowedCategories?: string[];
  placeholder?: string;
  disabled?: boolean;
  /** 双击时的回调，用于打开增强搜索对话框 */
  onDoubleClick?: () => void;
}

export function ProductAutocomplete({
  value,
  onSelect,
  category,
  allowedCategories,
  placeholder = '选择商品...',
  disabled,
  onDoubleClick,
}: ProductAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  // 减少防抖延迟：从 300ms 降至 150ms，提升响应速度
  const debouncedQuery = useDebounce(query, 150);
  const [data, setData] = React.useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const cacheRef = React.useRef<Record<string, ProductSearchResult[]>>({});

  // 双击检测
  const lastClickTimeRef = React.useRef<number>(0);
  const DOUBLE_CLICK_DELAY = 300; // 毫秒

  // 最近使用商品
  const { recentProducts, addRecentProduct, getRecentProductIds } = useRecentProducts();

  // 处理点击事件（检测单击/双击）
  const handleTriggerClick = React.useCallback(
    (e: React.MouseEvent) => {
      const now = Date.now();
      const timeDiff = now - lastClickTimeRef.current;

      if (timeDiff < DOUBLE_CLICK_DELAY && onDoubleClick) {
        // 双击：阻止默认行为，关闭下拉，调用双击回调
        e.preventDefault();
        e.stopPropagation();
        setOpen(false); // 确保关闭下拉列表
        onDoubleClick();
        lastClickTimeRef.current = 0; // 重置
      } else {
        // 单击：记录时间，正常打开下拉
        lastClickTimeRef.current = now;
      }
    },
    [onDoubleClick]
  );

  React.useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }

    // 优先使用 allowedCategories，否则回退到 category
    const effectiveCategory =
      allowedCategories && allowedCategories.length > 0
        ? allowedCategories.join(',')
        : category || 'all';
    const cacheKey = `${effectiveCategory}:${debouncedQuery}`;
    if (cacheRef.current[cacheKey]) {
      setData(cacheRef.current[cacheKey]);
      return;
    }

    // 获取商品列表
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // 传入最近使用商品ID，用于优先排序
        const recentIds = getRecentProductIds();
        // 使用 allowedCategories 进行过滤
        const results = await searchProducts(
          debouncedQuery,
          category,
          recentIds,
          allowedCategories
        );
        setData(results);
        cacheRef.current[cacheKey] = results;
      } catch (error) {
        console.error('搜索商品失败:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [debouncedQuery, category, allowedCategories, open, getRecentProductIds]);

  // 处理商品选择，同时记录到最近使用
  const handleSelect = React.useCallback(
    (product: ProductSearchResult) => {
      // 记录到最近使用
      addRecentProduct({
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        unitPrice: product.unitPrice,
      });

      // 调用原始回调
      onSelect(product);
      setOpen(false);

      // 清除缓存，下次打开时刷新数据
      cacheRef.current = {};
    },
    [onSelect, addRecentProduct]
  );

  // 检查商品是否为最近使用
  const isRecentProduct = React.useCallback(
    (productId: string) => {
      return recentProducts.some((p) => p.id === productId);
    },
    [recentProducts]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-8 w-full justify-between px-2 font-normal"
          onClick={handleTriggerClick}
        >
          {value || <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="输入名称、编码或拼音首字母..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
              </div>
            )}
            {!loading && data.length === 0 && (
              <CommandEmpty>
                <div className="py-2 text-center">
                  <p>未找到相关商品</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    支持拼音首字母搜索，如 "mmq" 匹配 "棉麻浅灰"
                  </p>
                </div>
              </CommandEmpty>
            )}
            <CommandGroup>
              {data.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.id}
                  onSelect={() => {
                    handleSelect(product);
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{product.name}</span>
                      {isRecentProduct(product.id) && (
                        <span title="最近使用">
                          <Clock className="text-muted-foreground h-3 w-3 shrink-0" />
                        </span>
                      )}
                      <span className="text-muted-foreground bg-muted shrink-0 rounded px-1 text-xs">
                        {CATEGORY_LABELS[product.category as ProductCategory] || product.category}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {product.sku} {product.unitPrice ? `¥${product.unitPrice}` : ''}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4 shrink-0',
                      value === product.name ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
