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

/**
 * 搜索结果项内部接口
 * 用于在组件状态中管理各类搜索结果
 */
interface SearchResultItem {
    /** 模块类型标识 */
    type: 'customer' | 'lead' | 'order' | 'quote' | 'product' | 'ticket' | 'channel' | 'finance' | 'history';
    /** 实体唯一 ID */
    id: string;
    /** 显示标签 */
    label: string | null;
    /** 显示副标题/说明 */
    sub: string | null;
    /** 高亮配置信息 */
    highlight?: {
        label: string;
        sub: string;
    };
}

/**
 * 全局搜索指令面板组件
 * 
 * 功能职责：
 * 1. 响应快捷键 (Ctrl+K / Cmd+K) 唤起全局搜索中心。
 * 2. 处理多维度的业务数据搜索（客户、订单、产品等）。
 * 3. 管理搜索历史记录（集成 Redis 后端）。
 * 4. 提供带关键词高亮的建议列表。
 * 5. 根据结果类型自动路由至对应的业务详情页。
 */
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
                    <div className="flex flex-col items-center justify-center p-10 space-y-3">
                        <div className="relative">
                            <Loader2 className="h-8 w-8 animate-spin text-primary-500 drop-shadow-[0_0_12px_rgba(37,99,235,0.6)]" />
                            <div className="absolute inset-0 border-2 border-primary-500/30 rounded-full animate-ping opacity-20" />
                        </div>
                        <span className="text-sm font-medium text-primary-500/80 animate-pulse tracking-widest">SEARCHING_DATA...</span>
                    </div>
                )}
                {!isLoading && !hasResults && (
                    <CommandEmpty>
                        <div className="flex flex-col items-center justify-center space-y-2 opacity-60">
                            <Search className="h-8 w-8 text-muted-foreground mb-2" />
                            <span>未找到计算结果，或权限不足。</span>
                            <span className="text-xs tracking-wider opacity-50"># NO_DATA_FOUND</span>
                        </div>
                    </CommandEmpty>
                )}

                {!isLoading && results.history.length > 0 && (
                    <CommandGroup heading="最近搜索">
                        {results.history.map((item) => (
                            <CommandItem
                                key={item.id}
                                value={`history-${item.label}`}
                                onSelect={() => handleSelect(item)}
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/20 border border-muted/20 mr-2 shadow-[0_0_10px_rgba(0,0,0,0.05)]">
                                    <History className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <span>{item.label}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {!isLoading && results.customers.length > 0 && (
                    <CommandGroup heading="客户">
                        {results.customers.map((item) => (
                            <CommandItem key={item.id} value={`customer-${item.id}-${item.label}-${item.sub}`} onSelect={() => handleSelect(item)} className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)] backdrop-blur-md">
                                    <Users className="h-4 w-4 drop-shadow-sm" />
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
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)] backdrop-blur-md">
                                    <Search className="h-4 w-4 drop-shadow-sm" />
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
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)] backdrop-blur-md">
                                    <FileText className="h-4 w-4 drop-shadow-sm" />
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
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)] backdrop-blur-md">
                                    <Calculator className="h-4 w-4 drop-shadow-sm" />
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
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)] backdrop-blur-md">
                                    <Box className="h-4 w-4 drop-shadow-sm" />
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
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)] backdrop-blur-md">
                                    <Wrench className="h-4 w-4 drop-shadow-sm" />
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
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shadow-[0_0_10px_rgba(20,184,166,0.1)] backdrop-blur-md">
                                    <Network className="h-4 w-4 drop-shadow-sm" />
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
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)] backdrop-blur-md">
                                    <Wallet className="h-4 w-4 drop-shadow-sm" />
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
