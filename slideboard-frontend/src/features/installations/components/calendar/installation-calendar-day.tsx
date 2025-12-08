import React from 'react';

import { InstallationCalendarItem } from '@/types/installation-schedule';

interface InstallationCalendarDayProps {
  calendarItem?: InstallationCalendarItem;
  date: string;
  dayNumber: number;
  onScheduleClick?: (scheduleId: string) => void;
  onDateClick?: (date: string) => void;
  onDragStart?: (scheduleId: string, date: string, startTime: string, endTime: string) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent, targetDate: string) => void;
  isDragging?: boolean;
}

const InstallationCalendarDay: React.FC<InstallationCalendarDayProps> = ({
  calendarItem,
  date,
  dayNumber,
  onScheduleClick,
  onDateClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragging = false
}) => {
  // 获取安装状态的样式类
  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      onClick={() => onDateClick?.(date)}
      onDragOver={(e) => onDragOver?.(e)}
      onDragLeave={() => onDragLeave?.()}
      onDrop={(e) => onDrop?.(e, date)}
      className={`
        aspect-square p-1 border rounded-md transition-all duration-200
        hover:bg-gray-50 cursor-pointer
        ${calendarItem?.isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}
        ${isDragging ? 'bg-green-50 border-green-200' : ''}
      `}
    >
      <div className="h-full flex flex-col">
        {/* 日期数字 */}
        <div className="flex items-center justify-between mb-1">
          <span
            className={`
              text-sm font-medium
              ${calendarItem?.isToday ? 'text-blue-600' : 'text-gray-700'}
              ${calendarItem?.isWeekend ? 'text-gray-400' : ''}
            `}
          >
            {dayNumber}
          </span>
          {/* 当天安装数量 */}
          {calendarItem?.totalInstallations && (
            <span className="text-xs bg-gray-200 text-gray-700 rounded-full px-1.5 py-0.5">
              {calendarItem.totalInstallations}
            </span>
          )}
        </div>

        {/* 安装列表 */}
        <div className="flex-1 overflow-hidden">
          {calendarItem?.installations && calendarItem.installations.length > 0 ? (
            <div className="space-y-1">
              {/* 只显示前3个安装 */}
              {calendarItem.installations.slice(0, 3).map((installation) => (
                <div
                  key={installation.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    onDragStart?.(installation.id, date, installation.startTime, installation.endTime);
                  }}
                  onDragEnd={() => onDragEnd?.()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onScheduleClick?.(installation.id);
                  }}
                  className={`
                    text-xs px-1.5 py-0.5 rounded cursor-pointer
                    truncate hover:opacity-80 transition-opacity
                    ${getStatusClass(installation.status)}
                    hover:shadow-sm hover:-translate-y-0.5 transition-all duration-150
                  `}
                  title={`${installation.installationNo} - ${installation.customerName}\n${installation.startTime} - ${installation.endTime}`}
                >
                  {installation.startTime}
                </div>
              ))}
              {/* 显示更多提示 */}
              {calendarItem.installations.length > 3 && (
                <div className="text-xs text-gray-500 italic">
                  +{calendarItem.installations.length - 3}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallationCalendarDay;