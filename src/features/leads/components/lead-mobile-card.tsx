'use client';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { LeadData, STATUS_MAP, INTENTION_MAP, SYSTEM_TAGS } from './lead-table-constants';

interface LeadMobileCardProps {
  lead: LeadData;
  isManager: boolean;
  handleAction: (action: string, leadId: string) => void;
}

/**
 * 线索移动端卡片组件
 * 在小屏幕设备上以卡片形式展示线索基本信息
 */
export function LeadMobileCard({ lead, isManager, handleAction }: LeadMobileCardProps) {
  const statusInfo = lead.status
    ? (STATUS_MAP[lead.status as string] ?? { label: lead.status, variant: 'secondary' as const })
    : { label: '未知', variant: 'secondary' as const };
  const intentionInfo = lead.intentionLevel
    ? (INTENTION_MAP[lead.intentionLevel as string] ?? null)
    : null;

  return (
    <div
      className="bg-card space-y-3 rounded-lg border p-4 shadow-sm"
      onClick={() => handleAction('view', lead.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleAction('view', lead.id)}
    >
      {/* 顶部：编号 + 状态 */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground font-mono text-xs">{lead.leadNo}</span>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>

      {/* 客户信息 */}
      <div className="space-y-1">
        <p className="font-medium">{lead.customerName}</p>
        {lead.customerPhone && (
          <p className="text-muted-foreground text-sm">{lead.customerPhone}</p>
        )}
        {lead.community && (
          <p className="text-muted-foreground truncate text-xs">{lead.community}</p>
        )}
      </div>

      {/* 意向 + 标签 */}
      <div className="flex flex-wrap gap-1.5">
        {intentionInfo && (
          <span
            className={cn('rounded px-1.5 py-0.5 text-xs font-medium', intentionInfo.className)}
          >
            {intentionInfo.label}意向
          </span>
        )}
        {Array.isArray(lead.tags) &&
          lead.tags.map((tag: string) => {
            const tagInfo = SYSTEM_TAGS[tag];
            return tagInfo ? (
              <span
                key={tag}
                className={cn('rounded px-1.5 py-0.5 text-xs font-medium', tagInfo.className)}
              >
                {tagInfo.label}
              </span>
            ) : (
              <span
                key={tag}
                className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs"
              >
                {tag}
              </span>
            );
          })}
      </div>

      {/* 底部：销售 + 操作 */}
      <div className="flex items-center justify-between border-t pt-1">
        <span className="text-muted-foreground max-w-[60%] truncate text-xs">
          {lead.assignedSales?.name ?? '未分配'}
        </span>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {isManager && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handleAction('assign', lead.id)}
            >
              分配
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => handleAction('followup', lead.id)}
          >
            跟进
          </Button>
        </div>
      </div>
    </div>
  );
}
