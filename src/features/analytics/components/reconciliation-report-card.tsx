'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { cn } from '@/shared/lib/utils';
import { AlertCircle, CheckCircle, FileSearch, ArrowRight } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { AnalyticsErrorBoundary } from './analytics-error-boundary';

/**
 * 对账项数据
 */
interface ReconciliationItem {
  /** 文档编号 */
  documentNo: string;
  /** 文档类型 */
  documentType: string;
  /** 系统金额 */
  systemAmount: number;
  /** 外部金额（银行/第三方） */
  externalAmount: number;
  /** 差异金额 */
  difference: number;
  /** 对账状态 */
  status: 'matched' | 'unmatched' | 'pending';
  /** 备注 */
  remark?: string;
}

/**
 * 对账报表数据
 */
interface ReconciliationReportData {
  /** 对账期间 */
  period: string;
  /** 总记录数 */
  totalCount: number;
  /** 匹配记录数 */
  matchedCount: number;
  /** 不匹配记录数 */
  unmatchedCount: number;
  /** 待处理记录数 */
  pendingCount: number;
  /** 总差异金额 */
  totalDifference: number;
  /** 差异明细（只展示不匹配的） */
  unmatchedItems?: ReconciliationItem[];
}

interface ReconciliationReportCardProps {
  data: ReconciliationReportData;
  className?: string;
  /** 是否展开差异明细 */
  showDetails?: boolean;
}

/**
 * 财务对账准确性报表卡片
 *
 * 功能：
 * 1. 对账匹配率统计
 * 2. 差异高亮展示
 * 3. 差异明细列表
 */
export function ReconciliationReportCard({
  data,
  className,
  showDetails = true,
}: ReconciliationReportCardProps) {
  // 计算匹配率
  const matchRate = data.totalCount > 0 ? (data.matchedCount / data.totalCount) * 100 : 100;

  // 一致性状态
  const getConsistencyStatus = () => {
    if (matchRate === 100) return { label: '完全一致', color: 'secondary' as const };
    if (matchRate >= 95) return { label: '基本一致', color: 'default' as const };
    return { label: '存在差异', color: 'destructive' as const };
  };

  const status = getConsistencyStatus();

  // 格式化金额（显示正负）
  const formatDifference = (amount: number) => {
    const prefix = amount > 0 ? '+' : '';
    return `${prefix}¥${amount.toLocaleString()}`;
  };

  return (
    <AnalyticsErrorBoundary fallbackTitle="财务对账报表展示异常">
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FileSearch className="text-muted-foreground h-4 w-4" />
                财务对账报表
              </CardTitle>
              <CardDescription>对账期间: {data.period}</CardDescription>
            </div>
            <Badge variant={status.color}>{status.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 匹配率统计 */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
              <p className="text-2xl font-bold text-green-600">{data.matchedCount}</p>
              <p className="text-muted-foreground text-xs">已匹配</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
              <p className="text-2xl font-bold text-red-600">{data.unmatchedCount}</p>
              <p className="text-muted-foreground text-xs">不匹配</p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
              <p className="text-2xl font-bold text-yellow-600">{data.pendingCount}</p>
              <p className="text-muted-foreground text-xs">待处理</p>
            </div>
          </div>

          {/* 匹配率进度 */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">匹配率</span>
              <span
                className={cn(
                  'font-bold',
                  matchRate === 100
                    ? 'text-green-600'
                    : matchRate >= 95
                      ? 'text-yellow-600'
                      : 'text-red-600'
                )}
              >
                {matchRate.toFixed(1)}%
              </span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  matchRate === 100
                    ? 'bg-green-500'
                    : matchRate >= 95
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                )}
                style={{ width: `${matchRate}%` }}
              />
            </div>
          </div>

          {/* 差异汇总 */}
          {data.totalDifference !== 0 && (
            <div className="bg-destructive/10 border-destructive/20 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">差异汇总</span>
                </div>
                <span className="text-destructive text-lg font-bold">
                  {formatDifference(data.totalDifference)}
                </span>
              </div>
            </div>
          )}

          {/* 差异明细（可折叠） */}
          {showDetails && data.unmatchedItems && data.unmatchedItems.length > 0 && (
            <div className="space-y-2 border-t pt-2">
              <p className="text-sm font-medium">差异明细</p>
              <div className="max-h-[200px] space-y-2 overflow-y-auto">
                {data.unmatchedItems.map((item, index) => (
                  <div
                    key={index}
                    className="border-destructive/30 bg-destructive/5 rounded border p-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.documentNo}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.documentType}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        系统: ¥{item.systemAmount.toLocaleString()}
                      </span>
                      <ArrowRight className="text-muted-foreground h-3 w-3" />
                      <span className="text-muted-foreground">
                        外部: ¥{item.externalAmount.toLocaleString()}
                      </span>
                      <span
                        className={cn(
                          'ml-auto font-bold',
                          item.difference > 0 ? 'text-green-600' : 'text-red-600'
                        )}
                      >
                        {formatDifference(item.difference)}
                      </span>
                    </div>
                    {item.remark && (
                      <p className="text-muted-foreground mt-1 text-xs">{item.remark}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 完全匹配提示 */}
          {data.unmatchedCount === 0 && data.pendingCount === 0 && (
            <div className="rounded-lg bg-green-50 p-3 text-center dark:bg-green-900/20">
              <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-600" />
              <p className="text-sm font-medium text-green-600">数据完全一致</p>
              <p className="text-muted-foreground text-xs">共 {data.totalCount} 条记录全部匹配</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AnalyticsErrorBoundary>
  );
}
