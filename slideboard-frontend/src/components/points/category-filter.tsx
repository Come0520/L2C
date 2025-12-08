'use client';

import { PaperButton } from '@/components/ui/paper-button';
import { MallProductCategory } from '@/types/points';

interface CategoryFilterProps {
  activeCategory: MallProductCategory | 'all';
  onCategoryChange: (category: MallProductCategory | 'all') => void;
}

const CATEGORIES = [
  { value: 'all', label: '全部', icon: '🎁' },
  { value: 'electronics', label: '电子产品', icon: '💻' },
  { value: 'home', label: '家居用品', icon: '🏠' },
  { value: 'gift_card', label: '礼品卡', icon: '🎫' },
  { value: 'special', label: '专属特权', icon: '⭐' },
] as const;

/**
 * 商品分类筛选组件
 */
export default function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {CATEGORIES.map((category) => (
        <PaperButton
          key={category.value}
          variant={activeCategory === category.value ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange(category.value as MallProductCategory | 'all')}
          className="whitespace-nowrap"
        >
          <span className="mr-1">{category.icon}</span>
          {category.label}
        </PaperButton>
      ))}
    </div>
  );
}
