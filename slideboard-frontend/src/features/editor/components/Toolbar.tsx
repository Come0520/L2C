'use client';

import { MousePointer, Type, Square, Circle, Image, Undo, Redo } from 'lucide-react';

interface ToolbarProps {
  currentTool: string;
  onToolChange: (tool: string) => void;
}

const tools = [
  {
    id: 'select',
    name: '选择',
    icon: MousePointer,
    shortcut: 'V',
  },
  {
    id: 'text',
    name: '文本',
    icon: Type,
    shortcut: 'T',
  },
  {
    id: 'rectangle',
    name: '矩形',
    icon: Square,
    shortcut: 'R',
  },
  {
    id: 'circle',
    name: '圆形',
    icon: Circle,
    shortcut: 'C',
  },
  {
    id: 'image',
    name: '图片',
    icon: Image,
    shortcut: 'I',
  },
];

export function Toolbar({ currentTool, onToolChange }: ToolbarProps) {
  return (
    <div className="flex items-center space-x-2">
      {/* 选择工具 */}
      <div className="flex items-center space-x-1 border-r border-gray-200 pr-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              title={`${tool.name} (${tool.shortcut})`}
              className={`p-2 rounded-md transition-colors ${
                currentTool === tool.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>

      {/* 撤销重做 */}
      <div className="flex items-center space-x-1">
        <button
          title="撤销 (Ctrl+Z)"
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
          disabled
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          title="重做 (Ctrl+Y)"
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
          disabled
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>

      {/* 分割线 */}
      <div className="w-px h-6 bg-gray-300"></div>

      {/* 对齐工具 */}
      <div className="flex items-center space-x-1">
        <button
          title="左对齐"
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <div className="w-4 h-4 flex flex-col justify-center space-y-1">
            <div className="h-0.5 bg-current w-3"></div>
            <div className="h-0.5 bg-current w-4"></div>
            <div className="h-0.5 bg-current w-2"></div>
          </div>
        </button>
        <button
          title="居中对齐"
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <div className="w-4 h-4 flex flex-col justify-center space-y-1">
            <div className="h-0.5 bg-current w-3 mx-auto"></div>
            <div className="h-0.5 bg-current w-4 mx-auto"></div>
            <div className="h-0.5 bg-current w-2 mx-auto"></div>
          </div>
        </button>
        <button
          title="右对齐"
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <div className="w-4 h-4 flex flex-col justify-center space-y-1">
            <div className="h-0.5 bg-current w-3 ml-auto"></div>
            <div className="h-0.5 bg-current w-4 ml-auto"></div>
            <div className="h-0.5 bg-current w-2 ml-auto"></div>
          </div>
        </button>
      </div>
    </div>
  );
}