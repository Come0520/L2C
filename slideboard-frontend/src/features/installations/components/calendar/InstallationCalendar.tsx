import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { installationScheduleService } from '@/services/installation-schedule.client';

// 定义 CalendarView 类型
export type CalendarView = 'month' | 'week' | 'day';

// 定义安装任务类型
interface Installation {
  id: string;
  installationNo: string;
  customerName: string;
  startTime: string;
  endTime: string;
  status: string;
}

// 定义日历项类型
interface CalendarItem {
  date: string;
  installations: Installation[];
  totalInstallations: number;
}

// 定义组件 props 类型
interface InstallationCalendarProps {
  initialYear?: number;
  initialMonth?: number;
  initialDay?: number;
  initialView?: CalendarView;
  onScheduleClick?: (id: string) => void;
  onDateClick?: (date: string) => void;
}

const InstallationCalendar: React.FC<InstallationCalendarProps> = ({
  initialYear,
  initialMonth,
  initialDay,
  initialView = 'month',
  onScheduleClick,
  onDateClick
}) => {
  // 初始化当前日期
  const initialDate = initialYear && initialMonth && initialDay 
    ? new Date(initialYear, initialMonth - 1, initialDay)
    : new Date();

  // 状态管理
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [view, setView] = useState<CalendarView>(initialView);
  const [calendarData, setCalendarData] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draggingScheduleId, setDraggingScheduleId] = useState<string | null>(null);

  // 获取日历数据
  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const data = await installationScheduleService.getInstallationCalendar(year, month);
      setCalendarData(data);
      setErrorMessage(null);
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
      setErrorMessage('获取日历数据失败');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  // 初始加载数据
  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // 视图切换处理
  const handleViewChange = useCallback((newView: CalendarView) => {
    setView(newView);
    fetchCalendarData();
  }, [fetchCalendarData]);

  // 导航处理
  const handlePrev = useCallback(() => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  }, [currentDate, view]);

  const handleNext = useCallback(() => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  }, [currentDate, view]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // 拖拽处理
  const handleDragStart = useCallback((e: React.DragEvent, scheduleId: string) => {
    e.dataTransfer.setData('text/plain', scheduleId);
    setDraggingScheduleId(scheduleId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingScheduleId(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    const scheduleId = e.dataTransfer.getData('text/plain');
    if (!scheduleId) return;

    try {
      await installationScheduleService.updateInstallationSchedule(scheduleId, {
        scheduledDate: targetDate
      });
      // 重新获取数据
      fetchCalendarData();
      setErrorMessage(null);
    } catch (error) {
      console.error('Failed to update installation schedule:', error);
      setErrorMessage('更新安装调度失败');
    } finally {
      setDraggingScheduleId(null);
    }
  }, [fetchCalendarData]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // 渲染错误信息
  const renderErrorMessage = () => {
    if (!errorMessage) return null;

    return (
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
        {errorMessage}
      </div>
    );
  };

  // 根据状态获取颜色类
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // 根据状态获取中文显示
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'processing':
        return '进行中';
      case 'pending':
        return '待处理';
      case 'canceled':
        return '已取消';
      default:
        return status;
    }
  };

  // 渲染日期标题
  const renderDateTitle = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();

    if (view === 'month') {
      return `${year}年${month}月`;
    } else if (view === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${year}年${startOfWeek.getMonth() + 1}月${startOfWeek.getDate()}日 - ${endOfWeek.getMonth() + 1}月${endOfWeek.getDate()}日`;
    } else {
      return `${year}年${month}月${day}日`;
    }
  }, [currentDate, view]);

  // 渲染视图切换按钮
  const renderViewButtons = () => {
    return (
      <div className="flex space-x-2">
        <button
          className={`px-3 py-1 rounded-md text-sm ${view === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          onClick={() => handleViewChange('month')}
        >
          月视图
        </button>
        <button
          className={`px-3 py-1 rounded-md text-sm ${view === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          onClick={() => handleViewChange('week')}
        >
          周视图
        </button>
        <button
          className={`px-3 py-1 rounded-md text-sm ${view === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          onClick={() => handleViewChange('day')}
        >
          日视图
        </button>
      </div>
    );
  };

  // 渲染导航按钮
  const renderNavigationButtons = () => {
    return (
      <div className="flex space-x-2">
        <button
          className="px-3 py-1 rounded-md text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
          onClick={handlePrev}
        >
          上一个周期
        </button>
        <button
          className="px-3 py-1 rounded-md text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
          onClick={handleNext}
        >
          下一个周期
        </button>
        <button
          className="px-3 py-1 rounded-md text-sm bg-blue-500 text-white hover:bg-blue-600"
          onClick={handleToday}
        >
          今天
        </button>
      </div>
    );
  };

  // 渲染安装任务
  const renderInstallation = useCallback((installation: Installation) => {
    const isDragging = draggingScheduleId === installation.id;
    const statusColorClass = getStatusColorClass(installation.status);
    const statusLabel = getStatusLabel(installation.status);

    return (
      <div
        key={installation.id}
        className={`mt-1 text-xs rounded px-1 py-0.5 truncate cursor-move transition-opacity ${statusColorClass} ${isDragging ? 'opacity-50' : ''}`}
        draggable
        onDragStart={(e) => handleDragStart(e, installation.id)}
        onDragEnd={handleDragEnd}
        onClick={() => onScheduleClick && onScheduleClick(installation.id)}
      >
        <div className="font-semibold">{installation.installationNo}</div>
        <div>
          <span>{installation.startTime} - {installation.customerName}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium">{statusLabel}</span>
          <span>{installation.startTime} - {installation.endTime}</span>
        </div>
      </div>
    );
  }, [draggingScheduleId, getStatusColorClass, getStatusLabel, handleDragStart, handleDragEnd, onScheduleClick]);

  // 渲染月视图
  const renderMonthView = () => {
    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="bg-gray-50 py-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        {calendarData.map((item) => {
          const date = new Date(item.date);
          const day = date.getDate();
          const isToday = new Date().toDateString() === date.toDateString();
          const hasInstallations = item.totalInstallations > 0;

          return (
            <div
              key={item.date}
              className={`bg-white h-24 p-2 cursor-pointer hover:bg-gray-50 ${isToday ? 'bg-blue-50' : ''} ${draggingScheduleId ? 'border-2 border-dashed border-blue-300' : ''}`}
              onClick={() => onDateClick && onDateClick(item.date)}
              onDrop={(e) => handleDrop(e, item.date)}
              onDragOver={handleDragOver}
            >
              <span className={`text-sm ${isToday ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                {day}
              </span>
              {hasInstallations && item.installations.map(renderInstallation)}
            </div>
          );
        })}
      </div>
    );
  };

  // 渲染周视图
  const renderWeekView = () => {
    // 获取当前周的日期范围
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    // 生成当前周的7天
    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }
    
    // 根据日期查找对应的安装任务
    const getInstallationsForDate = (date: Date): CalendarItem => {
      const dateStr = date.toISOString().split('T')[0] as string;
      const dayData = calendarData.find(item => item.date === dateStr);
      return dayData || { date: dateStr, installations: [], totalInstallations: 0 };
    };

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['日', '一', '二', '三', '四', '五', '六'].map((dayName, index) => {
          const date = weekDays[index];
          if (!date) return null;
          const dayData = getInstallationsForDate(date);
          const day = date.getDate();
          const isToday = new Date().toDateString() === date.toDateString();
          const hasInstallations = dayData.totalInstallations > 0;
          
          return (
            <div
              key={date.toISOString()}
              className={`bg-white h-24 p-2 cursor-pointer hover:bg-gray-50 ${isToday ? 'bg-blue-50' : ''} ${draggingScheduleId ? 'border-2 border-dashed border-blue-300' : ''}`}
              onClick={() => onDateClick && onDateClick(dayData.date)}
              onDrop={(e) => handleDrop(e, dayData.date)}
              onDragOver={handleDragOver}
            >
              <div className="text-sm">
                <span className={`${isToday ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                  {day}
                </span>
              </div>
              {hasInstallations && dayData.installations.map(renderInstallation)}
            </div>
          );
        })}
      </div>
    );
  };

  // 渲染日视图
  const renderDayView = () => {
    const currentDateStr = currentDate.toISOString().split('T')[0];
    const dayData = calendarData.find(item => item.date === currentDateStr) || {
      date: currentDateStr,
      installations: [],
      totalInstallations: 0
    };

    return (
      <div className="bg-white rounded-md shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">{currentDate.toLocaleDateString()}</h3>
          <p className="text-sm text-gray-500">共 {dayData.totalInstallations} 个安装任务</p>
        </div>
        <div className="divide-y">
          {dayData.installations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              当日没有安装任务
            </div>
          ) : (
            dayData.installations.map((installation) => (
              <div
                key={installation.id}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => onScheduleClick && onScheduleClick(installation.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 text-sm font-medium">
                      {installation.startTime} - {installation.endTime}
                    </div>
                    <div>
                      <div className="font-semibold">{installation.installationNo}</div>
                      <div className="flex items-center space-x-4">
                        <span>{installation.customerName}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${getStatusColorClass(installation.status)}`}>
                          {getStatusLabel(installation.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // 渲染日历内容
  const renderCalendarContent = () => {
    if (loading) {
      return <div className="text-center py-4">加载中...</div>;
    }

    switch (view) {
      case 'month':
        return renderMonthView();
      case 'week':
        return renderWeekView();
      case 'day':
        return renderDayView();
      default:
        return renderMonthView();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {renderDateTitle}
        </h2>
        {renderNavigationButtons()}
      </div>
      
      <div className="flex justify-end mb-4">
        {renderViewButtons()}
      </div>
      
      {renderErrorMessage()}
      
      {renderCalendarContent()}
    </div>
  );
};

export default InstallationCalendar;
