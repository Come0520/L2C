'use client';

/**
 * 款式模板表单弹窗（新增/编辑）
 *
 * 字段：名称 / 分类 / 缩略图 / Prompt 片段 / 排序值
 * 缩略图通过 /api/platform/ai-templates/upload 上传
 */
import { useState, useTransition, useRef, type FormEvent } from 'react';
import { createTemplate } from '../actions/template-actions';

/** 分类选项 */
const CATEGORIES = [
  { value: 'track', label: '轨道帘' },
  { value: 'roman_pole', label: '罗马杆' },
  { value: 'roman_blind', label: '罗马帘' },
  { value: 'roller', label: '卷帘' },
  { value: 'venetian', label: '百叶帘' },
];

interface TemplateFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TemplateFormDialog({ open, onClose, onSuccess }: TemplateFormDialogProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('track');
  const [promptFragment, setPromptFragment] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  /** 上传缩略图 */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/platform/ai-templates/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setThumbnailUrl(data.data.url);
      } else {
        setError(data.error || '上传失败');
      }
    } catch {
      setError('上传请求失败');
    } finally {
      setUploading(false);
    }
  };

  /** 提交表单 */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !promptFragment.trim()) {
      setError('名称和 Prompt 片段为必填项');
      return;
    }

    startTransition(async () => {
      try {
        await createTemplate({
          name: name.trim(),
          category,
          promptFragment: promptFragment.trim(),
          sortOrder,
          thumbnailUrl,
        });
        // 重置表单
        setName('');
        setCategory('track');
        setPromptFragment('');
        setSortOrder(0);
        setThumbnailUrl(null);
        setError(null);
        onSuccess();
        onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '创建失败');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">新增款式模板</h3>

        {error && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 款式名称 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">款式名称 *</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              placeholder="如：经典三折帘"
            />
          </div>

          {/* 分类 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">分类 *</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* 缩略图 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">参考缩略图</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-blue-400"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? '上传中...' : thumbnailUrl ? '重新上传' : '选择图片'}
              </button>
              {thumbnailUrl && (
                <img src={thumbnailUrl} alt="预览" className="h-12 w-12 rounded object-cover" />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* AI Prompt 片段 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">AI Prompt 片段 *</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={promptFragment}
              onChange={(e) => setPromptFragment(e.target.value)}
              rows={3}
              placeholder="如：classic triple-fold curtain with elegant draping..."
            />
          </div>

          {/* 排序值 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">排序值</label>
            <input
              type="number"
              className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              min={0}
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              onClick={onClose}
              disabled={isPending}
            >
              取消
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={isPending || uploading}
            >
              {isPending ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
