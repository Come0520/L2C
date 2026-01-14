'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
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
import { useQuery } from '@tanstack/react-query';
// Import fetcher - we might need a client-side fetcher wrapper or use server action
import { getChannels } from '../actions/queries'; // Server action

interface ChannelPickerProps {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    tenantId: string;
}

export function ChannelPicker({ value, onChange, placeholder = "选择渠道...", tenantId }: ChannelPickerProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');

    // Ideally use react-query or SWR to fetch. 
    // Since getChannels is a server action, we can wrap it.
    // For simplicity/speed here, assuming simple effect or useQuery if setup.
    // Given the constraints, I will build a simple fetcher effect.

    // Using simple state for now as react-query setup is outside scope of this file creation check
    const [channels, setChannels] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (!open) return;

        let active = true;
        setLoading(true);

        getChannels({ tenantId, query: search, pageSize: 50 })
            .then((res) => {
                if (active) {
                    setChannels(res.data);
                }
            })
            .catch(console.error)
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => { active = false; };
    }, [open, search, tenantId]);

    const selectedChannel = channels.find((c) => c.id === value) || (value ? { name: 'Loading...', id: value } : null);
    // If value is set but channel not in list (e.g. initial load), might need to fetch it separately or rely on parent passing it?
    // For now assuming list covers it or it's just a picker for NEW selection.

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {value
                        ? (channels.find((c) => c.id === value)?.name || "已选择")
                        : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command shouldFilter={false}>
                    {/* Manual filtering via server */}
                    <CommandInput
                        placeholder="搜索渠道..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        <CommandEmpty>{loading ? '加载中...' : '未找到渠道'}</CommandEmpty>
                        <CommandGroup>
                            {channels.map((channel) => (
                                <CommandItem
                                    key={channel.id}
                                    value={channel.name} // Value used for internal cmd matching
                                    onSelect={() => {
                                        onChange(channel.id === value ? "" : channel.id);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === channel.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{channel.name}</span>
                                        <span className="text-xs text-muted-foreground">{channel.code}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
