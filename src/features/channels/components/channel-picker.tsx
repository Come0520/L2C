'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, ChevronRight, Hash } from 'lucide-react';
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
import { getChannelTree } from '../actions/queries';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/shared/ui/badge';

interface ChannelPickerProps {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    tenantId: string;
}

interface ChannelNode {
    id: string;
    name: string;
    code: string;
    level: string | null;
    hierarchyLevel: number;
    children?: ChannelNode[];
}

export function ChannelPicker({ value, onChange, placeholder = "选择渠道...", tenantId }: ChannelPickerProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');

    // Fetch hierarchical data
    const { data: treeData, isLoading } = useQuery({
        queryKey: ['channel-tree', tenantId],
        queryFn: () => getChannelTree(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Flatten for search if needed, or simple traversal
    // But tree view is better.
    // However, Command component is flat list oriented.
    // We can flatten the tree for the "list" view but show hierarchy via indentation.

    const flattenChannels = React.useMemo(() => {
        if (!treeData) return [];
        const result: ChannelNode[] = [];

        const traverse = (nodes: ChannelNode[]) => {
            for (const node of nodes) {
                result.push(node);
                if (node.children) {
                    traverse(node.children);
                }
            }
        };
        traverse(treeData);
        return result;
    }, [treeData]);

    const filteredChannels = React.useMemo(() => {
        if (!search) return flattenChannels;
        return flattenChannels.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.code.toLowerCase().includes(search.toLowerCase())
        );
    }, [flattenChannels, search]);

    const selectedChannel = flattenChannels.find(c => c.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {selectedChannel ? (
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "w-2 h-2 rounded-full",
                                selectedChannel.level === 'S' ? "bg-yellow-500" :
                                    selectedChannel.level === 'A' ? "bg-green-500" :
                                        selectedChannel.level === 'B' ? "bg-blue-500" : "bg-gray-400"
                            )} />
                            <span>{selectedChannel.name}</span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="搜索渠道名称或编号..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        <CommandEmpty>{isLoading ? '加载中...' : '未找到相关渠道'}</CommandEmpty>
                        <CommandGroup>
                            {filteredChannels.map((channel) => (
                                <CommandItem
                                    key={channel.id}
                                    value={channel.name}
                                    onSelect={() => {
                                        onChange(channel.id);
                                        setOpen(false);
                                    }}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        {/* Hierarchy Indentation */}
                                        {!search && channel.hierarchyLevel > 1 && (
                                            <div style={{ width: (channel.hierarchyLevel - 1) * 12 }} />
                                        )}
                                        {!search && channel.hierarchyLevel > 1 && (
                                            <div className="text-muted-foreground"><ChevronRight className="h-3 w-3" /></div>
                                        )}

                                        <div className="flex flex-col">
                                            <span className="font-medium">{channel.name}</span>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Hash className="h-3 w-3" />
                                                {channel.code}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] px-1 h-5">
                                            {channel.level}级
                                        </Badge>
                                        {value === channel.id && (
                                            <Check className="h-4 w-4 text-primary" />
                                        )}
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
