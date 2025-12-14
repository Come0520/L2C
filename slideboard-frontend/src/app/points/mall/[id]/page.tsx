'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperInput } from '@/components/ui/paper-input';
import { PaperModal } from '@/components/ui/paper-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { pointsService } from '@/services/points.client';
import { MallProduct, PointsAccount } from '@/types/points';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<MallProduct | null>(null);
  const [account, setAccount] = useState<PointsAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchanging, setExchanging] = useState(false);

  // 兑换表单
  const [shippingAddress, setShippingAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [remark, setRemark] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [productData, accountData] = await Promise.all([
        pointsService.getProductById(productId),
        pointsService.getAccount(),
      ]);
      setProduct(productData);
      setAccount(accountData);
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('加载商品信息失败');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadData();
  }, [productId, loadData]);

  const handleExchange = async () => {
    if (!product || !account) return;

    if (!shippingAddress || !contactPhone) {
      toast.warning('请填写收货地址和联系电话');
      return;
    }

    if (account.available_points < product.points_required) {
      toast.error('积分不足,无法兑换');
      return;
    }

    try {
      setExchanging(true);
      
      // Use API for secure transaction
      const response = await fetch('/api/points/mall/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            product_id: product.id,
            shipping_address: shippingAddress,
            contact_phone: contactPhone,
            remark: remark || undefined,
        })
      });

      const result = await response.json();

      if (!response.ok) {
          throw new Error(result.error || 'Redemption failed');
      }
      
      setShowExchangeModal(false);
      toast.success('兑换成功! 您可以在"兑换记录"中查看订单详情');
      router.push('/points/orders');
    } catch (err: any) {
      console.error('Exchange failed:', err);
      toast.error(err.message || '兑换失败,请稍后重试');
    } finally {
      setExchanging(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      electronics: '电子产品',
      home: '家居用品',
      gift_card: '礼品卡',
      special: '专属特权',
      other: '其他',
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
          <Skeleton className="h-8 w-32" />
          <PaperCard>
            <PaperCardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Skeleton className="aspect-square rounded-lg w-full" />
                    <div className="space-y-6">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </div>
            </PaperCardContent>
          </PaperCard>
        </div>
    );
  }

  if (!product) {
    return (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-paper-ink-secondary mb-4">商品不存在或已下架</p>
          <PaperButton onClick={() => router.push('/points/mall')}>
            返回商城
          </PaperButton>
        </div>
    );
  }

  const canExchange = account && account.available_points >= product.points_required && product.stock_quantity > 0;

  return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* 返回按钮 */}
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
        >
            <PaperButton
            variant="ghost"
            size="sm"
            onClick={() => router.push('/points/mall')}
            >
            ← 返回商城
            </PaperButton>
        </motion.div>

        {/* 商品详情 */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
        >
            <PaperCard>
            <PaperCardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 左侧:商品图片 */}
                <div className="aspect-square bg-paper-background rounded-lg flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                    <Image
                        src={product.image_url}
                        alt={product.name}
                        width={500}
                        height={500}
                        className="w-full h-full object-cover"
                    />
                    ) : (
                    <div className="text-9xl">🎁</div>
                    )}
                </div>

                {/* 右侧:商品信息 */}
                <div className="space-y-6">
                    <div>
                    <span className="text-sm text-paper-ink-secondary bg-paper-background px-3 py-1 rounded">
                        {getCategoryLabel(product.category)}
                    </span>
                    </div>

                    <div>
                    <h1 className="text-3xl font-bold text-paper-ink mb-2">
                        {product.name}
                    </h1>
                    {product.description && (
                        <p className="text-paper-ink-secondary leading-relaxed">
                        {product.description}
                        </p>
                    )}
                    </div>

                    <div className="flex items-baseline gap-2 py-4 border-y border-paper-border">
                    <span className="text-sm text-paper-ink-secondary">所需积分:</span>
                    <span className="text-4xl font-bold text-paper-primary">
                        {product.points_required}
                    </span>
                    <span className="text-lg text-paper-ink-secondary">分</span>
                    </div>

                    <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-paper-ink-secondary">库存:</span>
                        <span className="font-medium text-paper-ink">
                        {product.stock_quantity} 件
                        </span>
                    </div>
                    {account && (
                        <div className="flex justify-between text-sm">
                        <span className="text-paper-ink-secondary">我的积分:</span>
                        <span className={`font-medium ${canExchange ? 'text-paper-success' : 'text-paper-error'}`}>
                            {account.available_points.toLocaleString()} 分
                        </span>
                        </div>
                    )}
                    </div>

                    <PaperButton
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={() => setShowExchangeModal(true)}
                    disabled={!canExchange}
                    >
                    {!account ? '请先登录' :
                    product.stock_quantity <= 0 ? '已售罄' :
                    account.available_points < product.points_required ? '积分不足' :
                    '立即兑换'}
                    </PaperButton>

                    {!account && (
                    <div className="text-sm text-paper-ink-secondary text-center">
                        兑换商品需要登录并激活积分账户
                    </div>
                    )}
                </div>
                </div>
            </PaperCardContent>
            </PaperCard>
        </motion.div>

        {/* 兑换说明 */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <PaperCard className="bg-paper-info-light border-paper-info-border">
            <PaperCardHeader>
                <PaperCardTitle>兑换说明</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
                <ul className="text-sm text-paper-ink-secondary space-y-2">
                <li>• 积分兑换后将立即扣除,不可退还</li>
                <li>• 兑换成功后7个工作日内发货</li>
                <li>• 请填写正确的收货地址和联系电话</li>
                <li>• 如有疑问请联系客服咨询</li>
                </ul>
            </PaperCardContent>
            </PaperCard>
        </motion.div>

        {/* 兑换确认Modal */}
        <PaperModal
          isOpen={showExchangeModal}
          onClose={() => setShowExchangeModal(false)}
          title="确认兑换"
        >
          <div className="space-y-4">
            <div className="bg-paper-background p-4 rounded-lg border border-paper-border">
              <h3 className="font-medium text-paper-ink mb-2">{product.name}</h3>
              <p className="text-paper-ink-secondary text-sm mb-3">
                需要扣除 <span className="font-bold text-paper-primary">{product.points_required}</span> 积分
              </p>
              <p className="text-xs text-paper-ink-secondary">
                剩余积分: {account ? (account.available_points - product.points_required).toLocaleString() : 0} 分
              </p>
            </div>

            <PaperInput
              label="收货地址"
              placeholder="请输入详细收货地址"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              required
            />

            <PaperInput
              label="联系电话"
              placeholder="请输入联系电话"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              required
            />

            <PaperInput
              label="备注(选填)"
              placeholder="如有特殊要求请在此说明"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />

            <div className="flex gap-3 pt-4">
              <PaperButton
                variant="outline"
                onClick={() => setShowExchangeModal(false)}
                className="flex-1"
                disabled={exchanging}
              >
                取消
              </PaperButton>
              <PaperButton
                variant="primary"
                onClick={handleExchange}
                className="flex-1"
                disabled={exchanging}
              >
                {exchanging ? '提交中...' : '确认兑换'}
              </PaperButton>
            </div>
          </div>
        </PaperModal>
      </div>
  );
}
