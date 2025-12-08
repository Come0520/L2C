'use client'

import React from 'react';

import InstallationCalendar from '@/features/installations/components/calendar/installation-calendar';
 

const InstallationSchedulePage: React.FC = () => {
  // 处理调度点击
  const handleScheduleClick = (scheduleId: string) => {
    // 跳转到安装详情页面
    window.location.href = `/orders/installations/schedule/${scheduleId}`;
  };

  // 处理日期点击
  const handleDateClick = (_date: string) => {
    // 可以在这里添加创建新安装计划的逻辑
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">安装调度日历</h1>
          <p className="mt-1 text-sm text-gray-600">
            查看和管理所有安装调度计划
          </p>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 日历控件 */}
        <div className="mb-6">
          <InstallationCalendar
            onScheduleClick={handleScheduleClick}
            onDateClick={handleDateClick}
          />
        </div>

        {/* 今日安装概览 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">今日安装概览</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="text-sm text-blue-600 mb-1">总调度数</div>
              <div className="text-2xl font-bold text-blue-800">12</div>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
              <div className="text-sm text-green-600 mb-1">已确认</div>
              <div className="text-2xl font-bold text-green-800">8</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
              <div className="text-sm text-yellow-600 mb-1">进行中</div>
              <div className="text-2xl font-bold text-yellow-800">3</div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <div className="text-sm text-red-600 mb-1">已取消</div>
              <div className="text-2xl font-bold text-red-800">1</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallationSchedulePage;
