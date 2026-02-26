'use client';

import React from 'react';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface FiltersBarProps {
    search: string;
    onSearchChange: (value: string) => void;
    type: string;
    onTypeChange: (value: string) => void;
    priority: string;
    onPriorityChange: (value: string) => void;
    onAdvancedFilterClick?: () => void;
    actions?: React.ReactNode;
}

export function FiltersBar({
    search,
    onSearchChange,
    type,
    onTypeChange,
    priority,
    onPriorityChange,
    onAdvancedFilterClick,
    actions
}: FiltersBarProps) {
    return (
        <DataTableToolbar
            searchProps={{
                value: search,
                onChange: onSearchChange,
                placeholder: "搜索工单号/客户姓名/手机号..."
            }}
            actions={actions}
            className="mb-4"
        >
            <div className="flex items-center gap-2">
                <Select value={type} onValueChange={onTypeChange}>
                    <SelectTrigger className="h-9 w-[120px] bg-muted/20 border-none transition-all hover:bg-muted/30">
                        <SelectValue placeholder="售后类型" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">所有类型</SelectItem>
                        <SelectItem value="REPAIR">维修 (REPAIR)</SelectItem>
                        <SelectItem value="RETURN">退货 (RETURN)</SelectItem>
                        <SelectItem value="COMPLAINT">投诉 (COMPLAINT)</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={priority} onValueChange={onPriorityChange}>
                    <SelectTrigger className="h-9 w-[120px] bg-muted/20 border-none transition-all hover:bg-muted/30">
                        <SelectValue placeholder="优先级" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">所有优先级</SelectItem>
                        <SelectItem value="HIGH">高 (HIGH)</SelectItem>
                        <SelectItem value="MEDIUM">中 (MEDIUM)</SelectItem>
                        <SelectItem value="LOW">低 (LOW)</SelectItem>
                    </SelectContent>
                </Select>

                <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={onAdvancedFilterClick}>
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    高级筛选
                </Button>
            </div>
        </DataTableToolbar>
    );
}
