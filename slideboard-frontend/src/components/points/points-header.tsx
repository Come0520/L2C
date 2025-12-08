'use client';

import { useRouter } from 'next/navigation';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card';
import { PointsAccount } from '@/types/points';


interface PointsHeaderProps {
  account: PointsAccount | null;
  loading?: boolean;
}

/**
 * 积分头部信息组件
 */
export default function PointsHeader({ account, loading }: PointsHeaderProps) {
  const router = useRouter();

  if (loading) {
    return (
      <PaperCard>
        <PaperCardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-paper-background rounded w-32 mb-2"></div>
            <div className="h-6 bg-paper-background rounded w-48"></div>
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
            <span className="text-3xl">⚠️</span>
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
        <div className="flex items-center justify-between">
          {/* 积分信息 */}
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-sm text-paper-ink-secondary">我的积分</span>
              <span className="text-4xl font-bold text-paper-primary">
                {account.available_points.toLocaleString()}
              </span>
              <span className="text-lg text-paper-ink-secondary">分</span>
            </div>
            <div className="flex gap-6 text-sm text-paper-ink-secondary">
              <div>
                <span>累计: </span>
                <span className="font-medium text-paper-ink">{account.total_points.toLocaleString()}</span>
                <span> 分</span>
              </div>
              {account.pending_points > 0 && (
                <div>
                  <span>在途: </span>
                  <span className="font-medium text-paper-info">{account.pending_points.toLocaleString()}</span>
                  <span> 分</span>
                </div>
              )}
              {account.frozen_points > 0 && (
                <div>
                  <span>冻结: </span>
                  <span className="font-medium text-paper-warning">{account.frozen_points.toLocaleString()}</span>
                  <span> 分</span>
                </div>
              )}
            </div>
          </div>

          {/* 快捷操作 */}
          <div className="flex gap-2">
            <PaperButton
              variant="outline"
              size="sm"
              onClick={() => router.push('/points/orders')}
            >
              兑换记录
            </PaperButton>
            <PaperButton
              variant="outline"
              size="sm"
              onClick={() => router.push('/points/transactions')}
            >
              积分明细
            </PaperButton>
          </div>
        </div>
      </PaperCardContent>
    </PaperCard>
  );
}
