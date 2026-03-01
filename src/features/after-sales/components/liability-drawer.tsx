'use client';

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/shared/ui/sheet';
import { Badge } from '@/shared/ui/badge';
import { LiabilityNotice } from '../types';
import { format } from 'date-fns';
import { Separator } from '@/shared/ui/separator';
import { FileText, AlertCircle, Gavel, CheckCircle2 } from 'lucide-react';

interface LiabilityDrawerProps {
  notice: LiabilityNotice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LiabilityDrawer({ notice, open, onOpenChange }: LiabilityDrawerProps) {
  if (!notice) return null;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return '草稿';
      case 'PENDING_CONFIRM':
        return '待确认';
      case 'CONFIRMED':
        return '已确认';
      case 'DISPUTED':
        return '争议中';
      case 'ARBITRATED':
        return '已仲裁';
      default:
        return status;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="text-primary h-5 w-5" />
            定责单详情
          </SheetTitle>
          <SheetDescription>单号: {notice.noticeNo}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">当前状态</span>
            <Badge variant={notice.status === 'CONFIRMED' ? 'default' : 'secondary'}>
              {getStatusLabel(notice.status)}
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground block">责任方类型</span>
              <span className="font-medium">{notice.liablePartyType}</span>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground block">扣款金额</span>
              <span className="text-lg font-bold text-red-600">
                ¥{Number(notice.amount).toFixed(2)}
              </span>
            </div>
            <div className="col-span-2 space-y-1">
              <span className="text-muted-foreground block">原因分类</span>
              <span className="font-medium">{notice.liabilityReasonCategory || '-'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-muted-foreground flex items-center gap-1 text-sm">
              <AlertCircle className="h-4 w-4" /> 定责原因
            </span>
            <div className="bg-muted/50 rounded-md p-3 text-sm leading-relaxed">
              {notice.reason}
            </div>
          </div>

          {notice.disputeReason && (
            <div className="animate-in fade-in slide-in-from-top-2 space-y-2">
              <span className="flex items-center gap-1 text-sm font-medium text-orange-600">
                <AlertCircle className="h-4 w-4" /> 争议理由
              </span>
              <div className="rounded-md border border-orange-100 bg-orange-50 p-3 text-sm">
                {notice.disputeReason}
              </div>
            </div>
          )}

          {notice.arbitrationResult && (
            <div className="animate-in fade-in slide-in-from-top-2 space-y-2">
              <span className="flex items-center gap-1 text-sm font-medium text-blue-600">
                <Gavel className="h-4 w-4" /> 仲裁结果
              </span>
              <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm">
                {notice.arbitrationResult}
              </div>
            </div>
          )}

          <Separator />

          <div className="text-muted-foreground space-y-3 text-xs">
            <div className="flex justify-between">
              <span>创建时间</span>
              <span>{format(new Date(notice.createdAt), 'yyyy-MM-dd HH:mm:ss')}</span>
            </div>
            {notice.confirmedAt && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> 确认时间
                </span>
                <span>{format(new Date(notice.confirmedAt), 'yyyy-MM-dd HH:mm:ss')}</span>
              </div>
            )}
            {notice.financeStatus && (
              <div className="flex justify-between">
                <span>财务同步状态</span>
                <span
                  className={
                    notice.financeStatus === 'SYNCED' ? 'text-green-600' : 'text-orange-600'
                  }
                >
                  {notice.financeStatus}
                </span>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
