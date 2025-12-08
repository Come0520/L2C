'use client';

import { Trash2 } from 'lucide-react';
import { useState, useRef } from 'react';
// ...
// const [isResizing, setIsResizing] = useState(false);
// const [resizeHandle, setResizeHandle] = useState('');
// ...
// const rect = (e.target as HTMLElement).getBoundingClientRect();

interface SlideElement {
  id: string;
  type: 'text' | 'shape' | 'image';
  content: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: any;
}

interface Slide {
  id: string;
  title: string;
  elements: SlideElement[];
  background: string;
}

interface SlideEditorProps {
  slide: Slide;
  selectedElement: string | null;
  onElementSelect: (elementId: string | null) => void;
  currentTool: string;
  onSlideChange: (slide: Slide) => void;
}

export function SlideEditor({
  slide,
  selectedElement,
  onElementSelect,
  currentTool,
  onSlideChange,
}: SlideEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // const [isResizing, setIsResizing] = useState(false);
  // const [resizeHandle, setResizeHandle] = useState('');

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      onElementSelect(null);
    }
  };

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    onElementSelect(elementId);

    if (currentTool === 'select') {
      setIsDragging(true);
      const element = slide.elements.find(el => el.id === elementId);
      if (element) {
        // const rect = (e.target as HTMLElement).getBoundingClientRect();
        setDragOffset({
          x: e.clientX - element.position.x,
          y: e.clientY - element.position.y,
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedElement) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      updateElement(selectedElement, {
        position: { x: newX, y: newY },
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // setIsResizing(false);
  };

  const updateElement = (elementId: string, updates: Partial<SlideElement>) => {
    const updatedSlide = {
      ...slide,
      elements: slide.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      ),
    };
    onSlideChange(updatedSlide);
  };

  const deleteElement = (elementId: string) => {
    const updatedSlide = {
      ...slide,
      elements: slide.elements.filter(el => el.id !== elementId),
    };
    onSlideChange(updatedSlide);
    onElementSelect(null);
  };

  const addElement = (type: string, position: { x: number; y: number }) => {
    const newElement: SlideElement = {
      id: Date.now().toString(),
      type: type as 'text' | 'shape' | 'image',
      content: type === 'text' ? '双击编辑文本' : '',
      position,
      size: { width: 200, height: type === 'text' ? 50 : 100 },
      style: {
        backgroundColor: type === 'shape' ? '#3b82f6' : 'transparent',
        color: type === 'text' ? '#000000' : 'inherit',
        fontSize: type === 'text' ? '16px' : 'inherit',
      },
    };

    const updatedSlide = {
      ...slide,
      elements: [...slide.elements, newElement],
    };
    onSlideChange(updatedSlide);
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (currentTool !== 'select') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        addElement(currentTool, { x, y });
      }
    }
  };

  const renderElement = (element: SlideElement) => {
    const isSelected = selectedElement === element.id;
    const baseClasses = `absolute cursor-move select-none ${isSelected ? 'ring-2 ring-primary-500' : ''
      }`;

    switch (element.type) {
      case 'text':
        return (
          <div
            key={element.id}
            className={baseClasses}
            style={{
              left: element.position.x,
              top: element.position.y,
              width: element.size.width,
              height: element.size.height,
              color: element.style.color,
              fontSize: element.style.fontSize,
            }}
            onMouseDown={(e) => handleElementMouseDown(e, element.id)}
          >
            <div
              contentEditable
              suppressContentEditableWarning
              className="w-full h-full p-2 border-none outline-none resize-none"
              style={{ backgroundColor: element.style.backgroundColor }}
              onBlur={(e) => {
                updateElement(element.id, {
                  content: e.currentTarget.textContent || '',
                });
              }}
            >
              {element.content}
            </div>

            {isSelected && (
              <div className="absolute -top-8 right-0 flex space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteElement(element.id);
                  }}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        );

      case 'shape':
        return (
          <div
            key={element.id}
            className={baseClasses}
            style={{
              left: element.position.x,
              top: element.position.y,
              width: element.size.width,
              height: element.size.height,
              backgroundColor: element.style.backgroundColor,
            }}
            onMouseDown={(e) => handleElementMouseDown(e, element.id)}
          >
            {isSelected && (
              <div className="absolute -top-8 right-0 flex space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteElement(element.id);
                  }}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        );

      case 'image':
        return (
          <div
            key={element.id}
            className={baseClasses}
            style={{
              left: element.position.x,
              top: element.position.y,
              width: element.size.width,
              height: element.size.height,
            }}
            onMouseDown={(e) => handleElementMouseDown(e, element.id)}
          >
            <div className="w-full h-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center">
              <span className="text-gray-500 text-sm">图片占位符</span>
            </div>

            {isSelected && (
              <div className="absolute -top-8 right-0 flex space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteElement(element.id);
                  }}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full bg-white border border-gray-300 rounded-lg shadow-sm"
      style={{ backgroundColor: slide.background }}
      onClick={handleCanvasClick}
      onDoubleClick={handleCanvasDoubleClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {slide.elements.map(renderElement)}

      {slide.elements.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="text-lg mb-2">开始创建您的幻灯片</div>
            <div className="text-sm">选择工具并在画布上双击添加元素</div>
          </div>
        </div>
      )}
    </div>
  );
}