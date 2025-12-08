import React from 'react';

import { InstallationRoutePlan } from '@/types/installation-schedule';

interface InstallationRoutePlanListProps {
  plans: InstallationRoutePlan[];
  onPlanClick: (planId: string) => void;
  onDeletePlan: (planId: string) => Promise<void>;
  date?: Date;
}

const InstallationRoutePlanList: React.FC<InstallationRoutePlanListProps> = ({
  plans,
  onPlanClick,
  onDeletePlan
}) => {
  return (
    <div className="space-y-4">
      {plans.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
          <p>暂无路线规划</p>
        </div>
      ) : (
        plans.map(plan => (
          <div
            key={plan.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onPlanClick(plan.id)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium text-gray-900">
                  {plan.installerName}
                </h3>
                <p className="text-sm text-gray-500">{plan.date}</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {plan.totalTravelDistance}km
              </span>
            </div>

            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>任务数量:</span>
                <span className="font-medium">{plan.installations.length}</span>
              </div>
              <div className="flex justify-between">
                <span>预计耗时:</span>
                <span className="font-medium">{plan.totalTravelTime}分钟</span>
              </div>
              <div className="flex justify-between">
                <span>预计时间:</span>
                <span className="font-medium">{plan.estimatedStartTime} - {plan.estimatedEndTime}</span>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePlan(plan.id);
                }}
                className="text-sm text-red-600 hover:text-red-900 hover:underline"
              >
                删除
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default InstallationRoutePlanList;