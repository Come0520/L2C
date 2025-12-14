import { Clock, X, Trash2 } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperInput, PaperSelect } from '@/components/ui/paper-input';
import { VanishInput } from '@/components/ui/vanish-input';
import { useLeadsFilters } from '@/features/leads/hooks/useLeadsFilters';
import { useSearchHistory } from '@/hooks/useSearchHistory';

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
    const { history, addToHistory, clearHistory, removeFromHistory } = useSearchHistory();

    // 搜索历史下拉菜单控制
    const [showHistory, setShowHistory] = useState(false);
    const searchWrapperRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭历史下拉菜单
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
                setShowHistory(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 处理搜索
    const handleSearch = (value: string) => {
        debouncedUpdate({ searchTerm: value });
        if (value.trim()) {
            addToHistory(value.trim());
        }
    };

    // 点击历史项
    const handleHistoryClick = (term: string) => {
        updateFilters({ searchTerm: term });
        setShowHistory(false);
    };

    return (
        <PaperCard>
            <PaperCardHeader>
                <PaperCardTitle>筛选</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {/* 增强的搜索框 - 带历史记录，占两列宽度 */}
                    <div className="relative lg:col-span-2" ref={searchWrapperRef}>
                        <VanishInput
                            placeholders={[
                                "搜索姓名...",
                                "支持拼音首字母 (如'zs'匹配'张三')",
                                "输入电话、地址..."
                            ]}
                            value={filters.searchTerm}
                            onChange={(value) => handleSearch(value)}
                            onFocus={() => history.length > 0 && setShowHistory(true)}
                        />

                        {/* 搜索历史下拉菜单 */}
                        {showHistory && history.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 z-50
                                          bg-white border border-gray-200 rounded-lg shadow-lg
                                          max-h-60 overflow-y-auto">
                                <div className="p-2 border-b border-gray-100 flex items-center justify-between">
                                    <span className="text-xs text-gray-500">搜索历史</span>
                                    <button
                                        onClick={() => {
                                            clearHistory();
                                            setShowHistory(false);
                                        }}
                                        className="text-xs text-red-600 hover:text-red-700 flex items-center"
                                    >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        清空
                                    </button>
                                </div>
                                {history.map((term, index) => (
                                    <div
                                        key={index}
                                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer
                                                 flex items-center justify-between group"
                                    >
                                        <div
                                            onClick={() => handleHistoryClick(term)}
                                            className="flex-1 flex items-center"
                                        >
                                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                            <span className="text-sm text-gray-700">{term}</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFromHistory(term);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity
                                                     text-gray-400 hover:text-red-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <PaperSelect
                        id="filter-status"
                        label="状态"
                        options={STATUS_OPTIONS}
                        value={filters.status}
                        onChange={(e) => updateFilters({ status: e.target.value })}
                    />
                    <PaperSelect
                        id="filter-tag"
                        label="标签"
                        options={TAG_OPTIONS}
                        value={filters.tag}
                        onChange={(e) => updateFilters({ tag: e.target.value })}
                    />
                    <PaperSelect
                        id="filter-level"
                        label="客户等级"
                        options={LEVEL_OPTIONS}
                        value={filters.level}
                        onChange={(e) => updateFilters({ level: e.target.value })}
                    />
                    <PaperInput
                        id="filter-source"
                        label="来源渠道"
                        placeholder="门店/渠道/线上"
                        defaultValue={filters.source}
                        onChange={(e) => debouncedUpdate({ source: e.target.value })}
                    />
                    <PaperInput
                        id="filter-owner"
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
                        id="filter-date-start"
                        label="开始日期"
                        type="date"
                        defaultValue={filters.dateStart}
                        onChange={(e) => updateFilters({ dateStart: e.target.value })}
                    />
                    <PaperInput
                        id="filter-date-end"
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
