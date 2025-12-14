import React, { useState } from 'react';

import { CreateInstallationRoutePlanRequest } from '../../../../types/installation-schedule';

interface InstallationRoutePlanFormProps {
  initialData?: any; // Using any for now to bypass strict checks if partial updates are needed
  onSubmit: (data: CreateInstallationRoutePlanRequest) => Promise<void>;
  onCancel: () => void;
  installers: Array<{ id: string; name: string }>;
  availableInstallations: Array<{
    id: string;
    installationNo: string;
    customerName: string;
    projectAddress: string;
    scheduledTime: string;
  }>;
  isSubmitting: boolean;
}

const InstallationRoutePlanForm: React.FC<InstallationRoutePlanFormProps> = ({
  onSubmit,
  onCancel,
  installers,
  availableInstallations,
  isSubmitting
}) => {
  const [selectedInstaller, setSelectedInstaller] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedInstallations, setSelectedInstallations] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      date: selectedDate || '',
      installerId: selectedInstaller,
      installationIds: selectedInstallations
    });
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">创建路线规划</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">日期</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">安装人员</label>
          <select
            value={selectedInstaller}
            onChange={(e) => setSelectedInstaller(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">请选择安装人员</option>
            {installers.map(installer => (
              <option key={installer.id} value={installer.id}>
                {installer.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">选择安装任务</label>
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
            {availableInstallations.map(inst => (
              <label key={inst.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                <input
                  type="checkbox"
                  checked={selectedInstallations.includes(inst.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedInstallations(prev => [...prev, inst.id]);
                    } else {
                      setSelectedInstallations(prev => prev.filter(id => id !== inst.id));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{inst.customerName} - {inst.projectAddress}</p>
                  <p className="text-xs text-gray-500">
                    单号: {inst.installationNo} | 预约: {inst.scheduledTime}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            取消
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? '提交中...' : '提交'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InstallationRoutePlanForm;
