import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Clock, Users, Package } from 'lucide-react';
import React, { useState } from 'react';

import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { TodoCategory, TodoItem } from '@/types/todo';

import TodoCard from './TodoCard';

interface TodoCategoriesProps {
  categories: TodoCategory[];
  onTodoAction: (item: TodoItem, action: string) => void;
}

const TodoCategories: React.FC<TodoCategoriesProps> = ({ categories, onTodoAction }) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const getCategoryIcon = (categoryName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      '跟踪中线索': <Users className="h-4 w-4" />,
      '待草签线索': <CheckCircle2 className="h-4 w-4" />,
      '待确认测量单': <Package className="h-4 w-4" />,
      '方案待确认': <CheckCircle2 className="h-4 w-4" />,
      '待推单处理': <AlertCircle className="h-4 w-4" />,
      '待确认安装': <Package className="h-4 w-4" />,
      '待分配线索': <Users className="h-4 w-4" />,
      '团队业绩异常': <AlertCircle className="h-4 w-4" />,
      '待审批事项': <Clock className="h-4 w-4" />,
      '待确认到店': <CheckCircle2 className="h-4 w-4" />,
      '渠道业绩异常': <AlertCircle className="h-4 w-4" />,
      '待处理渠道投诉': <AlertCircle className="h-4 w-4" />,
      '渠道政策待审批': <Clock className="h-4 w-4" />,
      '待确认推单': <CheckCircle2 className="h-4 w-4" />,
      '待填写生产单号': <Package className="h-4 w-4" />,
      '待更新备货状态': <Package className="h-4 w-4" />,
      '待填写物流单号': <Package className="h-4 w-4" />,
      '测量待分配': <Users className="h-4 w-4" />,
      '测量分配中': <Clock className="h-4 w-4" />,
      '安装待分配': <Users className="h-4 w-4" />,
      '安装分配中': <Clock className="h-4 w-4" />
    };
    return iconMap[categoryName] || <AlertCircle className="h-4 w-4" />;
  };

  if (categories.length === 0) {
    return (
      <PaperCard>
        <PaperCardContent className="p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-success-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-ink-800 mb-2">暂无待办事项</h3>
          <p className="text-ink-500">您的待办清单已清空，继续保持高效工作！</p>
        </PaperCardContent>
      </PaperCard>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map(category => (
        <PaperCard key={category.id} className="overflow-hidden">
          <PaperCardHeader
            className="cursor-pointer flex justify-between items-center hover:bg-paper-300 transition-colors"
            onClick={() => toggleCategory(category.id)}
          >
            <div className="flex items-center gap-2">
              <div className="text-primary-600">
                {getCategoryIcon(category.name)}
              </div>
              <PaperCardTitle className="text-lg">{category.name}</PaperCardTitle>
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-600">
                {category.count}
              </span>
            </div>
            <div className="text-primary-600">
              {expandedCategories[category.id] ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </div>
          </PaperCardHeader>

          {expandedCategories[category.id] && (
            <PaperCardContent className="pt-0">
              {category.items.length > 0 ? (
                <div className="space-y-2">
                  {category.items.map(item => (
                    <TodoCard
                      key={item.id}
                      item={item}
                      onAction={onTodoAction}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-ink-500">
                  该分类下暂无待办事项
                </div>
              )}
            </PaperCardContent>
          )}
        </PaperCard>
      ))}
    </div>
  );
};

export default TodoCategories;
