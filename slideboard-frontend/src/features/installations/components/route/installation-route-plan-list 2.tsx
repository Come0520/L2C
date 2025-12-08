import React from 'react';

import { InstallationRoutePlan } from '@/types/installation-schedule';

interface InstallationRoutePlanListProps {
  plans: InstallationRoutePlan[];
  onPlanClick?: (planId: string) => void;
  onDeletePlan?: (planId: string) => void;
}

const InstallationRoutePlanList: React.FC<InstallationRoutePlanListProps> = ({
  plans,
  onPlanClick,
  onDeletePlan
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">安装路线规划列表</h3>
      </div>
      
      {plans.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          暂无路线规划
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onPlanClick?.(plan.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {plan.date} - {plan.installerName}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                      {plan.installations.length} 个安装点
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    <span>总行程：{plan.totalTravelDistance} km</span>
                    <span className="mx-2">•</span>
                    <span>总时间：{plan.totalTravelTime} 分钟</span>
                    <span className="mx-2">•</span>
                    <span>预计：{plan.estimatedStartTime} - {plan.estimatedEndTime}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePlan?.(plan.id);
                    }}
                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    aria-label="删除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstallationRoutePlanList;