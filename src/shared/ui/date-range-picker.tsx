"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { zhCN } from "date-fns/locale"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Calendar } from "@/shared/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/shared/ui/popover"

export interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
    date?: DateRange
    setDate?: (date?: DateRange) => void
}

export function DatePickerWithRange({
    className,
    date,
    setDate,
}: DatePickerWithRangeProps) {
    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal bg-muted/20 border-white/10 h-9",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "yyyy-MM-dd", { locale: zhCN })} -{" "}
                                    {format(date.to, "yyyy-MM-dd", { locale: zhCN })}
                                </>
                            ) : (
                                format(date.from, "yyyy-MM-dd", { locale: zhCN })
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
                        onSelect={setDate}
                        numberOfMonths={2}
                        locale={zhCN}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
