'use client';

/**
 * 款式模板管理器（客户端组件）
 * 展示模板列表，支持创建/编辑/删除/状态切换
 * TODO: Phase 2 实现完整的表单弹窗和图片上传
 */
import { useState, useTransition, useCallback } from 'react';
import { toggleTemplateStatus, deleteTemplate } from '../actions/template-actions';
import { TemplateFormDialog } from './template-form-dialog';

interface Template {
  id: string;
  name: string;
  category: string;
  thumbnailUrl: string | null;
  promptFragment: string;
  sortOrder: number;
  isActive: number;
  createdAt: Date;
}

interface TemplateManagerProps {
  initialTemplates: Template[];
}

/** 分类标签映射 */
const CATEGORY_LABELS: Record<string, string> = {
  track: '轨道帘',
  roman_pole: '罗马杆',
  roman_blind: '罗马帘',
  roller: '卷帘',
  venetian: '百叶帘',
};

export function TemplateManager({ initialTemplates }: TemplateManagerProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [isPending, startTransition] = useTransition();
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  /** 弹窗保存成功后刷新列表 */
  const handleCreateSuccess = useCallback(() => {
    // 简单方案：刷新整个页面以获取最新数据
    window.location.reload();
  }, []);

  /** 切换启用状态 */
  const handleToggle = (id: string, current: number) => {
    const next = current === 1 ? 0 : 1;
    startTransition(async () => {
      await toggleTemplateStatus(id, next as 0 | 1);
      setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, isActive: next } : t)));
    });
  };

  /** 删除模板 */
  const handleDelete = (id: string, name: string) => {
    if (!confirm(`确定删除「${name}」款式模板？`)) return;
    startTransition(async () => {
      await deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    });
  };

  /** 编辑模板 */
  const handleEdit = (tpl: Template) => {
    setEditingTemplate(tpl);
    setShowDialog(true);
  };

  /** 点击新增 */
  const handleCreateNew = () => {
    setEditingTemplate(null);
    setShowDialog(true);
  };

  return (
    <div>
      {/* 新增/编辑弹窗 */}
      <TemplateFormDialog
        open={showDialog}
        initialData={editingTemplate ? {
          ...editingTemplate,
          referenceImageUrl: null // 如果以后支持 ReferenceImage 可以在此处传递
        } : null}
        onClose={() => {
          setShowDialog(false);
          setEditingTemplate(null);
        }}
        onSuccess={handleCreateSuccess}
      />

      <div className="mb-4 flex justify-end">
        <button
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          onClick={handleCreateNew}
        >
          + 新增款式模板
        </button>
      </div>

      {templates.length === 0 ? (
        <p className="text-sm text-gray-500">暂无模板，请点击上方按钮新增。</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  款式名称
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  分类
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  排序
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  状态
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {templates.map((tpl) => (
                <tr key={tpl.id} className={tpl.isActive ? '' : 'opacity-50'}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{tpl.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {CATEGORY_LABELS[tpl.category] ?? tpl.category}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{tpl.sortOrder}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tpl.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                      {tpl.isActive ? '已启用' : '已禁用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="mr-3 text-xs text-indigo-600 hover:underline"
                      onClick={() => handleEdit(tpl)}
                      disabled={isPending}
                    >
                      编辑
                    </button>
                    <button
                      className="mr-3 text-xs text-blue-600 hover:underline"
                      onClick={() => handleToggle(tpl.id, tpl.isActive)}
                      disabled={isPending}
                    >
                      {tpl.isActive ? '禁用' : '启用'}
                    </button>
                    <button
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => handleDelete(tpl.id, tpl.name)}
                      disabled={isPending}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
