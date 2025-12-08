'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card';
import { MallProduct } from '@/types/points';


interface ProductCardProps {
  product: MallProduct;
}

/**
 * 商品卡片组件
 */
export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();

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

  return (
    <PaperCard className="h-full hover:shadow-lg transition-shadow duration-200">
      <PaperCardContent className="p-4">
        {/* 商品图片 */}
        <div className="aspect-square bg-paper-background rounded-lg mb-3 flex items-center justify-center overflow-hidden">
          {product.image_url ? (
            <Image 
              src={product.image_url} 
              alt={product.name}
              width={300}
              height={300}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-6xl">🎁</div>
          )}
        </div>

        {/* 商品信息 */}
        <div className="mb-2">
          <span className="text-xs text-paper-ink-secondary bg-paper-background px-2 py-1 rounded">
            {getCategoryLabel(product.category)}
          </span>
        </div>

        <h3 className="font-medium text-paper-ink mb-2 line-clamp-2 min-h-[3rem]">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-sm text-paper-ink-secondary mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* 积分和库存 */}
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
        <PaperButton
          variant="primary"
          size="sm"
          className="w-full"
          onClick={() => router.push(`/points/mall/${product.id}`)}
          disabled={product.stock_quantity <= 0}
        >
          {product.stock_quantity > 0 ? '立即兑换' : '已售罄'}
        </PaperButton>
      </PaperCardContent>
    </PaperCard>
  );
}
