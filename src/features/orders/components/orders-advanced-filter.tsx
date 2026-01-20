'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { Filter, X } from 'lucide-react';

/**
 * 订单筛选条件类型
 */
export interface OrderFilters {
    salesId?: string;
    channelId?: string;
    designerId?: string;
    referrerId?: string;
    address?: string;
}

export interface OrderAdvancedFilterProps {
    filters: OrderFilters;
    onFiltersChange: (filters: OrderFilters) => void;
    salesOptions?: { id: string; name: string }[];
    channelOptions?: { id: string; name: string }[];
    designerOptions?: { id: string; name: string }[];
    referrerOptions?: { id: string; name: string }[];
}

/**
 * 订单高级筛选Dialog
 */
export function OrderAdvancedFilter({
    filters,
    onFiltersChange,
    salesOptions = [],
    channelOptions = [],
    designerOptions = [],
    referrerOptions = [],
}: OrderAdvancedFilterProps) {
    const [open, setOpen] = useState(false);
    const [localFilters, setLocalFilters] = useState<OrderFilters>(filters);

    // 同步外部filters变化
    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    // 计算激活的筛选条件数量
    const activeCount = Object.values(filters).filter(Boolean).length;

    const handleApply = () => {
        onFiltersChange(localFilters);
        setOpen(false);
    };

    const handleClear = () => {
        const emptyFilters: OrderFilters = {};
        setLocalFilters(emptyFilters);
        onFiltersChange(emptyFilters);
    };

    const handleReset = () => {
        setLocalFilters(filters);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                    <Filter className="h-4 w-4" />
                    {activeCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            {activeCount}
                        </span>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>高级筛选</DialogTitle>
                    <DialogDescription>
                        设置筛选条件精确查找订单
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* 销售人员 */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="salesId" className="text-right">
                            销售人员
                        </Label>
                        <Select
                            value={localFilters.salesId || '__ALL__'}
                            onValueChange={(value) =>
                                setLocalFilters({ ...localFilters, salesId: value === '__ALL__' ? undefined : value })
                            }
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="全部" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__ALL__">全部</SelectItem>
                                {salesOptions.map((opt) => (
                                    <SelectItem key={opt.id} value={opt.id}>
                                        {opt.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 渠道 */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="channelId" className="text-right">
                            渠道
                        </Label>
                        <Select
                            value={localFilters.channelId || '__ALL__'}
                            onValueChange={(value) =>
                                setLocalFilters({ ...localFilters, channelId: value === '__ALL__' ? undefined : value })
                            }
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="全部" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__ALL__">全部</SelectItem>
                                {channelOptions.map((opt) => (
                                    <SelectItem key={opt.id} value={opt.id}>
                                        {opt.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 设计师 */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="designerId" className="text-right">
                            设计师
                        </Label>
                        <Select
                            value={localFilters.designerId || '__ALL__'}
                            onValueChange={(value) =>
                                setLocalFilters({ ...localFilters, designerId: value === '__ALL__' ? undefined : value })
                            }
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="全部" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__ALL__">全部</SelectItem>
                                {designerOptions.map((opt) => (
                                    <SelectItem key={opt.id} value={opt.id}>
                                        {opt.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 带单人 */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="referrerId" className="text-right">
                            带单人
                        </Label>
                        <Select
                            value={localFilters.referrerId || '__ALL__'}
                            onValueChange={(value) =>
                                setLocalFilters({ ...localFilters, referrerId: value === '__ALL__' ? undefined : value })
                            }
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="全部" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__ALL__">全部</SelectItem>
                                {referrerOptions.map((opt) => (
                                    <SelectItem key={opt.id} value={opt.id}>
                                        {opt.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 地址搜索 */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="address" className="text-right">
                            地址
                        </Label>
                        <Input
                            id="address"
                            placeholder="输入地址关键词"
                            className="col-span-3"
                            value={localFilters.address || ''}
                            onChange={(e) =>
                                setLocalFilters({ ...localFilters, address: e.target.value || undefined })
                            }
                        />
                    </div>
                </div>

                <DialogFooter className="flex justify-between">
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={handleClear}>
                            <X className="h-4 w-4 mr-1" />
                            清除条件
                        </Button>
                        <Button variant="outline" onClick={handleReset}>
                            重置
                        </Button>
                    </div>
                    <Button onClick={handleApply}>应用筛选</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default OrderAdvancedFilter;
