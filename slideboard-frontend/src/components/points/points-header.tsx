'use client';

import { AlertTriangle, History, FileText } from 'lucide-react';
import Link from 'next/link';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card';
interface PointsAccount {
  available_points: number;
  total_points: number;
  pending_points?: number;
  frozen_points?: number;
}


interface PointsHeaderProps {
  account: PointsAccount | null;
  loading?: boolean;
}

/**
 * 积分头部信息组件
 */
export default function PointsHeader({ account, loading }: PointsHeaderProps) {
  if (loading) {
    return (
      <PaperCard>
        <PaperCardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 animate-pulse">
            <div className="flex-1 space-y-4 w-full">
              <div className="flex items-baseline gap-2">
                <div className="h-4 bg-paper-200 rounded w-16"></div>
                <div className="h-10 bg-paper-200 rounded w-32"></div>
                <div className="h-5 bg-paper-200 rounded w-8"></div>
              </div>
              <div className="flex gap-6">
                <div className="h-4 bg-paper-200 rounded w-20"></div>
                <div className="h-4 bg-paper-200 rounded w-20"></div>
                <div className="h-4 bg-paper-200 rounded w-20"></div>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="h-9 bg-paper-200 rounded w-24"></div>
              <div className="h-9 bg-paper-200 rounded w-24"></div>
            </div>
          </div>
        </PaperCardContent>
      </PaperCard>
    );
  }

  if (!account) {
    return (
      <PaperCard className="bg-paper-warning-light border-l-4 border-paper-warning">
        <PaperCardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-paper-warning" />
            <div>
              <h3 className="font-medium text-paper-ink mb-1">积分账户未激活</h3>
              <p className="text-sm text-paper-ink-secondary">
                请先完成首次登录或创建订单以激活积分账户
              </p>
            </div>
          </div>
        </PaperCardContent>
      </PaperCard>
    );
  }

  return (
    <PaperCard className="bg-gradient-to-r from-paper-primary-light to-paper-background">
      <PaperCardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* 积分信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-2 flex-wrap">
              <span className="text-sm text-paper-ink-secondary whitespace-nowrap">我的积分</span>
              <span className="text-4xl font-bold text-paper-primary break-all">
                {account.available_points.toLocaleString()}
              </span>
              <span className="text-lg text-paper-ink-secondary">分</span>
            </div>
            <div className="flex flex-wrap gap-4 sm:gap-6 text-sm text-paper-ink-secondary">
              <div className="whitespace-nowrap">
                <span>累计: </span>
                <span className="font-medium text-paper-ink">{account.total_points.toLocaleString()}</span>
                <span> 分</span>
              </div>
              {account.pending_points && account.pending_points > 0 && (
                <div className="whitespace-nowrap">
                  <span>在途: </span>
                  <span className="font-medium text-paper-info">{account.pending_points.toLocaleString()}</span>
                  <span> 分</span>
                </div>
              )}
              {account.frozen_points && account.frozen_points > 0 && (
                <div className="whitespace-nowrap">
                  <span>冻结: </span>
                  <span className="font-medium text-paper-warning">{account.frozen_points?.toLocaleString()}</span>
                  <span> 分</span>
                </div>
              )}
            </div>
          </div>

          {/* 快捷操作 */}
          <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
            <Link href="/points/orders" className="flex-1 md:flex-none">
              <PaperButton
                variant="outline"
                size="sm"
                className="w-full justify-center"
              >
                <History className="h-4 w-4 mr-2" />
                兑换记录
              </PaperButton>
            </Link>
            <Link href="/points/transactions" className="flex-1 md:flex-none">
              <PaperButton
                variant="outline"
                size="sm"
                className="w-full justify-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                积分明细
              </PaperButton>
            </Link>
          </div>
        </div>
      </PaperCardContent>
    </PaperCard>
  );
}
