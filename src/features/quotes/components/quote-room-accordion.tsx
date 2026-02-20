'use client';

import { useState, useCallback, ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { ChevronDown, ChevronUp, Trash2, GripVertical, Plus } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/shared/ui/alert-dialog';

// ... interface definitions ...
export interface RoomData {
    id: string;
    name: string;
    itemCount?: number;
    subtotal?: number;
    [key: string]: unknown;
}

export interface QuoteRoomAccordionProps {
    room: RoomData;
    isExpanded: boolean;
    onToggle: (id: string) => void;
    readOnly?: boolean;
    onRename?: (id: string, name: string) => void;
    onDelete?: (id: string) => void;
    children: ReactNode;
    className?: string;
}

export function QuoteRoomAccordion({
    room,
    isExpanded,
    onToggle,
    readOnly = false,
    onRename,
    onDelete,
    children,
    className,
}: QuoteRoomAccordionProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(room.name);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // 格式化金额
    const formatAmount = (amount: number | undefined): string => {
        if (amount === undefined || amount === null) return '¥0.00';
        return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // 处理重命名
    const handleRename = useCallback(() => {
        if (editName !== room.name && onRename) {
            onRename(room.id, editName);
        }
        setIsEditing(false);
    }, [editName, room.id, room.name, onRename]);

    return (
        <div
            className={cn(
                'rounded-lg border bg-card overflow-hidden transition-all duration-200',
                isExpanded ? 'shadow-md' : 'shadow-sm hover:shadow-md',
                className
            )}
        >
            {/* 头部栏 - 始终显示 */}
            <div
                className={cn(
                    'flex items-center justify-between px-4 py-3 cursor-pointer transition-colors',
                    isExpanded
                        ? 'bg-primary/5 border-b'
                        : 'hover:bg-accent/50'
                )}
                onClick={() => onToggle(room.id)}
            >
                <div className="flex items-center gap-3">
                    {/* 拖拽手柄（预留） */}
                    {!readOnly && (
                        <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
                    )}

                    {/* 空间名称 */}
                    {isEditing && !readOnly ? (
                        <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename();
                                if (e.key === 'Escape') {
                                    setEditName(room.name);
                                    setIsEditing(false);
                                }
                            }}
                            className="h-7 w-40"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span
                            className="font-medium"
                            onDoubleClick={(e) => {
                                if (!readOnly) {
                                    e.stopPropagation();
                                    setIsEditing(true);
                                }
                            }}
                        >
                            {room.name}
                        </span>
                    )}

                    {/* 收起时显示汇总信息 */}
                    {!isExpanded && (
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{room.itemCount ?? 0} 件商品</span>
                            <span className="font-medium text-foreground">
                                {formatAmount(room.subtotal)}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* 操作按钮（展开时显示） - 仅保留删除按钮 */}
                    {isExpanded && !readOnly && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsDeleteDialogOpen(true);
                            }}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}

                    {/* 展开/收起图标 */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle(room.id);
                        }}
                    >
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* 内容区 - 仅展开时显示 */}
            {isExpanded && (
                <div className="p-4">
                    {children}
                </div>
            )}

            {/* 删除确认对话框 */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除空间？</AlertDialogTitle>
                        <AlertDialogDescription>
                            您确定要删除空间“{room.name}”吗？此空间内的所有商品也将被一并删除，且操作无法撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => onDelete?.(room.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            确认删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

/**
 * 空间抽屉容器 - 管理多个空间的展开状态
 * 支持聚焦模式：默认当前编辑空间展开，其他收起
 */
interface QuoteRoomAccordionGroupProps {
    /** 所有空间数据 */
    rooms: RoomData[];
    /** 是否启用聚焦模式（点击一个收起其他） */
    focusMode?: boolean;
    /** 默认展开的空间 ID */
    defaultExpandedId?: string;
    /** 是否只读 */
    readOnly?: boolean;
    /** 重命名回调 */
    onRename?: (roomId: string, newName: string) => void;
    /** 删除回调 */
    onDelete?: (roomId: string) => void;
    /** 添加空间回调 */
    onAddRoom?: () => void;
    /** 渲染每个空间内容的函数 */
    renderRoomContent: (room: RoomData) => ReactNode;
    /** 额外的 className */
    className?: string;
}

export function QuoteRoomAccordionGroup({
    rooms,
    focusMode = true,
    defaultExpandedId,
    readOnly = false,
    onRename,
    onDelete,
    onAddRoom,
    renderRoomContent,
    className,
}: QuoteRoomAccordionGroupProps) {
    // 管理展开状态
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
        const initial = new Set<string>();
        if (defaultExpandedId) initial.add(defaultExpandedId);
        else if (rooms.length > 0) initial.add(rooms[0].id);
        return initial;
    });

    // 切换展开状态
    const handleToggle = useCallback((roomId: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(roomId)) {
                next.delete(roomId);
            } else {
                if (focusMode) {
                    // 聚焦模式：收起其他，仅展开当前
                    next.clear();
                }
                next.add(roomId);
            }
            return next;
        });
    }, [focusMode]);

    return (
        <div className={cn('space-y-4', className)}>
            {/* 添加空间按钮 */}
            {!readOnly && onAddRoom && (
                <div className="flex justify-start">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onAddRoom}
                        className="gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        添加空间
                    </Button>
                </div>
            )}

            {/* 空间列表 */}
            {rooms.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border rounded-md border-dashed">
                    暂无空间，请先添加空间
                </div>
            ) : (
                rooms.map((room) => (
                    <QuoteRoomAccordion
                        key={room.id}
                        room={room}
                        isExpanded={expandedIds.has(room.id)}
                        onToggle={handleToggle}
                        readOnly={readOnly}
                        onRename={onRename}
                        onDelete={onDelete}
                    >
                        {renderRoomContent(room)}
                    </QuoteRoomAccordion>
                ))
            )}
        </div>
    );
}
