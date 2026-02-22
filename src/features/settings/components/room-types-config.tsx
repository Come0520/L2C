'use client';
import { logger } from '@/shared/lib/logger';

import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent } from '@/shared/ui/card';
import { toast } from 'sonner';
import Plus from 'lucide-react/dist/esm/icons/plus';
import X from 'lucide-react/dist/esm/icons/x';
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { getRoomGroups, updateRoomGroups } from '../actions/room-groups-actions';
import { RoomGroup } from '@/services/quote-config.service';

/**
 * 默认配置（用于重置功能）
 */
const DEFAULT_GROUPS: RoomGroup[] = [
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

/**
 * 空间类型配置组件
 * 允许租户自定义报价单中的空间选择器选项
 */
export function RoomTypesConfig() {
    const [groups, setGroups] = useState<RoomGroup[]>([]);
    const [newItemInputs, setNewItemInputs] = useState<Record<number, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // 加载租户配置
    useEffect(() => {
        async function loadConfig() {
            try {
                const data = await getRoomGroups();
                setGroups(data);
            } catch (error) {
                logger.error('加载配置失败:', error);
                toast.error('加载配置失败');
                setGroups(DEFAULT_GROUPS);
            } finally {
                setIsLoading(false);
            }
        }
        loadConfig();
    }, []);

    // 添加分组
    const handleAddGroup = () => {
        setGroups([...groups, { label: '新分组', items: [] }]);
    };

    // 删除分组
    const handleDeleteGroup = (index: number) => {
        setGroups(groups.filter((_, i) => i !== index));
    };

    // 更新分组名称
    const handleUpdateGroupLabel = (index: number, label: string) => {
        const updated = [...groups];
        updated[index] = { ...updated[index], label };
        setGroups(updated);
    };

    // 添加选项到分组
    const handleAddItem = (groupIndex: number) => {
        const newItem = newItemInputs[groupIndex]?.trim();
        if (!newItem) return;

        const updated = [...groups];
        updated[groupIndex] = {
            ...updated[groupIndex],
            items: [...updated[groupIndex].items, newItem]
        };
        setGroups(updated);
        setNewItemInputs({ ...newItemInputs, [groupIndex]: '' });
    };

    // 删除选项
    const handleDeleteItem = (groupIndex: number, itemIndex: number) => {
        const updated = [...groups];
        updated[groupIndex] = {
            ...updated[groupIndex],
            items: updated[groupIndex].items.filter((_, i) => i !== itemIndex)
        };
        setGroups(updated);
    };

    // 切换"最后一组显示自定义输入"
    const toggleLastGroupCustom = () => {
        if (groups.length === 0) return;
        const updated = [...groups];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
            ...updated[lastIndex],
            hasCustom: !updated[lastIndex].hasCustom
        };
        setGroups(updated);
    };

    // 保存配置
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateRoomGroups(groups);
            toast.success('配置已保存');
        } catch (error) {
            logger.error('保存失败:', error);
            toast.error('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
        } finally {
            setIsSaving(false);
        }
    };

    // 重置为默认
    const handleReset = () => {
        setGroups(DEFAULT_GROUPS);
        toast.info('已重置为默认配置，请保存以生效');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 分组列表 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {groups.map((group, groupIndex) => (
                    <Card key={groupIndex} className="relative">
                        <div className="p-4 pb-3">
                            <div className="flex items-center gap-2">
                                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                                <Input
                                    value={group.label}
                                    onChange={(e) => handleUpdateGroupLabel(groupIndex, e.target.value)}
                                    className="h-8 font-medium"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDeleteGroup(groupIndex)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <CardContent className="pt-0">
                            {/* 选项列表 */}
                            <div className="space-y-1 mb-3">
                                {group.items.map((item, itemIndex) => (
                                    <div
                                        key={itemIndex}
                                        className="flex items-center justify-between px-2 py-1 bg-muted/50 rounded text-sm"
                                    >
                                        <span>{item}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDeleteItem(groupIndex, itemIndex)}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            {/* 添加新选项 */}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="添加空间类型"
                                    value={newItemInputs[groupIndex] || ''}
                                    onChange={(e) => setNewItemInputs({ ...newItemInputs, [groupIndex]: e.target.value })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddItem(groupIndex);
                                    }}
                                    className="h-8 text-sm"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleAddItem(groupIndex)}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                            {/* 显示自定义标记 */}
                            {group.hasCustom && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                    ✓ 此分组显示"自定义"输入选项
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {/* 添加分组按钮 */}
                <Card
                    className="flex items-center justify-center min-h-[200px] border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={handleAddGroup}
                >
                    <div className="text-center text-muted-foreground">
                        <Plus className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">添加分组</p>
                    </div>
                </Card>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={toggleLastGroupCustom}>
                    {groups[groups.length - 1]?.hasCustom ? '移除' : '添加'}最后一组的自定义输入
                </Button>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleReset}>
                        重置为默认
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        保存配置
                    </Button>
                </div>
            </div>
        </div>
    );
}
