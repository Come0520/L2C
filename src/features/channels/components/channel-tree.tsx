'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import Building2 from 'lucide-react/dist/esm/icons/building-2';
import User from 'lucide-react/dist/esm/icons/user';
import Phone from 'lucide-react/dist/esm/icons/phone';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Eye from 'lucide-react/dist/esm/icons/eye';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { cn } from '@/shared/lib/utils';
import Link from 'next/link';
import { ChannelFormDialog } from './channel-form-dialog';

// 渠道数据类型
interface ChannelNode {
    id: string;
    name: string;
    code: string;
    level: string | null;
    status: string | null;
    contactName: string | null;
    phone: string | null;
    totalLeads: number | null;
    totalDealAmount: string | null;
    hierarchyLevel: number;
    parentId: string | null;
    categoryId: string | null;
    category?: {
        id: string;
        name: string;
        code: string;
    } | null;
    contacts?: Array<{
        id: string;
        name: string;
        phone: string;
        isMain: boolean | null;
    }>;
    children?: ChannelNode[];
}

interface CategoryType {
    id: string;
    name: string;
    code: string;
}

interface ChannelTreeProps {
    initialData: ChannelNode[];
    categoryTypes: CategoryType[];
    tenantId: string;
}

/**
 * 渠道树形列表组件
 */
export function ChannelTree({ initialData, categoryTypes, tenantId }: ChannelTreeProps) {
    const [channels, setChannels] = useState<ChannelNode[]>(initialData);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingChannel, setEditingChannel] = useState<ChannelNode | null>(null);
    const [parentChannel, setParentChannel] = useState<ChannelNode | null>(null);

    // 切换展开/折叠
    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // 搜索过滤
    const filterChannels = (nodes: ChannelNode[], query: string): ChannelNode[] => {
        if (!query) return nodes;

        return nodes.filter(node => {
            const matchSelf =
                node.name.toLowerCase().includes(query.toLowerCase()) ||
                node.code.toLowerCase().includes(query.toLowerCase()) ||
                node.contactName?.toLowerCase().includes(query.toLowerCase()) ||
                node.phone?.includes(query);

            const matchChildren = node.children && filterChannels(node.children, query).length > 0;

            return matchSelf || matchChildren;
        }).map(node => ({
            ...node,
            children: node.children ? filterChannels(node.children, query) : undefined,
        }));
    };

    const filteredChannels = filterChannels(channels, searchQuery);

    // 新建渠道
    const handleAdd = (parent?: ChannelNode) => {
        setEditingChannel(null);
        setParentChannel(parent || null);
        setIsFormOpen(true);
    };

    // 编辑渠道
    const handleEdit = (channel: ChannelNode) => {
        setEditingChannel(channel);
        setParentChannel(null);
        setIsFormOpen(true);
    };

    // 表单提交成功后刷新
    const handleFormSuccess = () => {
        setIsFormOpen(false);
        // 实际应用中应该重新获取数据
        window.location.reload();
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    渠道列表
                </CardTitle>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="搜索渠道..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 w-[250px]"
                        />
                    </div>
                    <Button onClick={() => handleAdd()}>
                        <Plus className="h-4 w-4 mr-2" />
                        新建渠道
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {filteredChannels.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        {searchQuery ? '没有找到匹配的渠道' : '暂无渠道，点击上方按钮添加'}
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredChannels.map((channel) => (
                            <ChannelTreeNode
                                key={channel.id}
                                channel={channel}
                                level={0}
                                expandedIds={expandedIds}
                                onToggle={toggleExpand}
                                onAdd={handleAdd}
                                onEdit={handleEdit}
                            />
                        ))}
                    </div>
                )}
            </CardContent>

            {/* 渠道表单弹窗 */}
            <ChannelFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                channel={editingChannel}
                parentChannel={parentChannel}
                categoryTypes={categoryTypes}
                tenantId={tenantId}
                onSuccess={handleFormSuccess}
            />
        </Card>
    );
}

/**
 * 单个渠道树节点
 */
interface ChannelTreeNodeProps {
    channel: ChannelNode;
    level: number;
    expandedIds: Set<string>;
    onToggle: (id: string) => void;
    onAdd: (parent?: ChannelNode) => void;
    onEdit: (channel: ChannelNode) => void;
}

function ChannelTreeNode({
    channel,
    level,
    expandedIds,
    onToggle,
    onAdd,
    onEdit,
}: ChannelTreeNodeProps) {
    const hasChildren = channel.children && channel.children.length > 0;
    const isExpanded = expandedIds.has(channel.id);

    // 等级颜色
    const levelColors: Record<string, string> = {
        S: 'bg-yellow-500',
        A: 'bg-green-500',
        B: 'bg-blue-500',
        C: 'bg-gray-500',
    };

    // 状态颜色
    const statusVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
        ACTIVE: 'default',
        SUSPENDED: 'secondary',
        TERMINATED: 'destructive',
    };

    return (
        <div>
            <div
                className={cn(
                    'flex items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors',
                    'border border-transparent hover:border-border'
                )}
                style={{ paddingLeft: `${level * 24 + 12}px` }}
            >
                {/* 展开/折叠按钮 */}
                <button
                    onClick={() => hasChildren && onToggle(channel.id)}
                    className={cn(
                        'h-6 w-6 flex items-center justify-center rounded',
                        hasChildren ? 'hover:bg-muted cursor-pointer' : 'cursor-default opacity-0'
                    )}
                >
                    {hasChildren && (
                        isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )
                    )}
                </button>

                {/* 渠道信息 */}
                <div className="flex-1 flex items-center gap-4">
                    {/* 名称和等级 */}
                    <div className="flex items-center gap-2 min-w-[200px]">
                        <span
                            className={cn(
                                'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                                levelColors[channel.level || 'C']
                            )}
                        >
                            {channel.level || 'C'}
                        </span>
                        <div>
                            <div className="font-medium">{channel.name}</div>
                            <div className="text-xs text-muted-foreground">{channel.code}</div>
                        </div>
                    </div>

                    {/* 类型 */}
                    {channel.category && (
                        <Badge variant="outline" className="text-xs">
                            {channel.category.name}
                        </Badge>
                    )}

                    {/* 联系人 */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-[120px]">
                        <User className="h-3.5 w-3.5" />
                        <span>{channel.contactName || '-'}</span>
                    </div>

                    {/* 电话 */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-[120px]">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{channel.phone || '-'}</span>
                    </div>

                    {/* 业绩 */}
                    <div className="flex items-center gap-1 text-sm min-w-[100px]">
                        <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                        <span className="font-medium">
                            ¥{parseFloat(channel.totalDealAmount || '0').toLocaleString()}
                        </span>
                    </div>

                    {/* 状态 */}
                    <Badge variant={statusVariants[channel.status || 'ACTIVE']}>
                        {channel.status === 'ACTIVE' ? '活跃' :
                            channel.status === 'SUSPENDED' ? '暂停' :
                                channel.status === 'TERMINATED' ? '终止' : '活跃'}
                    </Badge>
                </div>

                {/* 操作 */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/channels/${channel.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                查看详情
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(channel)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            编辑
                        </DropdownMenuItem>
                        {channel.hierarchyLevel < 3 && (
                            <DropdownMenuItem onClick={() => onAdd(channel)}>
                                <Plus className="h-4 w-4 mr-2" />
                                添加子渠道
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* 子节点 */}
            {hasChildren && isExpanded && (
                <div>
                    {channel.children!.map((child) => (
                        <ChannelTreeNode
                            key={child.id}
                            channel={child}
                            level={level + 1}
                            expandedIds={expandedIds}
                            onToggle={onToggle}
                            onAdd={onAdd}
                            onEdit={onEdit}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
