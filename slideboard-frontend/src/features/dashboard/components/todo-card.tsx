import { Clock, AlertCircle, ArrowRight } from 'lucide-react';
import React from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card';
import { TodoItem } from '@/types/todo';

interface TodoCardProps {
  item: TodoItem;
  onAction: (item: TodoItem, action: string) => void;
}

const TodoCard: React.FC<TodoCardProps> = ({ item, onAction }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-error-100 text-error-600';
      case 'medium':
        return 'bg-warning-100 text-warning-600';
      case 'low':
        return 'bg-info-100 text-info-600';
      default:
        return 'bg-paper-300 text-ink-600';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '未知';
    }
  };

  return (
    <PaperCard className="mb-4 hover:shadow-md transition-shadow">
      <PaperCardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-ink-800">{item.title}</h3>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(item.priority)}`}>
                {getPriorityText(item.priority)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              {item.relatedData.orderNumber && (
                <div>
                  <span className="text-ink-500">订单编号：</span>
                  <span className="font-medium">{item.relatedData.orderNumber}</span>
                </div>
              )}
              {item.relatedData.leadNumber && (
                <div>
                  <span className="text-ink-500">线索编号：</span>
                  <span className="font-medium">{item.relatedData.leadNumber}</span>
                </div>
              )}
              {item.relatedData.customerName && (
                <div>
                  <span className="text-ink-500">客户姓名：</span>
                  <span className="font-medium">{item.relatedData.customerName}</span>
                </div>
              )}
              {item.relatedData.contactPhone && (
                <div>
                  <span className="text-ink-500">联系电话：</span>
                  <span className="font-medium">{item.relatedData.contactPhone}</span>
                </div>
              )}
              {item.relatedData.productName && (
                <div>
                  <span className="text-ink-500">产品名称：</span>
                  <span className="font-medium">{item.relatedData.productName}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-ink-500 mb-4">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>创建时间：{new Date(item.createdAt).toLocaleString('zh-CN')}</span>
              </div>
              {item.dueDate && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>截止时间：{new Date(item.dueDate).toLocaleString('zh-CN')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <PaperButton 
            variant="outline" 
            size="sm"
            onClick={() => onAction(item, 'view')}
          >
            查看
          </PaperButton>
          <PaperButton 
            variant="primary" 
            size="sm"
            onClick={() => onAction(item, 'process')}
          >
            处理
            <ArrowRight className="ml-1 h-3 w-3" />
          </PaperButton>
        </div>
      </PaperCardContent>
    </PaperCard>
  );
};

export default TodoCard;
