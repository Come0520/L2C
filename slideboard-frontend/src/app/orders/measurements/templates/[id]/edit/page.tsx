'use client';

import { useRouter, useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { MeasurementTemplateEditor } from '@/features/measurement/components/measurement-template-editor';
import { MeasurementTemplatesClient } from '@/services/measurement-templates.client';
import { MeasurementTemplate } from '@/types/measurement-template';

/**
 * 编辑测量模板页面
 */
export default function EditMeasurementTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [template, setTemplate] = useState<MeasurementTemplate | undefined>();
  const [saveLoading, setSaveLoading] = useState(false);

  const templateId = params.id as string;

  /**
   * 获取模板数据
   */
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setIsLoading(true);
        const data = await MeasurementTemplatesClient.getTemplateById(templateId);
        if (data) {
          setTemplate(data);
        } else {
          router.push('/orders/measurements/templates');
        }
      } catch (error) {
        console.error('获取模板失败:', error);
        router.push('/orders/measurements/templates');
      } finally {
        setIsLoading(false);
      }
    };

    if (templateId) {
      fetchTemplate();
    }
  }, [templateId, router]);

  /**
   * 处理保存模板
   */
  const handleSave = async (data: any) => {
    try {
      setSaveLoading(true);
      await MeasurementTemplatesClient.updateTemplate(templateId, data);
      router.push('/orders/measurements/templates');
    } catch (error) {
      console.error('更新模板失败:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  /**
   * 处理取消
   */
  const handleCancel = () => {
    router.push('/orders/measurements/templates');
  };

  if (isLoading) {
    return <div className="p-6 max-w-7xl mx-auto">加载中...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 页面头部 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink-800">编辑测量模板</h1>
        <p className="text-ink-500 mt-1">编辑现有测量模板，调整其内容和设置</p>
      </div>

      {/* 模板编辑器 */}
      <MeasurementTemplateEditor
        template={template}
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={saveLoading}
      />
    </div>
  );
}
