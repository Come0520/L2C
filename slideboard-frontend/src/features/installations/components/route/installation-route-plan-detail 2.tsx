import React from 'react';

import { InstallationRoutePlan } from '@/types/installation-schedule';

interface InstallationRoutePlanDetailProps {
  plan: InstallationRoutePlan;
  onBack?: () => void;
  onEditPlan?: (planId: string) => void;
}

const InstallationRoutePlanDetail: React.FC<InstallationRoutePlanDetailProps> = ({
  plan,
  onBack,
  onEditPlan
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-600"
                aria-label="返回"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h3 className="text-lg font-semibold text-gray-800">安装路线规划详情</h3>
          </div>
          {onEditPlan && (
            <button
              onClick={() => onEditPlan(plan.id)}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
            >
              编辑
            </button>
          )}
        </div>
      </div>

      {/* 基本信息 */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">规划日期</div>
            <div className="text-base font-medium text-gray-900">{plan.date}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">安装人员</div>
            <div className="text-base font-medium text-gray-900">{plan.installerName}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">安装点数量</div>
            <div className="text-base font-medium text-gray-900">{plan.installations.length} 个</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">总行程</div>
            <div className="text-base font-medium text-gray-900">{plan.totalTravelDistance} km</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">总时间</div>
            <div className="text-base font-medium text-gray-900">{plan.totalTravelTime} 分钟</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">预计时间段</div>
            <div className="text-base font-medium text-gray-900">{plan.estimatedStartTime} - {plan.estimatedEndTime}</div>
          </div>
        </div>
      </div>

      {/* 路线图 */}
      <div className="p-4 border-b border-gray-200">
        <div className="text-sm font-medium text-gray-800 mb-2">路线图</div>
        <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
          <div className="text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p>路线图将显示在这里</p>
            <p className="text-xs mt-1">可集成高德地图或百度地图API</p>
          </div>
        </div>
      </div>

      {/* 安装点列表 */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-gray-800">安装点列表</div>
          <div className="text-xs text-gray-500">
            共 {plan.installations.length} 个安装点
          </div>
        </div>
        
        <div className="space-y-3">
          {plan.installations.map((installation, index) => (
            <div 
              key={installation.id} 
              className="flex items-start space-x-3 p-3 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors"
            >
              {/* 序号 */}
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {installation.sequence}
                </div>
              </div>
              
              {/* 安装点信息 */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {installation.installationNo} - {installation.customerName}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {installation.projectAddress}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {installation.scheduledTime}
                  </div>
                </div>
                
                {/* 行程信息 */}
                {index > 0 && (
                  <div className="mt-1 text-xs text-gray-500 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>预计行驶时间：{installation.estimatedTravelTime} 分钟</span>
                    <span className="mx-2">•</span>
                    <span>预计行驶距离：{installation.estimatedTravelDistance} km</span>
                  </div>
                )}
              </div>
              
              {/* 操作按钮 */}
              <div className="flex flex-col space-y-1">
                <button
                  className="p-1 rounded hover:bg-gray-100 text-gray-600"
                  aria-label="查看详情"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InstallationRoutePlanDetail;