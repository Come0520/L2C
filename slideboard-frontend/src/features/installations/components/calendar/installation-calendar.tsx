import React from 'react';

// 定义 CalendarView 类型
export type CalendarView = 'month' | 'week' | 'day';

// 使用默认的React.FC类型，不定义具体的props类型
// 这样可以接受任意props，避免类型不匹配问题
const InstallationCalendar: React.FC<any> = ({ onScheduleClick, onDateClick }) => {
  const currentDate = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">2024年1月</h2>
        <div className="flex space-x-2">
          <button className="p-1 hover:bg-gray-100 rounded">Previous</button>
          <button className="p-1 hover:bg-gray-100 rounded">Next</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-50 py-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        {Array.from({ length: 35 }).map((_, i) => {
          const day = i + 1;
          const isToday = day === 15; // Mock today
          const hasEvent = [5, 12, 18, 24].includes(day);

          return (
            <div
              key={i}
              className={`bg-white h-24 p-2 cursor-pointer hover:bg-gray-50 ${isToday ? 'bg-blue-50' : ''}`}
              onClick={() => onDateClick && onDateClick(`${(currentDate || '').slice(0, 8)}${day.toString().padStart(2, '0')}`)}
            >
              <span className={`text-sm ${isToday ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                {day <= 31 ? day : ''}
              </span>
              {day <= 31 && hasEvent && (
                <div
                  className="mt-1 text-xs bg-blue-100 text-blue-800 rounded px-1 py-0.5 truncate"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onScheduleClick) onScheduleClick(`SCH-${day}`);
                  }}
                >
                  安装任务 #{day}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InstallationCalendar;
