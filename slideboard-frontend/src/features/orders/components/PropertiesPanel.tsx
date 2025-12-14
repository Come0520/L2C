'use client';

import { Palette, Layout, Settings } from 'lucide-react';
import { useState } from 'react';

interface SlideElement {
  id: string;
  type: 'text' | 'shape' | 'image';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: Record<string, string | number>;
}

interface Slide {
  id: string;
  title: string;
  elements: SlideElement[];
  background: string;
}

interface PropertiesPanelProps {
  selectedElement: string | null;
  currentSlide: Slide;
  onElementUpdate: (elementId: string, updates: Partial<SlideElement>) => void;
  onSlideUpdate: (updates: Partial<Slide>) => void;
}

export function PropertiesPanel({
  selectedElement,
  currentSlide,
  onElementUpdate,
  onSlideUpdate,
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<'element' | 'slide'>('element');

  const selectedElementData = currentSlide.elements.find(
    el => el.id === selectedElement
  );

  const handleElementStyleChange = (property: string, value: string | number) => {
    if (selectedElement) {
      onElementUpdate(selectedElement, {
        style: {
          ...selectedElementData?.style,
          [property]: value,
        },
      });
    }
  };

  const handleElementPositionChange = (axis: 'x' | 'y', value: number) => {
    if (selectedElement && selectedElementData) {
      const pos = selectedElementData.position;
      onElementUpdate(selectedElement, {
        position: {
          x: axis === 'x' ? value : pos.x,
          y: axis === 'y' ? value : pos.y,
        },
      });
    }
  };

  const handleElementSizeChange = (dimension: 'width' | 'height', value: number) => {
    if (selectedElement && selectedElementData) {
      const sz = selectedElementData.size;
      onElementUpdate(selectedElement, {
        size: {
          width: dimension === 'width' ? value : sz.width,
          height: dimension === 'height' ? value : sz.height,
        },
      });
    }
  };

  const renderElementProperties = () => {
    if (!selectedElementData) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>选择一个元素以编辑其属性</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* 位置 */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">位置</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">X</label>
              <input
                type="number"
                value={selectedElementData.position.x}
                onChange={(e) => handleElementPositionChange('x', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Y</label>
              <input
                type="number"
                value={selectedElementData.position.y}
                onChange={(e) => handleElementPositionChange('y', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* 尺寸 */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">尺寸</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">宽度</label>
              <input
                type="number"
                value={selectedElementData.size.width}
                onChange={(e) => handleElementSizeChange('width', parseInt(e.target.value) || 100)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">高度</label>
              <input
                type="number"
                value={selectedElementData.size.height}
                onChange={(e) => handleElementSizeChange('height', parseInt(e.target.value) || 100)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* 样式 */}
        {selectedElementData.type === 'text' && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">文本样式</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">字体大小</label>
              <input
                type="number"
                value={typeof selectedElementData.style.fontSize === 'number' 
                  ? (selectedElementData.style.fontSize as number) 
                  : parseInt(String(selectedElementData.style.fontSize).replace('px','')) || 16}
                onChange={(e) => handleElementStyleChange('fontSize', `${e.target.value}px`)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">文字颜色</label>
                <input
                  type="color"
              value={String(selectedElementData.style.color || '#000000')}
              onChange={(e) => handleElementStyleChange('color', e.target.value)}
              className="w-full h-8 border border-gray-300 rounded cursor-pointer"
            />
              </div>
            </div>
          </div>
        )}

        {(selectedElementData.type === 'shape' || selectedElementData.type === 'image') && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">背景</h3>
            <input
              type="color"
              value={String(selectedElementData.style.backgroundColor || '#3b82f6')}
              onChange={(e) => handleElementStyleChange('backgroundColor', e.target.value)}
              className="w-full h-8 border border-gray-300 rounded cursor-pointer"
            />
          </div>
        )}
      </div>
    );
  };

  const renderSlideProperties = () => {
    return (
      <div className="space-y-6">
        {/* 幻灯片标题 */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">标题</h3>
          <input
            type="text"
            value={currentSlide.title}
            onChange={(e) => onSlideUpdate({ title: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="幻灯片标题"
          />
        </div>

        {/* 背景颜色 */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">背景颜色</h3>
          <input
            type="color"
            value={currentSlide.background}
            onChange={(e) => onSlideUpdate({ background: e.target.value })}
            className="w-full h-10 border border-gray-300 rounded cursor-pointer"
          />
        </div>

        {/* 背景图片 */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">背景图片</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 mb-2">点击上传背景图片</p>
            <button
              onClick={() => undefined}
              className="px-3 py-1 text-sm text-primary-600 border border-primary-300 rounded hover:bg-primary-50"
            >
              选择图片
            </button>
          </div>
        </div>

        {/* 幻灯片尺寸 */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">尺寸</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">宽度</label>
              <input
                type="number"
                value={1920}
                disabled
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">高度</label>
              <input
                type="number"
                value={1080}
                disabled
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-white border-l border-gray-200">
      {/* 标签页 */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('element')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'element'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layout className="h-4 w-4 inline mr-2" />
            元素
          </button>
          <button
            onClick={() => setActiveTab('slide')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'slide'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Palette className="h-4 w-4 inline mr-2" />
            幻灯片
          </button>
        </div>
      </div>

      {/* 内容 */}
      <div className="p-4 overflow-y-auto h-full">
        {activeTab === 'element' && renderElementProperties()}
        {activeTab === 'slide' && renderSlideProperties()}
      </div>
    </div>
  );
}
