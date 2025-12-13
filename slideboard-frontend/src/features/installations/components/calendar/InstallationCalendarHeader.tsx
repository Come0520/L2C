import React from 'react';

import { CalendarView } from './installation-calendar';

interface InstallationCalendarHeaderProps {
  currentYear: number;
  currentMonth: number;
  currentDay?: number;
  currentView: CalendarView;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onViewChange: (view: CalendarView) => void;
}

const InstallationCalendarHeader: React.FC<InstallationCalendarHeaderProps> = ({
  currentYear,
  currentMonth,
  currentDay = 1,
  currentView,
  onPrevMonth,
  onNextMonth,
  onPrevWeek,
  onNextWeek,
  onPrevDay,
  onNextDay,
  onToday,
  onViewChange
}) => {
  // 获取月份名称
  const getMonthName = (month: number): string => {
    const monthNames = [
      '一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月'
    ];
    return monthNames[month - 1] || '';
  };

  // 获取当前日期显示文本
  const getCurrentDateText = (): string => {
    switch (currentView) {
      case 'month':
        return `${currentYear}年 ${getMonthName(currentMonth)}`;
      case 'week':
        // 这里简化处理，实际应该计算本周的起始和结束日期
        return `${currentYear}年 ${getMonthName(currentMonth)} 第${Math.ceil(currentDay / 7)}周`;
      case 'day':
        return `${currentYear}年 ${getMonthName(currentMonth)} ${currentDay}日`;
      default:
        return `${currentYear}年 ${getMonthName(currentMonth)}`;
    }
  };

  // 获取导航按钮事件
  const getNavButtonHandlers = () => {
    switch (currentView) {
      case 'month':
        return { prev: onPrevMonth, next: onNextMonth };
      case 'week':
        return { prev: onPrevWeek, next: onNextWeek };
      case 'day':
        return { prev: onPrevDay, next: onNextDay };
      default:
        return { prev: onPrevMonth, next: onNextMonth };
    }
  };

  const navHandlers = getNavButtonHandlers();

  return (
    <div className="bg-white p-3 border-b border-gray-200">
      <div className="flex flex-col space-y-3">
        {/* 日期显示和导航按钮 */}
        <div className="flex items-center justify-between">
          {/* 日期显示 */}
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {getCurrentDateText()}
            </h2>
          </div>

          {/* 导航按钮 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onToday}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              今天
            </button>
            <button
              onClick={navHandlers.prev}
              className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              aria-label="上一个周期"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={navHandlers.next}
              className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              aria-label="下一个周期"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* 视图切换按钮 */}
        <div className="flex items-center space-x-1 justify-center">
          <button
            onClick={() => onViewChange('month')}
            className={`
              px-4 py-1.5 text-sm font-medium rounded-md transition-colors
              ${currentView === 'month' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
            `}
          >
            月视图
          </button>
          <button
            onClick={() => onViewChange('week')}
            className={`
              px-4 py-1.5 text-sm font-medium rounded-md transition-colors
              ${currentView === 'week' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
            `}
          >
            周视图
          </button>
          <button
            onClick={() => onViewChange('day')}
            className={`
              px-4 py-1.5 text-sm font-medium rounded-md transition-colors
              ${currentView === 'day' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
            `}
          >
            日视图
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallationCalendarHeader;