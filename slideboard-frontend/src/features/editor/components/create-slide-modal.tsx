'use client';

import { useState } from 'react';
import { X, Plus, Palette, FileText } from 'lucide-react';
import { toast } from '@/components/ui/toast';

interface CreateSlideModalProps {
  onClose: () => void;
  onCreate: (templateId?: string) => void;
}

const templates = [
  {
    id: 'blank',
    name: '空白幻灯片',
    description: '从空白开始创建',
    thumbnail: '/templates/blank.svg',
    category: 'basic',
  },
  {
    id: 'business',
    name: '商务演示',
    description: '专业的商务演示模板',
    thumbnail: '/templates/business.svg',
    category: 'professional',
  },
  {
    id: 'education',
    name: '教育培训',
    description: '教育培训专用模板',
    thumbnail: '/templates/education.svg',
    category: 'education',
  },
  {
    id: 'marketing',
    name: '市场营销',
    description: '市场营销报告模板',
    thumbnail: '/templates/marketing.svg',
    category: 'marketing',
  },
];

export function CreateSlideModal({ onClose, onCreate }: CreateSlideModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank');
  const [slideTitle, setSlideTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!slideTitle.trim()) {
      toast.error('请输入幻灯片标题');
      return;
    }

    setIsCreating(true);
    try {
      await onCreate(selectedTemplate === 'blank' ? undefined : selectedTemplate);
      onClose();
    } catch (_) {
      toast.error('创建幻灯片失败，请重试');
    } finally {
      setIsCreating(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">创建新幻灯片</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Title input */}
          <div className="mb-6">
            <label htmlFor="slide-title" className="block text-sm font-medium text-gray-700 mb-2">
              幻灯片标题
            </label>
            <input
              id="slide-title"
              type="text"
              value={slideTitle}
              onChange={(e) => setSlideTitle(e.target.value)}
              placeholder="输入幻灯片标题..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Template selection */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <Palette className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">选择模板</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    selectedTemplate === template.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Template thumbnail */}
                  <div className="aspect-video bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                    {template.id === 'blank' ? (
                      <div className="text-gray-400">
                        <Plus className="h-8 w-8" />
                      </div>
                    ) : (
                      <div className="text-gray-500 text-xs text-center">
                        {template.name}
                      </div>
                    )}
                  </div>
                  
                  {/* Template info */}
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    {template.name}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {template.description}
                  </p>
                  
                  {/* Selection indicator */}
                  {selectedTemplate === template.id && (
                    <div className="absolute top-2 right-2">
                      <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !slideTitle.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? '创建中...' : '创建幻灯片'}
          </button>
        </div>
      </div>
    </div>
  );
}