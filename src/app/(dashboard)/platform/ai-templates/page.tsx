/**
 * 平台管理 — 款式模板管理页
 * 仅 SUPER_ADMIN 可访问，用于维护 AI 窗帘款式参考图
 */
import { Suspense } from 'react';
import { getAllTemplates } from '@/features/ai-rendering/actions/template-actions';
import { TemplateManager } from '@/features/ai-rendering/components/template-manager';

export const metadata = {
  title: '款式模板管理 — 平台管理',
};

export default async function AiTemplatesPage() {
  const templates = await getAllTemplates();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">AI 款式模板管理</h1>
        <p className="mt-1 text-sm text-gray-500">
          管理 AI 效果图生成时使用的窗帘款式参考模板，供所有租户使用。
        </p>
      </div>

      <Suspense fallback={<div>加载中...</div>}>
        <TemplateManager initialTemplates={templates} />
      </Suspense>
    </div>
  );
}
