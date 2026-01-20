'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/shared/ui/popover';
import { searchProducts, type ProductSearchResult } from '@/features/quotes/actions/product-actions';

interface ProductAutocompleteProps {
    value?: string;
    onSelect: (product: ProductSearchResult) => void;
    category?: string;
    placeholder?: string;
    disabled?: boolean;
}

export function ProductAutocomplete({ value, onSelect, category, placeholder = "选择商品...", disabled }: ProductAutocompleteProps) {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');
    const debouncedQuery = useDebounce(query, 300);
    const [data, setData] = React.useState<ProductSearchResult[]>([]);
    const [loading, setLoading] = React.useState(false);
    const cacheRef = React.useRef<Record<string, ProductSearchResult[]>>({});

    React.useEffect(() => {
        if (!open) {
            setQuery('');
            return;
        }

        const cacheKey = `${category || 'all'}:${debouncedQuery}`;
        if (cacheRef.current[cacheKey]) {
            setData(cacheRef.current[cacheKey]);
            return;
        }

        // Initial load or when query changes
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const results = await searchProducts(debouncedQuery, category);
                setData(results);
                cacheRef.current[cacheKey] = results;
            } catch (error) {
                console.error("Failed to search products", error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [debouncedQuery, category, open]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="w-full justify-between font-normal h-8 px-2"
                >
                    {value || <span className="text-muted-foreground">{placeholder}</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="输入名称或编码搜索..."
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {loading && (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        )}
                        {!loading && data.length === 0 && (
                            <CommandEmpty>未找到相关商品</CommandEmpty>
                        )}
                        <CommandGroup>
                            {data.map((product) => (
                                <CommandItem
                                    key={product.id}
                                    value={product.id}
                                    onSelect={() => {
                                        onSelect(product);
                                        setOpen(false);
                                    }}
                                >
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span>{product.name}</span>
                                            <span className="text-xs text-muted-foreground bg-muted px-1 rounded">{product.category}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {product.sku} {product.unitPrice ? `¥${product.unitPrice}` : ''}
                                        </span>
                                    </div>
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            value === product.name ? "opacity-100" : "opacity-0"
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
