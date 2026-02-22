'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/shared/ui/command';
import { globalSearch } from '../actions';
import { Loader2, Search, Users, FileText, History, Box, Calculator, Wrench, Wallet, Network } from 'lucide-react';

interface SearchResultItem {
    type: 'customer' | 'lead' | 'order' | 'quote' | 'product' | 'ticket' | 'channel' | 'finance' | 'history';
    id: string;
    label: string | null;
    sub: string | null;
    highlight?: {
        label: string;
        sub: string;
    };
}

export function GlobalSearchCommand() {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');
    const [debouncedQuery] = useDebounce(query, 300);
    const [isLoading, setIsLoading] = React.useState(false);
    const [results, setResults] = React.useState<{
        customers: SearchResultItem[];
        leads: SearchResultItem[];
        orders: SearchResultItem[];
        quotes: SearchResultItem[];
        products: SearchResultItem[];
        tickets: SearchResultItem[];
        channels: SearchResultItem[];
        finances: SearchResultItem[];
        history: SearchResultItem[];
    }>({ customers: [], leads: [], orders: [], quotes: [], products: [], tickets: [], channels: [], finances: [], history: [] });

    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);

        const onCustomOpen = () => setOpen(true);
        window.addEventListener('open-global-search', onCustomOpen);

        return () => {
            document.removeEventListener('keydown', down);
            window.removeEventListener('open-global-search', onCustomOpen);
        };
    }, []);

    React.useEffect(() => {
        let isActive = true;

        const fetchResults = async () => {
            setIsLoading(true);
            try {
                // globalSearch 返回的结果默认可能是未知类型，所以稍微提取一下
                const res = await globalSearch({ query: debouncedQuery, limit: 5 });
                if (isActive && res?.data) {
                    setResults({
                        customers: (res.data.customers as SearchResultItem[]) || [],
                        leads: (res.data.leads as SearchResultItem[]) || [],
                        orders: (res.data.orders as SearchResultItem[]) || [],
                        quotes: (res.data.quotes as SearchResultItem[]) || [],
                        products: (res.data.products as SearchResultItem[]) || [],
                        tickets: (res.data.tickets as SearchResultItem[]) || [],
                        channels: (res.data.channels as SearchResultItem[]) || [],
                        finances: (res.data.finances as SearchResultItem[]) || [],
                        history: (res.data.history as SearchResultItem[]) || [],
                    });
                }
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        if (open) {
            fetchResults();
        }

        return () => {
            isActive = false;
        };
    }, [debouncedQuery, open]);

    React.useEffect(() => {
        if (!open) {
            setQuery('');
        }
    }, [open]);

    const handleSelect = (item: SearchResultItem) => {
        setOpen(false);
        setQuery('');

        if (item.type === 'history') {
            setQuery(item.label || '');
            setOpen(true);
            return;
        }

        switch (item.type) {
            case 'customer':
                router.push(`/customers/${item.id}`);
                break;
            case 'lead':
                router.push(`/leads/${item.id}`);
                break;
            case 'order':
                router.push(`/orders/${item.id}`);
                break;
            case 'quote':
                router.push(`/quotes/${item.id}`);
                break;
            case 'product':
                router.push(`/products/${item.id}`);
                break;
            case 'ticket':
                router.push(`/after-sales/${item.id}`);
                break;
            case 'channel':
                router.push(`/channels/${item.id}`);
                break;
            case 'finance':
                // 财务可能跳转到应收账单详情，这里给出一个通用映射
                router.push(`/finance/ar/${item.id}`);
                break;
        }
    };

    const renderHighlight = (html: string) => {
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
    };

    const hasResults =
        results.history.length > 0 ||
        results.customers.length > 0 ||
        results.leads.length > 0 ||
        results.orders.length > 0 ||
        results.quotes.length > 0 ||
        results.products.length > 0 ||
        results.tickets.length > 0 ||
        results.channels.length > 0 ||
        results.finances.length > 0;

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                placeholder="搜索任意您有权限访问的业务数据..."
                value={query}
                onValueChange={setQuery}
            />
            <CommandList>
                {isLoading && (
                    <div className="flex items-center justify-center p-6">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}
                {!isLoading && !hasResults && (
                    <CommandEmpty>未找到结果，请更换关键词或确认您的访问权限。</CommandEmpty>
                )}

                {!isLoading && results.history.length > 0 && (
                    <CommandGroup heading="最近搜索">
                        {results.history.map((item) => (
                            <CommandItem
                                key={item.id}
                                value={`history-${item.label}`}
                                onSelect={() => handleSelect(item)}
                            >
                                <History className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>{item.label}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {!isLoading && results.customers.length > 0 && (
                    <CommandGroup heading="客户">
                        {results.customers.map((item) => (
                            <CommandItem key={item.id} value={`customer-${item.id}-${item.label}-${item.sub}`} onSelect={() => handleSelect(item)} className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                                    <Users className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium">{item.highlight?.label ? renderHighlight(item.highlight.label) : item.label}</span>
                                    {item.sub && <span className="text-xs text-muted-foreground">{item.highlight?.sub ? renderHighlight(item.highlight.sub) : item.sub}</span>}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {!isLoading && results.leads.length > 0 && (
                    <CommandGroup heading="线索">
                        {results.leads.map((item) => (
                            <CommandItem key={item.id} value={`lead-${item.id}-${item.label}-${item.sub}`} onSelect={() => handleSelect(item)} className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                                    <Search className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium">{item.highlight?.label ? renderHighlight(item.highlight.label) : item.label}</span>
                                    {item.sub && <span className="text-xs text-muted-foreground">{item.highlight?.sub ? renderHighlight(item.highlight.sub) : item.sub}</span>}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {!isLoading && results.orders.length > 0 && (
                    <CommandGroup heading="订单">
                        {results.orders.map((item) => (
                            <CommandItem key={item.id} value={`order-${item.id}-${item.label}-${item.sub}`} onSelect={() => handleSelect(item)} className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium">{item.highlight?.label ? renderHighlight(item.highlight.label) : item.label}</span>
                                    {item.sub && <span className="text-xs text-muted-foreground">状态: {item.highlight?.sub ? renderHighlight(item.highlight.sub) : item.sub}</span>}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {!isLoading && results.quotes.length > 0 && (
                    <CommandGroup heading="报价">
                        {results.quotes.map((item) => (
                            <CommandItem key={item.id} value={`quote-${item.id}-${item.label}-${item.sub}`} onSelect={() => handleSelect(item)} className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400">
                                    <Calculator className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium">{item.highlight?.label ? renderHighlight(item.highlight.label) : item.label}</span>
                                    {item.sub && <span className="text-xs text-muted-foreground">状态: {item.highlight?.sub ? renderHighlight(item.highlight.sub) : item.sub}</span>}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {!isLoading && results.products.length > 0 && (
                    <CommandGroup heading="产品">
                        {results.products.map((item) => (
                            <CommandItem key={item.id} value={`product-${item.id}-${item.label}-${item.sub}`} onSelect={() => handleSelect(item)} className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                                    <Box className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium">{item.highlight?.label ? renderHighlight(item.highlight.label) : item.label}</span>
                                    {item.sub && <span className="text-xs text-muted-foreground">SKU: {item.highlight?.sub ? renderHighlight(item.highlight.sub) : item.sub}</span>}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {!isLoading && results.tickets.length > 0 && (
                    <CommandGroup heading="售后工单">
                        {results.tickets.map((item) => (
                            <CommandItem key={item.id} value={`ticket-${item.id}-${item.label}-${item.sub}`} onSelect={() => handleSelect(item)} className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
                                    <Wrench className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium">{item.highlight?.label ? renderHighlight(item.highlight.label) : item.label}</span>
                                    {item.sub && <span className="text-xs text-muted-foreground">状态: {item.highlight?.sub ? renderHighlight(item.highlight.sub) : item.sub}</span>}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {!isLoading && results.channels.length > 0 && (
                    <CommandGroup heading="渠道商">
                        {results.channels.map((item) => (
                            <CommandItem key={item.id} value={`channel-${item.id}-${item.label}-${item.sub}`} onSelect={() => handleSelect(item)} className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
                                    <Network className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium">{item.highlight?.label ? renderHighlight(item.highlight.label) : item.label}</span>
                                    {item.sub && <span className="text-xs text-muted-foreground">编码: {item.highlight?.sub ? renderHighlight(item.highlight.sub) : item.sub}</span>}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {!isLoading && results.finances.length > 0 && (
                    <CommandGroup heading="账单 (应收)">
                        {results.finances.map((item) => (
                            <CommandItem key={item.id} value={`finance-${item.id}-${item.label}-${item.sub}`} onSelect={() => handleSelect(item)} className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400">
                                    <Wallet className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium">{item.highlight?.label ? renderHighlight(item.highlight.label) : item.label}</span>
                                    {item.sub && <span className="text-xs text-muted-foreground">状态: {item.highlight?.sub ? renderHighlight(item.highlight.sub) : item.sub}</span>}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}
            </CommandList>
        </CommandDialog>
    );
}
