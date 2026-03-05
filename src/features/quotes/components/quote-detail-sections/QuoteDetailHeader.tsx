'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Send from 'lucide-react/dist/esm/icons/send';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Ruler from 'lucide-react/dist/esm/icons/ruler';
import Layout from 'lucide-react/dist/esm/icons/layout';
import Save from 'lucide-react/dist/esm/icons/save';
import { SendToCustomerDialog } from '@/shared/components/send-to-customer-dialog';
import { submitQuote, copyQuote } from '@/features/quotes/actions/mutations';
import { QuoteVersionDropdown } from '../quote-version-dropdown';
import { QuoteToOrderButton } from '../quote-to-order-button';
import { QuoteExportMenu } from '../quote-export-menu';
import { QuoteConfigDialog } from '../quote-config-dialog';
import { QuoteConfig } from '@/services/quote-config.service';
import { VersionQuote } from '../../types';
import { QUOTE_DIALOGS as DIALOGS } from '@/features/quotes/constants/dialogs';
import { type RiskCheckResult } from '@/features/quotes/logic/risk-control';
import { getQuote, getQuoteVersions } from '@/features/quotes/actions/queries';

const QuoteVersionCompare = dynamic(
  () => import('../quote-version-compare').then((mod) => mod.QuoteVersionCompare),
  { ssr: false, loading: () => <div className="bg-muted h-96 w-full animate-pulse rounded-lg" /> }
);

/** 精简的 quote 数据类型 */
type QuoteData = NonNullable<Awaited<ReturnType<typeof getQuote>>['data']>;
type QuoteVersion = Awaited<ReturnType<typeof getQuoteVersions>>[number];

interface QuoteDetailHeaderProps {
  /** 报价单数据 */
  quote: QuoteData;
  /** 所有历史版本 */
  versions: QuoteVersion[];
  /** 当前配置 */
  config?: QuoteConfig;
  /** 风控检查结果 */
  riskResult: RiskCheckResult | null;
  /** 设置当前激活的对话框 */
  setActiveDialog: (dialog: string | null) => void;
  /** 保存回调 */
  onSave: () => void;
}

/**
 * 报价单顶部操作栏组件
 *
 * @description 包含：返回按钮、报价单标题、状态 Badge、版本对比下拉、
 * 所有的操作按钮（提交审核、导出、批准/驳回、发送给客户）
 */
export function QuoteDetailHeader({
  quote,
  versions,
  config,
  riskResult,
  setActiveDialog,
  onSave,
}: QuoteDetailHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      {/* 左侧：标题区 */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/quotes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">报价单详情: {quote.quoteNo}</h2>
            <QuoteVersionDropdown
              currentQuoteId={quote.id}
              currentVersion={quote.version || 1}
              versions={versions.map((v) => ({
                ...v,
                status: v.status || 'DRAFT',
                createdAt: v.createdAt ? new Date(v.createdAt) : new Date(),
                totalAmount: (v as { totalAmount?: number | string }).totalAmount,
                finalAmount: (v as { finalAmount?: number | string }).finalAmount,
              }))}
              onCopy={async () => {
                toast.promise(
                  (async () => {
                    const res = await copyQuote({ quoteId: quote.id });
                    if (res?.error) throw new Error(res.error);
                    if (res?.data?.id) {
                      router.push(`/quotes/${res.data.id}`);
                    }
                  })(),
                  {
                    loading: '正在复制报价单...',
                    success: '复制成功！',
                    error: (err) => err.message || '复制失败',
                  }
                );
              }}
            />
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-muted-foreground text-sm">{quote.customer?.name}</span>
            <Badge
              variant={
                quote.status === 'ACCEPTED'
                  ? 'success'
                  : quote.status === 'REJECTED'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {quote.status === 'DRAFT' && '草稿'}
              {quote.status === 'PENDING_APPROVAL' && '待审批'}
              {quote.status === 'PENDING_CUSTOMER' && '待客户确认'}
              {quote.status === 'ACCEPTED' && '已接受'}
              {quote.status === 'REJECTED' && '已拒绝'}
              {quote.status === 'EXPIRED' && '已过期'}
            </Badge>
          </div>
          {quote.approvalRequired && quote.status === 'PENDING_APPROVAL' && (
            <div className="mt-1 flex items-center text-xs text-amber-600">
              <AlertTriangle className="mr-1 h-3 w-3" />
              风险控制: 需要审批 (毛利过低或折扣过高)
            </div>
          )}
        </div>
      </div>

      {/* 右侧：操作按钮区 */}
      <div className="flex items-center gap-2">
        {versions.length > 1 && (
          <QuoteVersionCompare
            currentQuote={{
              id: quote.id,
              version: quote.version,
              totalAmount: quote.totalAmount || 0,
              discountAmount: quote.discountAmount || 0,
              finalAmount: quote.finalAmount || 0,
              items: quote.items as VersionQuote['items'],
              rooms: quote.rooms as VersionQuote['rooms'],
            }}
            versions={versions.map((v) => ({
              id: v.id,
              version: v.version,
              status: v.status || 'DRAFT',
              createdAt: v.createdAt ? new Date(v.createdAt) : new Date(),
            }))}
          />
        )}

        {/* 草稿状态操作 */}
        {quote.status === 'DRAFT' && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveDialog(DIALOGS.MEASURE_IMPORT)}
            >
              <Ruler className="mr-2 h-4 w-4" /> 导入测量
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveDialog(DIALOGS.SAVE_TEMPLATE)}
            >
              <Layout className="mr-2 h-4 w-4" /> 保存为模板
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={riskResult?.hardStop}
              title={riskResult?.hardStop ? '存在严重风险，无法提交' : '提交审核'}
              className={riskResult?.hardStop ? 'cursor-not-allowed opacity-50' : ''}
              onClick={async () => {
                if (riskResult?.hardStop) {
                  toast.error('报价单存在严重风险，请修正后再提交');
                  return;
                }
                toast.promise(
                  submitQuote({ id: quote.id }).then((res) => {
                    if (res.error) throw new Error(res.error);
                    return res.data;
                  }),
                  {
                    loading: '提交中...',
                    success: '报价单已提交',
                    error: (err) => `提交失败: ${err.message}`,
                  }
                );
              }}
            >
              <Send className="mr-2 h-4 w-4" /> 提交审核
            </Button>
          </>
        )}

        <QuoteExportMenu quote={quote} />

        {/* 待审批状态：批准/驳回 */}
        {quote.status === 'PENDING_APPROVAL' && (
          <>
            <Button variant="outline" size="sm" onClick={() => setActiveDialog(DIALOGS.REJECT)}>
              <XCircle className="mr-2 h-4 w-4" /> 驳回
            </Button>
            <Button variant="default" size="sm" onClick={() => setActiveDialog(DIALOGS.APPROVE)}>
              <CheckCircle className="mr-2 h-4 w-4" /> 批准
            </Button>
          </>
        )}

        {/* 审批通过或待客户确认 */}
        {(quote.status === 'APPROVED' || quote.status === 'PENDING_CUSTOMER') && (
          <SendToCustomerDialog
            type="quote"
            id={quote.id}
            description={`将报价单 ${quote.quoteNo} 发送给客户，客户点击链接可在小程序中签字确认。`}
          />
        )}

        {/* 转订单 */}
        <div className="flex items-center gap-2">
          <QuoteToOrderButton
            quoteId={quote.id}
            customerId={quote.customerId}
            defaultAmount={quote.finalAmount || undefined}
          />
        </div>

        <Button variant="outline" size="sm" onClick={onSave}>
          <Save className="mr-2 h-4 w-4" /> 保存
        </Button>
        <QuoteConfigDialog currentConfig={config} />
      </div>
    </div>
  );
}
