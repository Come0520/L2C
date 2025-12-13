'use client';

import { Gift, Coins, ShoppingCart, Loader2 } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { pointsService } from '@/services/points.client';
import type { PointsAccount } from '@/types/points';

export default function PointsPage() {
  const [account, setAccount] = useState<PointsAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAccount() {
      try {
        setLoading(true);
        const data = await pointsService.getAccount();
        setAccount(data);
      } catch (err) {
        console.error('Failed to load points account:', err);
        setError('加载积分账户失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    }

    loadAccount();
  }, []);

  return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">积分系统</h1>
            <p className="text-ink-500 mt-1">积分账户、交易记录、活动规则</p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-ink-500" />
          </div>
        )}

        {error && (
          <div className="bg-error-100 border border-error-300 text-error-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PaperCard>
              <PaperCardHeader>
                <PaperCardTitle>账户总览</PaperCardTitle>
              </PaperCardHeader>
              <PaperCardContent>
                <div className="text-center p-6 bg-paper-300 rounded-lg">
                  <div className="text-3xl font-bold text-ink-800 mb-1">
                    {account ? account.total_points.toLocaleString() : '0'}
                  </div>
                  <div className="text-sm text-ink-500">累计积分</div>
                  {account && (
                    <>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-paper-400 p-2 rounded">
                          <div className="text-success-600 font-semibold">
                            {account.available_points.toLocaleString()}
                          </div>
                          <div className="text-ink-500 text-xs">可用积分</div>
                        </div>
                        <div className="bg-paper-400 p-2 rounded">
                          <div className="text-warning-600 font-semibold">
                            {account.frozen_points.toLocaleString()}
                          </div>
                          <div className="text-ink-500 text-xs">冻结积分</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <Link href="/points/accounts">
                  <PaperButton className="mt-4" variant="primary"><Coins className="h-4 w-4 mr-2" /> 管理账户</PaperButton>
                </Link>
              </PaperCardContent>
            </PaperCard>

            <PaperCard>
              <PaperCardHeader>
                <PaperCardTitle>交易记录</PaperCardTitle>
              </PaperCardHeader>
              <PaperCardContent>
                <p className="text-ink-600">最近获得与消耗的积分明细。</p>
                <Link href="/points/transactions">
                  <PaperButton className="mt-4" variant="outline"><Gift className="h-4 w-4 mr-2" /> 查看记录</PaperButton>
                </Link>
              </PaperCardContent>
            </PaperCard>

            <PaperCard>
              <PaperCardHeader>
                <PaperCardTitle>积分商城</PaperCardTitle>
              </PaperCardHeader>
              <PaperCardContent>
                <p className="text-ink-600">兑换商品与活动礼品，支持规则化管理。</p>
                <Link href="/products/mall">
                  <PaperButton className="mt-4" variant="primary"><ShoppingCart className="h-4 w-4 mr-2" /> 进入商城</PaperButton>
                </Link>
              </PaperCardContent>
            </PaperCard>
          </div>
        )}

        {!loading && !error && !account && (
          <div className="text-center py-12">
            <p className="text-ink-500 mb-4">您还没有积分账户</p>
            <p className="text-sm text-ink-400">完成首次操作后将自动创建账户</p>
          </div>
        )}
      </div>
  );
}
