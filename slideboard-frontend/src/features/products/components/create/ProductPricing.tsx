import React from 'react';

import { PaperInput } from '@/components/ui/paper-input';
import { Product } from '@/types/products';

interface ProductPricingProps {
  product: Product;
  onProductChange: (updates: Partial<Product>) => void;
}

export function ProductPricing({ product, onProductChange }: ProductPricingProps) {
  const handlePriceChange = (field: keyof Product['prices'], value: string) => {
    const numericValue = parseFloat(value) || 0;
    onProductChange({
      prices: {
        ...product.prices,
        [field]: numericValue
      }
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-ink-800">价格设置</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">成本价</label>
          <PaperInput
            type="number"
            value={product.prices.costPrice}
            onChange={(e) => handlePriceChange('costPrice', e.target.value)}
            placeholder="请输入成本价"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">内部成本价</label>
          <PaperInput
            type="number"
            value={product.prices.internalCostPrice}
            onChange={(e) => handlePriceChange('internalCostPrice', e.target.value)}
            placeholder="请输入内部成本价"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">内部结算价</label>
          <PaperInput
            type="number"
            value={product.prices.internalSettlementPrice}
            onChange={(e) => handlePriceChange('internalSettlementPrice', e.target.value)}
            placeholder="请输入内部结算价"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">结算价</label>
          <PaperInput
            type="number"
            value={product.prices.settlementPrice}
            onChange={(e) => handlePriceChange('settlementPrice', e.target.value)}
            placeholder="请输入结算价"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">零售价</label>
          <PaperInput
            type="number"
            value={product.prices.retailPrice}
            onChange={(e) => handlePriceChange('retailPrice', e.target.value)}
            placeholder="请输入零售价"
          />
        </div>
      </div>
    </div>
  );
}
