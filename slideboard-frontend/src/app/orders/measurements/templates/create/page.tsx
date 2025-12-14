'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { MeasurementTemplateEditor } from '@/features/measurement/components/measurement-template-editor';
import { MeasurementTemplatesClient } from '@/services/measurement-templates.client';

/**
 * 创建测量模板页面
 */
export default function CreateMeasurementTemplatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isClient, setIsClient] = useState(false);

  // 确保组件只在客户端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);

  /**
   * 处理保存模板
   */
  const handleSave = async (data: any) => {
    try {
      setIsLoading(true);
      await MeasurementTemplatesClient.createTemplate(data);
      router.push('/orders/measurements/templates');
    } catch (error) {
      console.error('创建模板失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理取消
   */
  const handleCancel = () => {
    router.push('/orders/measurements/templates');
  };

  // 只在客户端渲染编辑器组件
  if (!isClient) {
    return <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink-800">创建测量模板</h1>
        <p className="text-ink-500 mt-1">创建新的测量模板，提高测量单创建效率</p>
      </div>
      <div className="flex justify-center items-center h-64">
        <div className="text-ink-500">加载中...</div>
      </div>
    </div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 页面头部 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink-800">创建测量模板</h1>
        <p className="text-ink-500 mt-1">创建新的测量模板，提高测量单创建效率</p>
      </div>

      {/* 模板编辑器 */}
      <MeasurementTemplateEditor
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
}
