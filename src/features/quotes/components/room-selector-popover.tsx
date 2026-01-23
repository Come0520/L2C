'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Edit3 from 'lucide-react/dist/esm/icons/edit-3';
import { getRoomGroups } from '@/features/settings/actions/room-groups-actions';
import { RoomGroup } from '@/services/quote-config.service';

// 从服务重新导出类型
export type { RoomGroup };

/**
 * 默认空间分组配置（可由租户在设置中覆盖）
 */
export const DEFAULT_ROOM_GROUPS: RoomGroup[] = [
    {
        label: '卧室',
        items: ['主卧', '次卧', '客房', '儿童房', '男孩房', '女孩房'],
    },
    {
        label: '公共空间',
        items: ['客厅', '餐厅', '书房', '茶室', '阳台', '南阳台', '北阳台'],
    },
    {
        label: '其他',
        items: ['阳光房', '洗衣房', '保姆房'],
        hasCustom: true,
    },
];

interface RoomSelectorPopoverProps {
    /** 选择空间后的回调 */
    onSelect: (name: string) => void;
    /** 空间分组配置（可由租户设置覆盖） */
    roomGroups?: RoomGroup[];
    /** 按钮大小 */
    size?: 'default' | 'sm';
    /** 对齐方式 */
    align?: 'start' | 'center' | 'end';
    /** 额外的按钮样式 */
    className?: string;
}

/**
 * 空间选择器下拉菜单组件
 * 分3列显示：卧室 / 公共空间 / 其他（含自定义）
 */
export function RoomSelectorPopover({
    onSelect,
    roomGroups = DEFAULT_ROOM_GROUPS,
    size = 'sm',
    align = 'start',
    className,
}: RoomSelectorPopoverProps) {
    const [open, setOpen] = useState(false);
    const [customMode, setCustomMode] = useState(false);
    const [customName, setCustomName] = useState('');

    const handleSelect = (name: string) => {
        onSelect(name);
        setOpen(false);
        setCustomMode(false);
        setCustomName('');
    };

    const handleCustomSubmit = () => {
        if (customName.trim()) {
            handleSelect(customName.trim());
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size={size} className={className}>
                    <Plus className="w-4 h-4 mr-1" />
                    添加空间
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align={align}>
                {customMode ? (
                    // 自定义输入模式
                    <div className="p-3 w-64">
                        <div className="text-sm font-medium mb-2">自定义空间名称</div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="输入空间名称"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCustomSubmit();
                                    if (e.key === 'Escape') setCustomMode(false);
                                }}
                                autoFocus
                                className="h-8"
                            />
                            <Button size="sm" onClick={handleCustomSubmit} disabled={!customName.trim()}>
                                确定
                            </Button>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => setCustomMode(false)}
                        >
                            返回选择
                        </Button>
                    </div>
                ) : (
                    // 分组选择模式
                    <div className="flex divide-x">
                        {roomGroups.map((group) => (
                            <div key={group.label} className="px-0.5 py-1 min-w-[80px]">
                                {/* 分组表头 */}
                                <div className="text-xs font-medium text-muted-foreground px-2 py-0.5 mb-0.5">
                                    {group.label}
                                </div>
                                {/* 选项列表 */}
                                <div className="space-y-px">
                                    {group.items.map((name) => (
                                        <Button
                                            key={name}
                                            variant="ghost"
                                            size="sm"
                                            className="w-full h-7 justify-start text-sm font-normal px-2"
                                            onClick={() => handleSelect(name)}
                                        >
                                            {name}
                                        </Button>
                                    ))}
                                    {/* 自定义按钮 */}
                                    {group.hasCustom && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full h-7 justify-start text-sm font-normal px-2 text-primary"
                                            onClick={() => setCustomMode(true)}
                                        >
                                            <Edit3 className="w-3 h-3 mr-1" />
                                            自定义
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

/**
 * 带租户配置的空间选择器
 * 自动从租户设置中加载空间分组配置
 */
interface RoomSelectorWithConfigProps {
    onSelect: (name: string) => void;
    size?: 'default' | 'sm';
    align?: 'start' | 'center' | 'end';
    className?: string;
}

export function RoomSelectorWithConfig({
    onSelect,
    size = 'sm',
    align = 'start',
    className,
}: RoomSelectorWithConfigProps) {
    const [roomGroups, setRoomGroups] = useState<RoomGroup[]>(DEFAULT_ROOM_GROUPS);

    useEffect(() => {
        async function loadConfig() {
            try {
                const groups = await getRoomGroups();
                setRoomGroups(groups);
            } catch (error) {
                console.error('加载空间分组配置失败:', error);
                // 出错时使用默认配置
            }
        }
        loadConfig();
    }, []);

    return (
        <RoomSelectorPopover
            onSelect={onSelect}
            roomGroups={roomGroups}
            size={size}
            align={align}
            className={className}
        />
    );
}

