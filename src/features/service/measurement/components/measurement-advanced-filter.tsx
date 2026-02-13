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
import { DatePicker } from '@/shared/ui/date-picker';
import { format } from 'date-fns';

/**
 * 测量任务筛选条件类型
 */
export interface MeasurementFilters {
    workerId?: string;      // 测量师
    salesId?: string;       // 销售
    address?: string;       // 地址模糊搜索
    channel?: string;       // 渠道
    customerName?: string;  // 客户名称
    dateFrom?: string;      // 预约日期开始
    dateTo?: string;        // 预约日期结束
}

export interface MeasurementAdvancedFilterProps {
    filters: MeasurementFilters;
    onFiltersChange: (filters: MeasurementFilters) => void;
    workerOptions?: { id: string; name: string }[];
    salesOptions?: { id: string; name: string }[];
    channelOptions?: { id: string; name: string }[];
}

/**
 * 测量任务高级筛选 Dialog
 */
export function MeasurementAdvancedFilter({
    filters,
    onFiltersChange,
    workerOptions = [],
    salesOptions = [],
    channelOptions = [],
}: MeasurementAdvancedFilterProps) {
    const [open, setOpen] = useState(false);
    const [localFilters, setLocalFilters] = useState<MeasurementFilters>(filters);

    // 同步外部 filters 变化
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
        const emptyFilters: MeasurementFilters = {};
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
                        设置筛选条件精确查找测量任务
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* 预约日期范围 */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">预约日期</Label>
                        <div className="col-span-3 flex gap-2 items-center">
                            <DatePicker
                                value={localFilters.dateFrom ? new Date(localFilters.dateFrom) : undefined}
                                onChange={(date) => setLocalFilters({
                                    ...localFilters,
                                    dateFrom: date ? format(date, 'yyyy-MM-dd') : undefined
                                })}
                                placeholder="开始日期"
                                className="flex-1"
                            />
                            <span className="text-muted-foreground">至</span>
                            <DatePicker
                                value={localFilters.dateTo ? new Date(localFilters.dateTo) : undefined}
                                onChange={(date) => setLocalFilters({
                                    ...localFilters,
                                    dateTo: date ? format(date, 'yyyy-MM-dd') : undefined
                                })}
                                placeholder="结束日期"
                                className="flex-1"
                            />
                        </div>
                    </div>

                    {/* 测量师 */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="workerId" className="text-right">
                            测量师
                        </Label>
                        <Select
                            value={localFilters.workerId || '__ALL__'}
                            onValueChange={(value) =>
                                setLocalFilters({ ...localFilters, workerId: value === '__ALL__' ? undefined : value })
                            }
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="全部" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__ALL__">全部</SelectItem>
                                {workerOptions.map((opt) => (
                                    <SelectItem key={opt.id} value={opt.id}>
                                        {opt.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 销售 */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="salesId" className="text-right">
                            销售
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
                        <Label htmlFor="channel" className="text-right">
                            渠道
                        </Label>
                        <Select
                            value={localFilters.channel || '__ALL__'}
                            onValueChange={(value) =>
                                setLocalFilters({ ...localFilters, channel: value === '__ALL__' ? undefined : value })
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

                    {/* 客户名称 */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="customerName" className="text-right">
                            客户
                        </Label>
                        <Input
                            id="customerName"
                            placeholder="输入客户名称"
                            className="col-span-3"
                            value={localFilters.customerName || ''}
                            onChange={(e) =>
                                setLocalFilters({ ...localFilters, customerName: e.target.value || undefined })
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

export default MeasurementAdvancedFilter;
