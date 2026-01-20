'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import Filter from 'lucide-react/dist/esm/icons/filter';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ChannelPicker } from '@/features/channels/components/channel-picker';

interface LeadsAdvancedFilterProps {
    tenantId: string;
    salesList?: Array<{ id: string; name: string }>;
}

// 状态选项
const STATUS_OPTIONS = [
    { value: 'PENDING_ASSIGNMENT', label: '待分配' },
    { value: 'PENDING_FOLLOWUP', label: '待跟进' },
    { value: 'FOLLOWING_UP', label: '跟进中' },
    { value: 'WON', label: '已成交' },
    { value: 'VOID', label: '已作废' },
];

// 意向等级选项
const INTENTION_OPTIONS = [
    { value: 'HIGH', label: '高意向' },
    { value: 'MEDIUM', label: '中意向' },
    { value: 'LOW', label: '低意向' },
];

// 标签选项
const TAG_OPTIONS = [
    { value: 'INVITED', label: '已邀约' },
    { value: 'QUOTED', label: '已报价' },
    { value: 'VISITED', label: '已到店' },
    { value: 'MEASURED', label: '已测量' },
];

export function LeadsAdvancedFilter({ tenantId, salesList = [] }: LeadsAdvancedFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [open, setOpen] = useState(false);

    // 筛选状态
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        intentionLevel: searchParams.get('intentionLevel') || '',
        channelId: searchParams.get('channelId') || '',
        salesId: searchParams.get('salesId') || '',
        status: searchParams.get('status') || '',
        tags: searchParams.get('tags') || '',
        dateFrom: searchParams.get('dateFrom') || '',
        dateTo: searchParams.get('dateTo') || '',
    });

    // 弹窗打开时同步 URL 参数到状态
    const syncFiltersFromUrl = () => {
        setFilters({
            search: searchParams.get('search') || '',
            intentionLevel: searchParams.get('intentionLevel') || '',
            channelId: searchParams.get('channelId') || '',
            salesId: searchParams.get('salesId') || '',
            status: searchParams.get('status') || '',
            tags: searchParams.get('tags') || '',
            dateFrom: searchParams.get('dateFrom') || '',
            dateTo: searchParams.get('dateTo') || '',
        });
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            syncFiltersFromUrl();
        }
        setOpen(isOpen);
    };

    const handleApply = () => {
        const params = new URLSearchParams(searchParams.toString());

        // 搜索
        if (filters.search) {
            params.set('search', filters.search);
        } else {
            params.delete('search');
        }

        // 意向等级
        if (filters.intentionLevel && filters.intentionLevel !== 'ALL') {
            params.set('intentionLevel', filters.intentionLevel);
        } else {
            params.delete('intentionLevel');
        }

        // 渠道
        if (filters.channelId) {
            params.set('channelId', filters.channelId);
        } else {
            params.delete('channelId');
        }

        // 归属销售
        if (filters.salesId && filters.salesId !== 'ALL') {
            params.set('salesId', filters.salesId);
        } else {
            params.delete('salesId');
        }

        // 状态
        if (filters.status && filters.status !== 'ALL') {
            params.set('status', filters.status);
        } else {
            params.delete('status');
        }

        // 标签
        if (filters.tags && filters.tags !== 'ALL') {
            params.set('tags', filters.tags);
        } else {
            params.delete('tags');
        }

        // 日期范围
        if (filters.dateFrom) {
            params.set('dateFrom', filters.dateFrom);
        } else {
            params.delete('dateFrom');
        }
        if (filters.dateTo) {
            params.set('dateTo', filters.dateTo);
        } else {
            params.delete('dateTo');
        }

        params.set('page', '1');
        router.push(`?${params.toString()}`);
        setOpen(false);
    };

    const handleReset = () => {
        setFilters({
            search: '',
            intentionLevel: '',
            channelId: '',
            salesId: '',
            status: '',
            tags: '',
            dateFrom: '',
            dateTo: '',
        });
        const params = new URLSearchParams();
        params.set('page', '1');
        router.push(`?${params.toString()}`);
        setOpen(false);
    };

    // 计算激活的筛选数量
    const activeFilterCount = Object.values(filters).filter(v => v && v !== 'ALL').length;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    高级筛选
                    {activeFilterCount > 0 && (
                        <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                            {activeFilterCount}
                        </span>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>高级筛选</DialogTitle>
                    <DialogDescription>
                        多维度筛选线索数据
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* 搜索框 */}
                    <div className="grid gap-2">
                        <Label>搜索</Label>
                        <Input
                            placeholder="客户姓名/电话/楼盘"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                    </div>

                    {/* 时间范围 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>开始日期</Label>
                            <Input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>结束日期</Label>
                            <Input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* 状态 */}
                    <div className="grid gap-2">
                        <Label>状态</Label>
                        <Select
                            value={filters.status || 'ALL'}
                            onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="全部状态" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">全部状态</SelectItem>
                                {STATUS_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 意向等级 */}
                    <div className="grid gap-2">
                        <Label>意向等级</Label>
                        <Select
                            value={filters.intentionLevel || 'ALL'}
                            onValueChange={(v) => setFilters(prev => ({ ...prev, intentionLevel: v }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="全部" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">全部</SelectItem>
                                {INTENTION_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 来源渠道 */}
                    <div className="grid gap-2">
                        <Label>来源渠道</Label>
                        <ChannelPicker
                            tenantId={tenantId}
                            value={filters.channelId}
                            onChange={(v) => setFilters(prev => ({ ...prev, channelId: v }))}
                            placeholder="选择渠道"
                        />
                    </div>

                    {/* 归属销售 */}
                    <div className="grid gap-2">
                        <Label>归属销售</Label>
                        <Select
                            value={filters.salesId || 'ALL'}
                            onValueChange={(v) => setFilters(prev => ({ ...prev, salesId: v }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="全部销售" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">全部销售</SelectItem>
                                <SelectItem value="UNASSIGNED">未分配</SelectItem>
                                {salesList.map(sales => (
                                    <SelectItem key={sales.id} value={sales.id}>{sales.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 标签 */}
                    <div className="grid gap-2">
                        <Label>标签</Label>
                        <Select
                            value={filters.tags || 'ALL'}
                            onValueChange={(v) => setFilters(prev => ({ ...prev, tags: v }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="全部标签" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">全部标签</SelectItem>
                                {TAG_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <div className="flex w-full justify-between">
                        <Button variant="ghost" onClick={handleReset}>重置</Button>
                        <Button onClick={handleApply}>应用筛选</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
