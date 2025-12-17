'use client'

import React, { useState, useEffect } from 'react';

import InstallationRoutePlanDetail from '@/features/installations/components/route/InstallationRoutePlanDetail';
import InstallationRoutePlanForm from '@/features/installations/components/route/InstallationRoutePlanForm';
import InstallationRoutePlanList from '@/features/installations/components/route/InstallationRoutePlanList';
import { installationScheduleService } from '@/services/installation-schedule.client';
import { InstallationRoutePlan, CreateInstallationRoutePlanRequest } from '@/types/installation-schedule';

const InstallationRoutePlansPage: React.FC = () => {
  const [routePlans, setRoutePlans] = useState<InstallationRoutePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<InstallationRoutePlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 模拟数据 - 实际应该从API获取
  const [installers] = useState<Array<{ id: string; name: string }>>([
    { id: '1', name: '张三' },
    { id: '2', name: '李四' },
    { id: '3', name: '王五' }
  ]);
  
  // 模拟数据 - 实际应该从API获取
  const [availableInstallations] = useState<Array<{ 
    id: string; 
    installationNo: string; 
    customerName: string; 
    projectAddress: string;
    scheduledTime: string;
  }>>([
    { 
      id: '1', 
      installationNo: 'INST-20240101-001', 
      customerName: '客户A', 
      projectAddress: '北京市朝阳区建国路88号',
      scheduledTime: '09:00'
    },
    { 
      id: '2', 
      installationNo: 'INST-20240101-002', 
      customerName: '客户B', 
      projectAddress: '北京市海淀区中关村大街1号',
      scheduledTime: '11:00'
    },
    { 
      id: '3', 
      installationNo: 'INST-20240101-003', 
      customerName: '客户C', 
      projectAddress: '北京市西城区金融街10号',
      scheduledTime: '14:00'
    }
  ]);

  // 获取路线规划列表
  const fetchRoutePlans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 这里应该调用API获取路线规划列表
      // 暂时使用模拟数据
      const mockPlans: InstallationRoutePlan[] = [
        {
          id: '1',
          date: '2024-01-01',
          installerId: '1',
          installerName: '张三',
          installations: [
            {
              id: '1',
              installationNo: 'INST-20240101-001',
              customerName: '客户A',
              projectAddress: '北京市朝阳区建国路88号',
              scheduledTime: '09:00',
              sequence: 1,
              estimatedTravelTime: 0,
              estimatedTravelDistance: 0
            },
            {
              id: '2',
              installationNo: 'INST-20240101-002',
              customerName: '客户B',
              projectAddress: '北京市海淀区中关村大街1号',
              scheduledTime: '11:00',
              sequence: 2,
              estimatedTravelTime: 30,
              estimatedTravelDistance: 15
            }
          ],
          totalTravelTime: 30,
          totalTravelDistance: 15,
          estimatedStartTime: '09:00',
          estimatedEndTime: '12:00',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      setRoutePlans(mockPlans);
    } catch (_err) {
      setError('获取路线规划失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchRoutePlans();
  }, []);

  // 处理创建/编辑路线规划
  const handleCreateRoutePlan = async (data: CreateInstallationRoutePlanRequest) => {
    setIsSubmitting(true);
    try {
      // 调用API创建路线规划
      const newPlan = await installationScheduleService.createInstallationRoutePlan(data);
      
      // 更新路线规划列表
      setRoutePlans(prev => [...prev, newPlan]);
      setIsFormOpen(false);
    } catch (_err) {
      setError('创建路线规划失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理删除路线规划
  const handleDeleteRoutePlan = async (planId: string) => {
    try {
      // 调用API删除路线规划
      // 暂时使用模拟数据
      setRoutePlans(prev => prev.filter(plan => plan.id !== planId));
      if (selectedPlan?.id === planId) {
        setSelectedPlan(null);
      }
    } catch (_err) {
      setError('删除路线规划失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">安装路线规划</h1>
              <p className="mt-1 text-sm text-gray-600">
                查看和管理安装路线规划
              </p>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              创建路线规划
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {/* 路线规划列表和详情 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 路线规划列表 */}
          <div className="lg:col-span-1">
            {isLoading ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-12 bg-gray-100 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <InstallationRoutePlanList
                plans={routePlans}
                onPlanClick={(planId) => {
                  const plan = routePlans.find(p => p.id === planId);
                  if (plan) {
                    setSelectedPlan(plan);
                  }
                }}
                onDeletePlan={handleDeleteRoutePlan}
              />
            )}
          </div>
          
          {/* 路线规划详情 */}
          <div className="lg:col-span-2">
            {selectedPlan ? (
              <InstallationRoutePlanDetail
                plan={selectedPlan}
                onBack={() => setSelectedPlan(null)}
                onEditPlan={(_planId) => {
                  // 这里可以实现编辑功能
                }}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">选择一个路线规划查看详情</h3>
                <p className="text-sm text-gray-500">
                  从左侧列表中选择一个路线规划，查看详细信息和路线图
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 创建路线规划表单 */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <InstallationRoutePlanForm
              onSubmit={handleCreateRoutePlan}
              onCancel={() => setIsFormOpen(false)}
              installers={installers}
              availableInstallations={availableInstallations}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallationRoutePlansPage;
