'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Clock from 'lucide-react/dist/esm/icons/clock';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { toast } from 'sonner';
import { refreshExpiredQuotePrices } from '@/features/quotes/actions/expiration-actions';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { logger } from '@/shared/lib/logger';

interface QuoteExpirationBannerProps {
    quoteId: string;
    status: string;
    validUntil: Date | string | null;
    isReadOnly?: boolean;
}

export function QuoteExpirationBanner({
    quoteId,
    status,
    validUntil,
    isReadOnly = false
}: QuoteExpirationBannerProps) {
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // 解析日期
    const validUntilDate = validUntil ? new Date(validUntil) : null;
    const now = new Date();

    // 判断是否已过期
    const isExpired = status === 'EXPIRED' || (validUntilDate && validUntilDate < now && status !== 'ACCEPTED' && status !== 'REJECTED');

    // 如果没有过期且没有有效期限制，或者状态已终结（已接受/已拒绝），则不显示
    if ((!isExpired && !validUntilDate) || status === 'ACCEPTED' || status === 'REJECTED') {
        return null;
    }

    // 处理刷新价格
    const handleRefresh = async () => {
        try {
            setIsRefreshing(true);
            const result = await refreshExpiredQuotePrices({ quoteId, validDays: 7 });

            if (result?.data?.success) {
                toast.success('价格已刷新', {
                    description: `更新了 ${result.data.updatedItems} 个商品的价格，有效期延长至 ${new Date(result.data.newValidUntil).toLocaleDateString()}`
                });
                router.refresh();
            } else {
                toast.error('刷新失败', {
                    description: result?.error || '请稍后重试'
                });
            }
        } catch (error) {
            logger.error(error);
            toast.error('操作发生错误');
        } finally {
            setIsRefreshing(false);
        }
    };

    if (isExpired) {
        return (
            <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="mb-1 font-semibold flex items-center gap-2">
                    报价已过期
                </AlertTitle>
                <AlertDescription className="flex items-center justify-between flex-wrap gap-4">
                    <span className="text-sm opacity-90">
                        此报价的有效期已过（{validUntilDate?.toLocaleDateString()}）。
                        客户确认前需要刷新价格以获取最新的商品定价。
                    </span>

                    {!isReadOnly && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="bg-white hover:bg-red-50 text-red-700 border-red-200 hover:border-red-300 transition-all shadow-sm"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                        >
                            {isRefreshing ? (
                                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-3 w-3" />
                            )}
                            {isRefreshing ? '刷新中...' : '刷新价格并重新激活'}
                        </Button>
                    )}
                </AlertDescription>
            </Alert>
        );
    }

    // 临近过期提示 (比如剩余不到 3 天)
    const daysLeft = validUntilDate ? Math.ceil((validUntilDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999;

    if (daysLeft <= 3 && daysLeft > 0) {
        return (
            <Alert className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="mb-1 font-semibold">报价即将过期</AlertTitle>
                <AlertDescription>
                    此报价将在 {formatDistanceToNow(validUntilDate!, { locale: zhCN })}后过期。
                    请及时跟进客户以确认订单。
                </AlertDescription>
            </Alert>
        );
    }

    return null;
}
