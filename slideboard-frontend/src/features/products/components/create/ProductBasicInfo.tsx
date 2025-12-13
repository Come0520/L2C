import React from 'react';

import { PaperInput, PaperSelect } from '@/components/ui/paper-input';
import { CATEGORY_LEVEL1_OPTIONS, CATEGORY_LEVEL2_MAPPING, PRODUCT_STATUS_OPTIONS } from '@/constants/products';
import { Product } from '@/types/products';

interface ProductBasicInfoProps {
  product: Product;
  onProductChange: (updates: Partial<Product>) => void;
}

export function ProductBasicInfo({ product, onProductChange }: ProductBasicInfoProps) {
  // 二级分类选项（根据一级分类动态生成）
  const categoryLevel2Options = product.categoryLevel1 
    ? CATEGORY_LEVEL2_MAPPING[product.categoryLevel1] || []
    : [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-ink-800">基本信息</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">产品编码</label>
          <PaperInput
            value={product.productCode}
            onChange={(e) => onProductChange({ productCode: e.target.value })}
            placeholder="请输入产品编码"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">产品名称</label>
          <PaperInput
            value={product.productName}
            onChange={(e) => onProductChange({ productName: e.target.value })}
            placeholder="请输入产品名称"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">一级分类</label>
          <PaperSelect
            value={product.categoryLevel1}
            onChange={(e) => {
              onProductChange({ 
                categoryLevel1: e.target.value,
                categoryLevel2: ''
              });
            }}
            options={CATEGORY_LEVEL1_OPTIONS}
            placeholder="请选择一级分类"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">二级分类</label>
          <PaperSelect
            value={product.categoryLevel2}
            onChange={(e) => onProductChange({ categoryLevel2: e.target.value })}
            options={categoryLevel2Options}
            placeholder="请选择二级分类"
            disabled={!product.categoryLevel1}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">单位</label>
          <PaperInput
            value={product.unit}
            onChange={(e) => onProductChange({ unit: e.target.value })}
            placeholder="请输入单位"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">状态</label>
          <PaperSelect
            value={product.status}
            onChange={(e) => onProductChange({ 
              status: e.target.value as Product['status'] 
            })}
            options={PRODUCT_STATUS_OPTIONS.filter(option => option.value !== 'all')}
            placeholder="请选择状态"
          />
        </div>
      </div>
    </div>
  );
}
