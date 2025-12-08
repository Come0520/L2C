import React, { useCallback, useMemo } from 'react'

import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'
import { PaperInput, PaperSelect } from '@/components/ui/paper-input'
import { LeadItem } from '@/types/lead'
import { debounce } from '@/utils/debounce-throttle'

type LeadTag = LeadItem['businessTags'][number]

interface LeadFiltersProps {
    searchTerm: string
    setSearchTerm: (value: string) => void
    status: string
    setStatus: (value: string) => void
    tag: LeadTag | ''
    setTag: (value: LeadTag | '') => void
    level: string
    setLevel: (value: string) => void
    source: string
    setSource: (value: string) => void
    owner: string
    setOwner: (value: string) => void
    designer: string
    setDesigner: (value: string) => void
    shoppingGuide: string
    setShoppingGuide: (value: string) => void
    dateStart: string
    setDateStart: (value: string) => void
    dateEnd: string
    setDateEnd: (value: string) => void
}

export function LeadFilters({
    searchTerm, setSearchTerm,
    status, setStatus,
    tag, setTag,
    level, setLevel,
    source, setSource,
    owner, setOwner,
    designer, setDesigner,
    shoppingGuide, setShoppingGuide,
    dateStart, setDateStart,
    dateEnd, setDateEnd
}: LeadFiltersProps) {
    // 防抖处理搜索输入，延迟300ms执行
    const debouncedSearch = useMemo(
        () => debounce((value: string) => {
            setSearchTerm(value);
        }, 300),
        [setSearchTerm]
    );

    // 直接创建各个筛选条件的防抖处理函数
    const debouncedSetStatus = useMemo(
        () => debounce((value: string) => {
            setStatus(value);
        }, 200),
        [setStatus]
    );

    const debouncedSetTag = useMemo(
        () => debounce((value: LeadTag | "") => {
            setTag(value);
        }, 200),
        [setTag]
    );

    const debouncedSetLevel = useMemo(
        () => debounce((value: string) => {
            setLevel(value);
        }, 200),
        [setLevel]
    );

    const debouncedSetSource = useMemo(
        () => debounce((value: string) => {
            setSource(value);
        }, 200),
        [setSource]
    );

    const debouncedSetOwner = useMemo(
        () => debounce((value: string) => {
            setOwner(value);
        }, 200),
        [setOwner]
    );

    const debouncedSetDesigner = useMemo(
        () => debounce((value: string) => {
            setDesigner(value);
        }, 200),
        [setDesigner]
    );

    const debouncedSetShoppingGuide = useMemo(
        () => debounce((value: string) => {
            setShoppingGuide(value);
        }, 200),
        [setShoppingGuide]
    );

    const debouncedSetDateStart = useCallback(
        debounce((value: string) => {
            setDateStart(value);
        }, 200),
        [setDateStart]
    );

    const debouncedSetDateEnd = useCallback(
        debounce((value: string) => {
            setDateEnd(value);
        }, 200),
        [setDateEnd]
    );
    const statusOptions = [
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
    ]

    const tagOptions = [
        { value: '', label: '全部' },
        { value: 'quoted', label: '已报价' },
        { value: 'arrived', label: '已到店' },
        { value: 'appointment', label: '预约到店' },
        { value: 'high-intent', label: '高意向' },
        { value: 'measured', label: '已测量' },
    ]

    const levelOptions = [
        { value: '', label: '全部' },
        { value: 'A', label: 'A级' },
        { value: 'B', label: 'B级' },
        { value: 'C', label: 'C级' },
        { value: 'D', label: 'D级' },
    ]

    return (
        <PaperCard>
            <PaperCardHeader>
                <PaperCardTitle>筛选</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <PaperInput label="搜索" placeholder="姓名/需求" value={searchTerm} onChange={(e) => debouncedSearch(e.target.value)} />
                    <PaperSelect label="状态" options={statusOptions} value={status} onChange={(e) => debouncedSetStatus(e.target.value)} />
                    <PaperSelect label="标签" options={tagOptions} value={tag} onChange={(e) => debouncedSetTag(e.target.value as LeadTag | '')} />
                    <PaperSelect label="客户等级" options={levelOptions} value={level} onChange={(e) => debouncedSetLevel(e.target.value)} />
                    <PaperInput label="来源渠道" placeholder="门店/渠道/线上" value={source} onChange={(e) => debouncedSetSource(e.target.value)} />
                    <PaperInput label="归属" placeholder="门店/成员" value={owner} onChange={(e) => debouncedSetOwner(e.target.value)} />
                    <PaperInput label="设计师" placeholder="设计师姓名" value={designer} onChange={(e) => debouncedSetDesigner(e.target.value)} />
                    <PaperInput label="导购" placeholder="导购姓名" value={shoppingGuide} onChange={(e) => debouncedSetShoppingGuide(e.target.value)} />
                    <PaperInput label="开始日期" type="date" value={dateStart} onChange={(e) => debouncedSetDateStart(e.target.value)} />
                    <PaperInput label="结束日期" type="date" value={dateEnd} onChange={(e) => debouncedSetDateEnd(e.target.value)} />
                </div>
            </PaperCardContent>
        </PaperCard>
    )
}
