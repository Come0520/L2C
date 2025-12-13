'use client';

import { 
  Laptop, 
  Home, 
  CreditCard, 
  Crown, 
  LayoutGrid 
} from 'lucide-react';

import { PaperButton } from '@/components/ui/paper-button';
import { cn } from '@/lib/utils';

type MallProductCategory = 'electronics' | 'home' | 'gift_card' | 'special';

interface CategoryFilterProps {
  activeCategory: MallProductCategory | 'all';
  onCategoryChange: (category: MallProductCategory | 'all') => void;
  // 可选：传入各分类的商品数量
  counts?: Record<string, number>;
}

const CATEGORIES = [
  { value: 'all', label: '全部', icon: LayoutGrid },
  { value: 'electronics', label: '电子产品', icon: Laptop },
  { value: 'home', label: '家居用品', icon: Home },
  { value: 'gift_card', label: '礼品卡', icon: CreditCard },
  { value: 'special', label: '专属特权', icon: Crown },
] as const;

/**
 * 商品分类筛选组件
 */
export default function CategoryFilter({ activeCategory, onCategoryChange, counts }: CategoryFilterProps) {
  return (
    // 使用 mask-image 实现两端渐变遮罩，提示可滚动
    // 添加 -mx-4 px-4 抵消父容器的 padding，实现全宽滚动体验
    <div className="relative -mx-4 sm:mx-0">
      <div 
        className="flex gap-2 overflow-x-auto pb-2 px-4 sm:px-0 scrollbar-hide select-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.value;
          const count = counts?.[category.value];

          return (
            <PaperButton
              key={category.value}
              variant={isActive ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange(category.value as MallProductCategory | 'all')}
              className={cn(
                "whitespace-nowrap transition-all duration-200 flex items-center gap-2",
                isActive ? "shadow-md" : "hover:bg-paper-100"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-paper-ink-secondary")} />
              <span>{category.label}</span>
              
              {/* 商品数量徽标 */}
              {count !== undefined && (
                <span className={cn(
                  "ml-1 text-xs px-1.5 py-0.5 rounded-full font-normal",
                  isActive 
                    ? "bg-white/20 text-white" 
                    : "bg-paper-200 text-paper-ink-secondary"
                )}>
                  {count}
                </span>
              )}
            </PaperButton>
          );
        })}
      </div>
      
      {/* Webkit 滚动条隐藏样式 */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
