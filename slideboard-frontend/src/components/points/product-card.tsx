'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card';
import { MallProduct } from '@/shared/types/points';

const CATEGORY_LABELS: Record<string, string> = {
  electronics: '电子产品',
  home: '家居用品',
  gift_card: '礼品卡',
  special: '专属特权',
  other: '其他',
};

interface ProductCardProps {
  product: MallProduct;
  index?: number;
}

/**
 * 商品卡片组件
 */
export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const getCategoryLabel = (category: string) => {
    return CATEGORY_LABELS[category] || category;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <PaperCard className="h-full hover:shadow-lg transition-shadow duration-200 group overflow-hidden">
        <PaperCardContent className="p-4 flex flex-col h-full">
          <Link href={`/points/mall/${product.id}`} className="block">
            {/* 商品图片 */}
            <div className="aspect-square bg-paper-background rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="text-6xl transition-transform duration-300 group-hover:scale-110">🎁</div>
              )}
              {product.stock_quantity <= 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-lg bg-black/70 px-3 py-1 rounded">已售罄</span>
                </div>
              )}
            </div>

            {/* 商品信息 */}
            <div className="mb-2">
              <span className="text-xs text-paper-ink-secondary bg-paper-background px-2 py-1 rounded">
                {getCategoryLabel(product.category)}
              </span>
            </div>

            <h3 className="font-medium text-paper-ink mb-2 line-clamp-2 min-h-[3rem] group-hover:text-paper-primary transition-colors">
              {product.name}
            </h3>

            {product.description && (
              <p className="text-sm text-paper-ink-secondary mb-3 line-clamp-2">
                {product.description}
              </p>
            )}
          </Link>

          {/* 积分和库存 */}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-paper-primary">
                  {product.points_required}
                </span>
                <span className="text-sm text-paper-ink-secondary">积分</span>
              </div>
              <span className="text-xs text-paper-ink-secondary">
                库存 {product.stock_quantity}
              </span>
            </div>

            {/* 操作按钮 */}
            <Link href={`/points/mall/${product.id}`} className={product.stock_quantity <= 0 ? 'pointer-events-none' : ''}>
              <PaperButton
                variant="primary"
                size="sm"
                className="w-full"
                disabled={product.stock_quantity <= 0}
              >
                {product.stock_quantity > 0 ? '立即兑换' : '已售罄'}
              </PaperButton>
            </Link>
          </div>
        </PaperCardContent>
      </PaperCard>
    </motion.div>
  );
}
