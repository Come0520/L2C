'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Plus, Search } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/shared/ui/popover';
import { CreateCustomerDialog } from './create-customer-dialog';
import { getCustomers } from '@/features/customers/actions/queries';

function useDebounceValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

interface CustomerComboboxProps {
    value?: string;
    onChange: (value: string, customer?: any) => void;
    disabled?: boolean;
    userId: string;
    tenantId: string;
}

export function CustomerCombobox({ value, onChange, disabled, userId, tenantId }: CustomerComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounceValue(search, 500);

    const { data: customerData, isLoading } = useQuery({
        queryKey: ['customers', debouncedSearch],
        queryFn: async () => {
            const res = await getCustomers({ page: 1, pageSize: 15, search: debouncedSearch || undefined });
            return res.data;
        },
        enabled: open,
    });

    // Safety check for data array
    const data = Array.isArray(customerData) ? customerData : [];

    const selectedCustomer = data.find((c: any) => c.id === value);

    const handleSelect = (customer: any) => {
        onChange(customer.id, customer);
        setOpen(false);
    };

    return (
        <div className="flex items-center gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                        disabled={disabled}
                    >
                        {selectedCustomer ? selectedCustomer.name : (value ? "已选择客户" : "选择客户...")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                    <div className="flex flex-col">
                        <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="搜索客户..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {isLoading ? (
                            <div className="p-4 text-center text-sm text-gray-500">加载中...</div>
                        ) : data.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">未找到相关客户</div>
                        ) : (
                            <div className="max-h-[200px] overflow-auto">
                                {data.map((customer: any) => (
                                    <button
                                        key={customer.id}
                                        type="button"
                                        onClick={() => handleSelect(customer)}
                                        className={cn(
                                            "w-full flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                                            value === customer.id && "bg-accent"
                                        )}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === customer.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col flex-1 text-left">
                                            <span>{customer.name}</span>
                                            <span className="text-xs text-muted-foreground">{customer.phone}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
            <CreateCustomerDialog
                trigger={
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        新建
                    </Button>
                }
                userId={userId}
                tenantId={tenantId}
            />
        </div>
    );
}
