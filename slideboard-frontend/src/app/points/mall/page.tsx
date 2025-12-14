'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import CategoryFilter from '@/components/points/category-filter';
import PointsHeader from '@/components/points/points-header';
import ProductCard from '@/components/points/product-card';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { Skeleton } from '@/components/ui/skeleton';
import { pointsService } from '@/services/points.client';
import { PointsAccount, MallProduct, MallProductCategory } from '@/types/points';

export default function PointsMallPage() {
  useRouter();
  const [account, setAccount] = useState<PointsAccount | null>(null);
  const [products, setProducts] = useState<MallProduct[]>([]);
  const [activeCategory, setActiveCategory] = useState<MallProductCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccount = useCallback(async () => {
    try {
      const data = await pointsService.getAccount();
      setAccount(data);
    } catch (err) {
      console.error('Failed to load points account:', err);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const category = activeCategory === 'all' ? undefined : activeCategory;
      const data = await pointsService.getProducts(category);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('加载商品失败,请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  // 加载积分账户
  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  // 加载商品列表
  useEffect(() => {
    loadProducts();
  }, [activeCategory, loadProducts]);

  return (
      <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* 页面标题 */}
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
        >
          <h1 className="text-3xl font-bold text-paper-ink">积分商城</h1>
        </motion.div>

        {/* 积分信息 */}
        <PointsHeader account={account} loading={!account && loading} />

        {/* 商品列表 */}
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>精选商品</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent className="space-y-6">
            {/* 分类筛选 */}
            <CategoryFilter
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />

            {/* 商品网格 */}
            <AnimatePresence mode='wait'>
                {loading ? (
                <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="aspect-square rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                    ))}
                </motion.div>
                ) : error ? (
                <motion.div 
                    key="error"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                >
                    <div className="text-4xl mb-4">❌</div>
                    <p className="text-paper-ink-secondary">{error}</p>
                </motion.div>
                ) : products.length === 0 ? (
                <motion.div 
                    key="empty"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                >
                    <div className="text-4xl mb-4">🎁</div>
                    <p className="text-paper-ink-secondary">暂无商品</p>
                </motion.div>
                ) : (
                <motion.div 
                    key="list"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {products.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                    ))}
                </motion.div>
                )}
            </AnimatePresence>
          </PaperCardContent>
        </PaperCard>

        {/* 兑换说明 */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
        >
            <PaperCard className="bg-paper-info-light border-paper-info-border">
            <PaperCardContent className="p-4">
                <div className="flex items-start gap-3">
                <span className="text-2xl">ℹ️</span>
                <div className="flex-1">
                    <h3 className="font-medium text-paper-ink mb-2">兑换说明</h3>
                    <ul className="text-sm text-paper-ink-secondary space-y-1">
                    <li>• 积分兑换后不可退还,请谨慎选择</li>
                    <li>• 兑换成功后7个工作日内发货</li>
                    <li>• 如有问题请联系客服</li>
                    </ul>
                </div>
                </div>
            </PaperCardContent>
            </PaperCard>
        </motion.div>
      </div>
  );
}
