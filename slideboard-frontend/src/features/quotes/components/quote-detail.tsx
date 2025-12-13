import React from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card';
import { QuoteVersion } from '@/shared/types/quote';

import { QuoteItemsTable } from './quote-items-table';

interface QuoteDetailProps {
  version: QuoteVersion;
  onEdit?: () => void;
  onConfirm?: () => void;
  onPublish?: () => void;
  onSetCurrent?: () => void;
  isCurrentVersion?: boolean;
}

export function QuoteDetail({ 
  version, 
  onEdit, 
  onConfirm, 
  onPublish, 
  onSetCurrent,
  isCurrentVersion 
}: QuoteDetailProps) {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return '已确认';
      case 'draft': return '草稿';
      case 'published': return '已发布';
      case 'expired': return '已过期';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-success-600 bg-success-50';
      case 'draft': return 'text-ink-600 bg-paper-100';
      case 'published': return 'text-primary-600 bg-primary-50';
      case 'expired': return 'text-warning-600 bg-warning-50';
      case 'cancelled': return 'text-error-600 bg-error-50';
      default: return 'text-ink-600 bg-paper-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-ink-500 mb-1">报价单号</p>
          <p className="font-medium">{version.quoteNo}</p>
        </div>
        <div>
          <p className="text-xs text-ink-500 mb-1">创建时间</p>
          <p className="font-medium">{new Date(version.createdAt).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-ink-500 mb-1">状态</p>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(version.status)}`}>
            {getStatusLabel(version.status)}
          </span>
        </div>
        <div>
          <p className="text-xs text-ink-500 mb-1">总金额</p>
          <p className="font-medium text-primary-600">¥{version.totalAmount.toLocaleString()}</p>
        </div>
      </div>

      <QuoteItemsTable items={version.items} totalAmount={version.totalAmount} />

      <div className="flex flex-wrap gap-2 justify-end pt-4 border-t border-theme-border">
        {version.status === 'draft' && onEdit && (
          <PaperButton variant="outline" size="sm" onClick={onEdit}>
            编辑报价
          </PaperButton>
        )}
        
        {version.status === 'draft' && onSetCurrent && !isCurrentVersion && (
          <PaperButton variant="secondary" size="sm" onClick={onSetCurrent}>
            设为当前版本
          </PaperButton>
        )}

        {version.status === 'draft' && onPublish && (
          <PaperButton variant="primary" size="sm" onClick={onPublish}>
            发布报价
          </PaperButton>
        )}

        {['draft', 'published'].includes(version.status) && onConfirm && (
          <PaperButton variant="success" size="sm" onClick={onConfirm}>
            确认报价
          </PaperButton>
        )}
      </div>
    </div>
  );
}
