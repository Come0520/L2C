'use client';

import { Trash2, Copy } from 'lucide-react';

interface Slide {
  id: string;
  title: string;
  elements: any[];
  background: string;
}

interface SlideThumbnailListProps {
  slides: Slide[];
  currentIndex: number;
  onSlideSelect: (index: number) => void;
  onSlideDelete: (index: number) => void;
  onSlideDuplicate?: (index: number) => void;
}

export function SlideThumbnailList({
  slides,
  currentIndex,
  onSlideSelect,
  onSlideDelete,
  onSlideDuplicate,
}: SlideThumbnailListProps) {
  const handleDeleteSlide = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这张幻灯片吗？')) {
      onSlideDelete(index);
    }
  };

  const handleDuplicateSlide = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSlideDuplicate) {
      onSlideDuplicate(index);
    }
  };

  return (
    <div className="space-y-2 p-2">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          onClick={() => onSlideSelect(index)}
          className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all duration-200 ${currentIndex === index
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-200 hover:border-gray-300'
            }`}
        >
          {/* 幻灯片编号 */}
          <div className="text-xs text-gray-500 mb-1">
            {index + 1}
          </div>

          {/* 缩略图 */}
          <div
            className="aspect-video bg-white border border-gray-200 rounded flex items-center justify-center text-xs text-gray-400"
            style={{ backgroundColor: slide.background }}
          >
            {slide.elements.length > 0 ? (
              <div className="text-center">
                <div className="text-primary-600 font-medium">
                  {slide.elements.length} 个元素
                </div>
              </div>
            ) : (
              <div>空白幻灯片</div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="absolute top-1 right-1 flex space-x-1 opacity-0 hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => handleDuplicateSlide(index, e)}
              className="p-1 bg-white rounded-full shadow-sm hover:bg-gray-50"
              title="复制"
            >
              <Copy className="h-3 w-3 text-gray-600" />
            </button>
            <button
              onClick={(e) => handleDeleteSlide(index, e)}
              className="p-1 bg-white rounded-full shadow-sm hover:bg-red-50"
              title="删除"
            >
              <Trash2 className="h-3 w-3 text-red-600" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}