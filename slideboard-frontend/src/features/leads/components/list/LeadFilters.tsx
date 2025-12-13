import React, { useMemo } from 'react';

import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperInput, PaperSelect } from '@/components/ui/paper-input';
import { useLeadsFilters } from '@/features/leads/hooks/useLeadsFilters';

// Options remain static, so we can define them outside component or in a constants file
const STATUS_OPTIONS = [
    { value: '', label: '全部' },
    { value: 'PENDING_ASSIGNMENT', label: '待分配' },
    { value: 'PENDING_FOLLOW_UP', label: '待跟踪' },
    { value: 'FOLLOWING_UP', label: '跟踪中' },
    { value: 'DRAFT_SIGNED', label: '草签' },
    { value: 'PENDING_MEASUREMENT', label: '待测量' },
    { value: 'MEASURING_PENDING_ASSIGNMENT', label: '测量中-待分配' },
    { value: 'MEASURING_ASSIGNING', label: '测量中-分配中' },
    { value: 'MEASURING_PENDING_VISIT', label: '测量中-待上门' },
    { value: 'MEASURING_PENDING_CONFIRMATION', label: '测量中-待确认' },
    { value: 'PLAN_PENDING_CONFIRMATION', label: '方案待确认' },
    { value: 'PENDING_PUSH', label: '待推单' },
    { value: 'PENDING_ORDER', label: '待下单' },
    { value: 'IN_PRODUCTION', label: '生产中' },
    { value: 'STOCK_PREPARED', label: '备货完成' },
    { value: 'PENDING_SHIPMENT', label: '待发货' },
    { value: 'EXPIRED', label: '已失效' },
    { value: 'CANCELLED', label: '已取消' },
];

const TAG_OPTIONS = [
    { value: '', label: '全部' },
    { value: 'quoted', label: '已报价' },
    { value: 'arrived', label: '已到店' },
    { value: 'appointment', label: '预约到店' },
    { value: 'high-intent', label: '高意向' },
    { value: 'measured', label: '已测量' },
];

const LEVEL_OPTIONS = [
    { value: '', label: '全部' },
    { value: 'A', label: 'A级' },
    { value: 'B', label: 'B级' },
    { value: 'C', label: 'C级' },
    { value: 'D', label: 'D级' },
];

export function LeadFilters() {
    const { filters, debouncedUpdate, updateFilters } = useLeadsFilters();

    // Local state handling for inputs to allow smooth typing is handled by debouncedUpdate
    // However, for controlled inputs we might want to sync with `filters` or keep local state.
    // Given the previous implementation used debounced callbacks directly on onChange,
    // we can adapt that pattern but using our hook's debouncedUpdate.

    return (
        <PaperCard>
            <PaperCardHeader>
                <PaperCardTitle>筛选</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <PaperInput
                        label="搜索"
                        placeholder="姓名/需求"
                        defaultValue={filters.searchTerm}
                        onChange={(e) => debouncedUpdate({ searchTerm: e.target.value })}
                    />
                    <PaperSelect
                        label="状态"
                        options={STATUS_OPTIONS}
                        value={filters.status}
                        onChange={(e) => updateFilters({ status: e.target.value })}
                    />
                    <PaperSelect
                        label="标签"
                        options={TAG_OPTIONS}
                        value={filters.tag}
                        onChange={(e) => updateFilters({ tag: e.target.value })}
                    />
                    <PaperSelect
                        label="客户等级"
                        options={LEVEL_OPTIONS}
                        value={filters.level}
                        onChange={(e) => updateFilters({ level: e.target.value })}
                    />
                    <PaperInput
                        label="来源渠道"
                        placeholder="门店/渠道/线上"
                        defaultValue={filters.source}
                        onChange={(e) => debouncedUpdate({ source: e.target.value })}
                    />
                    <PaperInput
                        label="归属"
                        placeholder="门店/成员"
                        defaultValue={filters.owner}
                        onChange={(e) => debouncedUpdate({ owner: e.target.value })}
                    />
                    {/* Note: Designer and ShoppingGuide were not in the hook's filter state initially,
                        assuming they map to specific backend filters or we need to add them.
                        For now, keeping them aligned with the hook structure.
                        If needed, we should add them to LeadFiltersState.
                    */}
                    <PaperInput
                        label="开始日期"
                        type="date"
                        defaultValue={filters.dateStart}
                        onChange={(e) => updateFilters({ dateStart: e.target.value })}
                    />
                    <PaperInput
                        label="结束日期"
                        type="date"
                        defaultValue={filters.dateEnd}
                        onChange={(e) => updateFilters({ dateEnd: e.target.value })}
                    />
                </div>
            </PaperCardContent>
        </PaperCard>
    );
}
