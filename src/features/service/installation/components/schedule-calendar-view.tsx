'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';

/**
 * 安装日程日历视图
 * 
 * 提供月度维度的安装任务分布展示。
 * 注意：目前处于系统恢复模式，日历视图仅提供基础排期展示，高级拖拽功能暂不可用。
 */
export function ScheduleCalendarView() {
    const [currentDate, setCurrentDate] = useState(() => new Date());

    // 使用 useCallback 稳定月份切换回调
    const handlePrevMonth = useCallback(() => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
    }, []);

    const handleNextMonth = useCallback(() => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
    }, []);

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>安装日程排期</CardTitle>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                        {currentDate.toLocaleDateString('zh-CN', { month: 'long', year: 'numeric' })}
                    </span>
                    <Button variant="outline" size="icon" onClick={handleNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden border">
                    {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map(day => (
                        <div key={day} className="bg-background py-2 text-center text-xs font-medium text-muted-foreground">
                            {day}
                        </div>
                    ))}
                    {Array.from({ length: 35 }).map((_, i) => (
                        <div key={i} className="bg-background min-h-[100px] p-2 border-t border-l first:border-l-0">
                            <span className="text-xs text-muted-foreground">{i + 1}</span>
                            <div className="mt-2 space-y-1">
                                {i === 15 && (
                                    <div className="text-[10px] bg-primary/10 text-primary p-1 rounded">
                                        安装任务 #123
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                    系统恢复模式下日历视图已简化。
                </div>
            </CardContent>
        </Card>
    );
}
