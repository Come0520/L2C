import React, { useState } from 'react';

import { CreateInstallationRoutePlanRequest } from '@/types/installation-schedule';

interface InstallationRoutePlanFormProps {
  onSubmit: (data: CreateInstallationRoutePlanRequest) => void;
  onCancel: () => void;
  initialData?: Partial<CreateInstallationRoutePlanRequest>;
  installers: Array<{ id: string; name: string }>;
  availableInstallations: Array<{
    id: string;
    installationNo: string;
    customerName: string;
    projectAddress: string;
    scheduledTime: string;
  }>;
  isSubmitting?: boolean;
}

const InstallationRoutePlanForm: React.FC<InstallationRoutePlanFormProps> = ({
  onSubmit,
  onCancel,
  initialData = {},
  installers,
  availableInstallations,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState<CreateInstallationRoutePlanRequest>({
    date: initialData.date || new Date().toISOString().split('T')[0] || '',
    installerId: initialData.installerId || '',
    installationIds: initialData.installationIds || []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = '请选择安装日期';
    }

    if (!formData.installerId) {
      newErrors.installerId = '请选择安装人员';
    }

    if (formData.installationIds.length === 0) {
      newErrors.installationIds = '请至少选择一个安装点';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // 处理安装点选择
  const handleInstallationToggle = (installationId: string) => {
    setFormData(prev => {
      const isSelected = prev.installationIds.includes(installationId);
      return {
        ...prev,
        installationIds: isSelected
          ? prev.installationIds.filter(id => id !== installationId)
          : [...prev.installationIds, installationId]
      };
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            {initialData.installationIds ? '编辑安装路线规划' : '创建安装路线规划'}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-600"
            aria-label="关闭"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 表单内容 */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* 安装日期 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">安装日期</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md ${errors.date ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} focus:border-blue-300 outline-none transition-colors`}
          />
          {errors.date && (
            <p className="mt-1 text-xs text-red-600">{errors.date}</p>
          )}
        </div>

        {/* 安装人员 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">安装人员</label>
          <select
            value={formData.installerId}
            onChange={(e) => setFormData(prev => ({ ...prev, installerId: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md ${errors.installerId ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} focus:border-blue-300 outline-none transition-colors`}
          >
            <option value="">请选择安装人员</option>
            {installers.map((installer) => (
              <option key={installer.id} value={installer.id}>
                {installer.name}
              </option>
            ))}
          </select>
          {errors.installerId && (
            <p className="mt-1 text-xs text-red-600">{errors.installerId}</p>
          )}
        </div>

        {/* 选择安装点 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">选择安装点</label>
            <div className="text-xs text-gray-500">
              已选择 {formData.installationIds.length} 个安装点
            </div>
          </div>

          {errors.installationIds && (
            <p className="mt-1 text-xs text-red-600 mb-2">{errors.installationIds}</p>
          )}

          <div className="border border-gray-200 rounded-md overflow-hidden">
            {availableInstallations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                暂无可用的安装点
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {availableInstallations.map((installation) => (
                  <div
                    key={installation.id}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      id={`installation-${installation.id}`}
                      checked={formData.installationIds.includes(installation.id)}
                      onChange={() => handleInstallationToggle(installation.id)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`installation-${installation.id}`}
                      className="ml-3 flex-1 cursor-pointer text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900">
                            {installation.installationNo}
                          </span>
                          <span className="mx-2">•</span>
                          <span className="text-gray-500">
                            {installation.customerName}
                          </span>
                        </div>
                        <div className="text-gray-500">
                          {installation.scheduledTime}
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {installation.projectAddress}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            取消
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>处理中...</span>
              </div>
            ) : (
              '生成路线规划'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InstallationRoutePlanForm;