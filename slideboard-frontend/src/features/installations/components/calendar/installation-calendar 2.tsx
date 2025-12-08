'use client'

import React, { useState, useEffect, useCallback } from 'react';

import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { installationScheduleService } from '@/services/installation-schedule.client';
import { InstallationCalendarItem } from '@/types/installation-schedule';

import InstallationCalendarDay from './installation-calendar-day';
import InstallationCalendarHeader from './installation-calendar-header';


// 日历视图类型
export type CalendarView = 'month' | 'week' | 'day';

interface InstallationCalendarProps {
  initialYear?: number;
  initialMonth?: number;
  initialDay?: number;
  initialView?: CalendarView;
  onScheduleClick?: (scheduleId: string) => void;
  onDateClick?: (date: string) => void;
}

// 拖拽状态类型
interface DragState {
  isDragging: boolean;
  scheduleId: string | null;
  originalDate: string | null;
  originalTimeSlot: { startTime: string; endTime: string } | null;
}

const InstallationCalendar: React.FC<InstallationCalendarProps> = ({
  initialYear = new Date().getFullYear(),
  initialMonth = new Date().getMonth() + 1,
  initialDay = new Date().getDate(),
  initialView = 'month',
  onScheduleClick,
  onDateClick
}) => {
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [currentDay, setCurrentDay] = useState(initialDay);
  const [currentView, setCurrentView] = useState<CalendarView>(initialView);
  const [calendarData, setCalendarData] = useState<InstallationCalendarItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 拖拽状态
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    scheduleId: null,
    originalDate: null,
    originalTimeSlot: null
  });
  

  
  // 视图切换处理
  const handleViewChange = (view: CalendarView) => {
    setCurrentView(view);
  };
  
  // 开始拖拽处理
  const handleDragStart = (scheduleId: string, date: string, startTime: string, endTime: string) => {
    setDragState({
      isDragging: true,
      scheduleId,
      originalDate: date,
      originalTimeSlot: { startTime, endTime }
    });
  };
  
  // 拖拽结束处理
  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      scheduleId: null,
      originalDate: null,
      originalTimeSlot: null
    });
  };
  
  // 拖拽进入处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  // 拖拽离开处理
  const handleDragLeave = () => {
    // 可以添加视觉反馈处理
  };
  
  // 放置处理
  const handleDrop = async (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    
    if (!dragState.isDragging || !dragState.scheduleId) {
      return;
    }
    
    try {
      // 调用服务更新安装调度
      await installationScheduleService.updateInstallationSchedule(dragState.scheduleId, {
        scheduledDate: targetDate,
        startTime: dragState.originalTimeSlot?.startTime || '',
        endTime: dragState.originalTimeSlot?.endTime || ''
      });
      
      // 重新获取日历数据
      await fetchCalendarData();
    } catch (_err) {
      setError('更新安装调度失败');
    } finally {
      // 重置拖拽状态
      handleDragEnd();
    }
  };

  // 获取日历数据
  const fetchCalendarData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await installationScheduleService.getInstallationCalendar(currentYear, currentMonth);
      setCalendarData(data);
    } catch (_err) {
      setError('获取日历数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [currentYear, currentMonth]);

  // 切换到上一个月
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(prev => prev - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  // 切换到下一个月
  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(prev => prev + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // 切换到上一周
  const handlePrevWeek = () => {
    const newDate = new Date(currentYear, currentMonth - 1, currentDay - 7);
    setCurrentYear(newDate.getFullYear());
    setCurrentMonth(newDate.getMonth() + 1);
    setCurrentDay(newDate.getDate());
  };

  // 切换到下一周
  const handleNextWeek = () => {
    const newDate = new Date(currentYear, currentMonth - 1, currentDay + 7);
    setCurrentYear(newDate.getFullYear());
    setCurrentMonth(newDate.getMonth() + 1);
    setCurrentDay(newDate.getDate());
  };

  // 切换到上一天
  const handlePrevDay = () => {
    const newDate = new Date(currentYear, currentMonth - 1, currentDay - 1);
    setCurrentYear(newDate.getFullYear());
    setCurrentMonth(newDate.getMonth() + 1);
    setCurrentDay(newDate.getDate());
  };

  // 切换到下一天
  const handleNextDay = () => {
    const newDate = new Date(currentYear, currentMonth - 1, currentDay + 1);
    setCurrentYear(newDate.getFullYear());
    setCurrentMonth(newDate.getMonth() + 1);
    setCurrentDay(newDate.getDate());
  };

  // 切换到今天
  const handleToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
    setCurrentDay(today.getDate());
  };

  // 当日期或视图变化时重新获取数据
  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData, currentView]);

  useRealtimeSubscription({
    table: 'installation_schedules',
    event: '*',
    channelName: 'installation_schedules:calendar',
    handler: () => {
      fetchCalendarData()
    }
  })

  // 渲染星期标题
  const renderWeekDays = () => {
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    return weekDays.map((day, index) => (
      <div 
        key={index} 
        className="flex items-center justify-center text-sm font-medium text-gray-500 py-2"
      >
        {day}
      </div>
    ));
  };

  // 渲染月视图
  const renderMonthView = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-7 gap-1 py-2">
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="grid grid-cols-7 gap-1 py-2">
          <div className="col-span-7 bg-red-50 text-red-600 p-4 rounded">
            {error}
          </div>
        </div>
      );
    }

    // 计算当前月第一天是星期几
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
    // 计算当前月有多少天
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    // 计算总格子数（6周，每周7天）
    const totalCells = 6 * 7;
    // 计算上个月需要显示的天数
    const prevMonthDays = firstDayOfMonth;

    // 生成日历格子
    const calendarCells = [];

    // 添加上个月的空白格子
    for (let i = 0; i < prevMonthDays; i++) {
      calendarCells.push(
        <div key={`prev-${i}`} className="aspect-square bg-gray-50 rounded" />
      );
    }

    // 添加当前月的日期格子
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = new Date(currentYear, currentMonth - 1, i).toISOString().split('T')[0];
        const calendarItem = calendarData.find(item => item.date === dateStr);
        
        calendarCells.push(
          <InstallationCalendarDay
            key={`current-${i}`}
            calendarItem={calendarItem}
            date={dateStr || ''}
            dayNumber={i}
            onScheduleClick={onScheduleClick}
            onDateClick={onDateClick}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            isDragging={dragState.isDragging}
          />
        );
      }

    // 添加下个月的空白格子
    const remainingCells = totalCells - calendarCells.length;
    for (let i = 0; i < remainingCells; i++) {
      calendarCells.push(
        <div key={`next-${i}`} className="aspect-square bg-gray-50 rounded" />
      );
    }

    return <div className="grid grid-cols-7 gap-1 py-2">{calendarCells}</div>;
  };

  // 渲染周视图
  const renderWeekView = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-7 gap-1 py-2">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="min-h-[300px] bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="grid grid-cols-7 gap-1 py-2">
          <div className="col-span-7 bg-red-50 text-red-600 p-4 rounded">
            {error}
          </div>
        </div>
      );
    }

    // 计算本周的日期范围
    const currentDateObj = new Date(currentYear, currentMonth - 1, currentDay);
    const dayOfWeek = currentDateObj.getDay();
    const startOfWeek = new Date(currentDateObj);
    startOfWeek.setDate(currentDateObj.getDate() - dayOfWeek);

    // 生成本周的7天
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const calendarItem = calendarData.find(item => item.date === dateStr);
      
      weekDays.push(
        <div 
          key={i} 
          className={`
            min-h-[300px] p-1 border border-gray-100 rounded-md bg-white
            ${dragState.isDragging ? 'bg-green-50 border-green-200' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, dateStr || '')}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {date.getDate()}
            </span>
            {calendarItem?.totalInstallations && (
              <span className="text-xs bg-gray-200 text-gray-700 rounded-full px-1.5 py-0.5">
                {calendarItem.totalInstallations}
              </span>
            )}
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[250px]">
            {calendarItem?.installations && calendarItem.installations.map((installation) => (
              <div
                key={installation.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move';
                  handleDragStart(installation.id, dateStr || '', installation.startTime || '', installation.endTime || '');
                }}
                onDragEnd={handleDragEnd}
                onClick={() => onScheduleClick?.(installation.id)}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:opacity-80 transition-opacity hover:shadow-sm hover:-translate-y-0.5 transition-all duration-150"
                title={`${installation.installationNo} - ${installation.customerName}\n${installation.startTime} - ${installation.endTime}`}
              >
                {installation.startTime} - {installation.customerName}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return <div className="grid grid-cols-7 gap-1 py-2">{weekDays}</div>;
  };

  // 渲染日视图
  const renderDayView = () => {
    if (isLoading) {
      return (
        <div className="p-2">
          <div className="min-h-[500px] bg-gray-100 rounded animate-pulse" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-2">
          <div className="bg-red-50 text-red-600 p-4 rounded">
            {error}
          </div>
        </div>
      );
    }

    const dateStr = new Date(currentYear, currentMonth - 1, currentDay).toISOString().split('T')[0];
    const calendarItem = calendarData.find(item => item.date === dateStr);

    return (
      <div className="p-2">
        <div className="min-h-[500px] p-4 border border-gray-100 rounded-md bg-white">
          <h3 className="text-lg font-semibold mb-4">{currentYear}年{currentMonth}月{currentDay}日 安装计划</h3>
          
          {calendarItem?.installations && calendarItem.installations.length > 0 ? (
            <div className="space-y-3">
              {calendarItem.installations.map((installation) => (
                <div
                  key={installation.id}
                  onClick={() => onScheduleClick?.(installation.id)}
                  className="p-3 border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-blue-700">{installation.installationNo}</span>
                    <span className="text-sm px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                      {installation.status === 'scheduled' ? '已调度' : 
                       installation.status === 'confirmed' ? '已确认' : 
                       installation.status === 'completed' ? '已完成' : '已取消'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <span className="text-sm text-gray-500">客户：</span>
                      <span className="text-sm font-medium">{installation.customerName}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">时间：</span>
                      <span className="text-sm font-medium">{installation.startTime} - {installation.endTime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-gray-500">
              当天没有安装计划
            </div>
          )}
        </div>
      </div>
    );
  };

  // 根据当前视图渲染不同的内容
  const renderCalendarContent = () => {
    switch (currentView) {
      case 'month':
        return (
          <>
            <div className="grid grid-cols-7 gap-1 border-b border-gray-200">
              {renderWeekDays()}
            </div>
            {renderMonthView()}
          </>
        );
      case 'week':
        return (
          <>
            <div className="grid grid-cols-7 gap-1 border-b border-gray-200">
              {renderWeekDays()}
            </div>
            {renderWeekView()}
          </>
        );
      case 'day':
        return renderDayView();
      default:
        return renderMonthView();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 日历头部 */}
      <InstallationCalendarHeader
        currentYear={currentYear}
        currentMonth={currentMonth}
        currentDay={currentDay}
        currentView={currentView}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onPrevDay={handlePrevDay}
        onNextDay={handleNextDay}
        onToday={handleToday}
        onViewChange={handleViewChange}
      />
      
      {/* 日历内容 */}
      {renderCalendarContent()}
    </div>
  );
};

export default InstallationCalendar;
