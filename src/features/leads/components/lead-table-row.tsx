import React from 'react';
import { TableCell, TableRow } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Link from 'next/link';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import Phone from 'lucide-react/dist/esm/icons/phone';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import UserPlus from 'lucide-react/dist/esm/icons/user-plus';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import Eye from 'lucide-react/dist/esm/icons/eye';
import { cn } from '@/shared/lib/utils';
import { STATUS_MAP, INTENTION_MAP, SYSTEM_TAGS, LeadData } from './lead-table-constants';

/**
 * 根据状态和权限获取可用操作
 */
export function getActionsForStatus(status: string, isManager: boolean) {
  const actions: Array<{
    key: string;
    label: string;
    icon: React.ReactNode;
    variant?: 'destructive';
  }> = [];

  switch (status) {
    case 'PENDING_ASSIGNMENT':
      actions.push({ key: 'claim', label: '认领', icon: <UserPlus className="mr-2 h-4 w-4" /> });
      if (isManager) {
        actions.push({ key: 'assign', label: '分配', icon: <UserPlus className="mr-2 h-4 w-4" /> });
      }
      actions.push({
        key: 'void',
        label: '无效',
        icon: <XCircle className="mr-2 h-4 w-4" />,
        variant: 'destructive',
      });
      break;
    case 'PENDING_FOLLOWUP':
      actions.push({
        key: 'followup',
        label: '跟进',
        icon: <MessageSquare className="mr-2 h-4 w-4" />,
      });
      actions.push({
        key: 'void',
        label: '无效',
        icon: <XCircle className="mr-2 h-4 w-4" />,
        variant: 'destructive',
      });
      break;
    case 'FOLLOWING_UP':
      actions.push({ key: 'quote', label: '报价', icon: <FileText className="mr-2 h-4 w-4" /> });
      actions.push({
        key: 'followup',
        label: '跟进',
        icon: <MessageSquare className="mr-2 h-4 w-4" />,
      });
      actions.push({ key: 'invite', label: '邀约', icon: <Calendar className="mr-2 h-4 w-4" /> });
      actions.push({
        key: 'void',
        label: '无效',
        icon: <XCircle className="mr-2 h-4 w-4" />,
        variant: 'destructive',
      });
      break;
    case 'WON':
      actions.push({ key: 'view', label: '查看', icon: <Eye className="mr-2 h-4 w-4" /> });
      break;
    case 'INVALID':
      if (isManager) {
        actions.push({
          key: 'restore',
          label: '恢复',
          icon: <RotateCcw className="mr-2 h-4 w-4" />,
        });
      }
      actions.push({ key: 'view', label: '查看', icon: <Eye className="mr-2 h-4 w-4" /> });
      break;
    default:
      actions.push({ key: 'view', label: '查看', icon: <Eye className="mr-2 h-4 w-4" /> });
  }

  return actions;
}

export interface LeadTableRowProps {
  lead: LeadData;
  isManager: boolean;
  handleAction: (action: string, leadId: string) => void;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * 单行渲染组件
 */
export const LeadTableRow = React.memo(function LeadTableRow({
  lead,
  isManager,
  handleAction,
  style,
  className,
}: LeadTableRowProps) {
  const statusConfig = STATUS_MAP[lead.status || ''] || {
    label: lead.status || '未知',
    variant: 'secondary' as const,
  };
  const intentionConfig = lead.intentionLevel ? INTENTION_MAP[lead.intentionLevel] : null;
  const actions = getActionsForStatus(lead.status || '', isManager);
  const tags = lead.tags || [];

  return (
    <TableRow
      style={style}
      className={cn(
        'hover:bg-muted/50 group transition-all duration-200 active:scale-[0.99]',
        className
      )}
    >
      <TableCell className="font-medium">
        <Link href={`/leads/${lead.id}`} className="text-primary hover:underline">
          {lead.leadNo}
        </Link>
      </TableCell>

      <TableCell>
        <div className="flex flex-col">
          <span className="max-w-[120px] truncate font-medium">{lead.customerName}</span>
          <span className="text-muted-foreground flex items-center gap-1 text-[10px] sm:text-xs">
            <Phone className="h-3 w-3" />
            {lead.customerPhone}
          </span>
        </div>
      </TableCell>

      <TableCell className="hidden items-center md:flex">
        {intentionConfig ? (
          <Badge variant="outline" className={cn('font-medium', intentionConfig.className)}>
            {intentionConfig.label}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      <TableCell className="flex items-center">
        <Badge variant={statusConfig.variant} className="h-6 px-1.5 font-normal sm:px-2">
          {statusConfig.label}
        </Badge>
      </TableCell>

      <TableCell className="hidden items-center lg:flex">
        <div className="flex flex-wrap gap-1">
          {tags.length > 0 ? (
            tags.slice(0, 3).map((tag) => {
              const systemTag = SYSTEM_TAGS[tag];
              return (
                <Badge
                  key={tag}
                  variant="outline"
                  className={cn('h-5 px-1.5 text-[10px] font-normal', systemTag?.className)}
                >
                  {systemTag?.label || tag}
                </Badge>
              );
            })
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
          {tags.length > 3 && (
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
              +{tags.length - 3}
            </Badge>
          )}
        </div>
      </TableCell>

      <TableCell className="hidden max-w-[100px] items-center truncate xl:flex">
        {lead.sourceChannel?.name || '-'}
      </TableCell>

      <TableCell className="hidden items-center sm:flex">
        {lead.assignedSales?.name || (
          <span className="text-muted-foreground text-xs italic">未分配</span>
        )}
      </TableCell>

      <TableCell className="hidden items-center md:flex">
        {lead.lastActivityAt ? (
          <span
            className="text-muted-foreground text-xs"
            title={new Date(lead.lastActivityAt).toLocaleString()}
          >
            {formatDistanceToNow(new Date(lead.lastActivityAt), {
              addSuffix: true,
              locale: zhCN,
            })}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      <TableCell className="flex items-center justify-end text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="hover:bg-muted-foreground/10 h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">操作菜单</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="animate-in fade-in zoom-in-95 w-[160px] duration-200"
          >
            {actions.map((action) => (
              <DropdownMenuItem
                key={action.key}
                onClick={() => handleAction(action.key, lead.id)}
                className={cn(
                  'cursor-pointer transition-colors',
                  action.variant === 'destructive' && 'text-destructive focus:text-destructive'
                )}
              >
                {action.icon}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});
