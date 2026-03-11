'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { zhCN } from 'date-fns/locale';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

export interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
  date?: DateRange;
  setDate?: (date?: DateRange) => void;
  /** 最大允许跨度的天数 */
  maxSpanDays?: number;
  /** 最大可选日期 */
  maxDate?: Date;
  /** 表单所需唯一 id */
  id?: string;
}

export function DatePickerWithRange({
  className,
  date,
  setDate,
  maxSpanDays,
  maxDate,
  id,
}: DatePickerWithRangeProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth <= 640);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 自定义 disabled 逻辑（合并 maxDate）
  const isDateDisabled = (day: Date) => {
    if (maxDate && day > maxDate) return true;
    return false;
  };

  // 拦截并校验日期选择
  const handleSelect = (newDate: DateRange | undefined) => {
    if (maxSpanDays && newDate?.from && newDate?.to) {
      const diffTime = Math.abs(newDate.to.getTime() - newDate.from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      // 超出跨度时，截断 to 日期为从 from 开始的 maxSpanDays 之后
      if (diffDays > maxSpanDays) {
        const adjustedTo = new Date(newDate.from);
        adjustedTo.setDate(adjustedTo.getDate() + maxSpanDays - 1);
        setDate?.({ from: newDate.from, to: adjustedTo });
        return;
      }
    }
    setDate?.(newDate);
  };
  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant={'outline'}
            className={cn(
              'bg-muted/20 h-9 w-full justify-start border-white/10 text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'yyyy-MM-dd', { locale: zhCN })} -{' '}
                  {format(date.to, 'yyyy-MM-dd', { locale: zhCN })}
                </>
              ) : (
                format(date.from, 'yyyy-MM-dd', { locale: zhCN })
              )
            ) : (
              <span>选择日期范围</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={isMobile ? 1 : 2}
            disabled={isDateDisabled}
            locale={zhCN}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
