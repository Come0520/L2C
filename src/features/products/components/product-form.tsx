'use client';

import { useState } from 'react';
import { Form } from '@/shared/ui/form';
import { Button } from '@/shared/ui/button';
import { ProductFormValues } from '../hooks/use-product-form';

// 重新导出供外部使用
export type { ProductFormValues };
import { Loader2 } from 'lucide-react';
import { useProductForm } from '../hooks/use-product-form';
import { ProductBasicInfo } from './product-form-sections/product-basic-info';
import { ProductCategorySpecs } from './product-form-sections/product-category-specs';
import { ProductDynamicAttributes } from './product-form-sections/product-dynamic-attributes';
import { ProductPriceAndProfit } from './product-form-sections/product-price-and-profit';
import { ProductSupplyAndInventory } from './product-form-sections/product-supply-and-inventory';
import { ProductGallery } from './product-form-sections/product-gallery';

interface ProductFormProps {
  /** 编辑模式时传入已有产品数据（Product）或已有表单值（Partial<ProductFormValues>） */
  initialData?: Partial<ProductFormValues> & { id?: string; specs?: Record<string, unknown> };
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ProductForm({ initialData, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const [styleInput, setStyleInput] = useState('');
  const [patternInput, setPatternInput] = useState('');

  // 1. Utilize the custom hook to handle business logic and state.
  const {
    form,
    isWallcloth,
    isWallpaper,
    hasCurtainSpecs,
    hidePurchaseType,
    attributeSchema,
    suppliersList,
    currentStyles,
    addStyle,
    removeStyle,
    currentPatterns,
    addPattern,
    removePattern,
  } = useProductForm({
    initialData: initialData as unknown as Partial<ProductFormValues>,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <ProductBasicInfo
          form={form}
          hidePurchaseType={hidePurchaseType}
          styleInput={styleInput}
          setStyleInput={setStyleInput}
          currentStyles={currentStyles}
          addStyle={addStyle}
          removeStyle={removeStyle}
        />

        <ProductCategorySpecs
          form={form}
          hasCurtainSpecs={hasCurtainSpecs}
          isWallcloth={isWallcloth}
          isWallpaper={isWallpaper}
          currentPatterns={currentPatterns}
          addPattern={addPattern}
          removePattern={removePattern}
          patternInput={patternInput}
          setPatternInput={setPatternInput}
        />

        <ProductDynamicAttributes form={form} dynamicAttributes={attributeSchema} />

        <ProductSupplyAndInventory form={form} suppliers={suppliersList} />

        <ProductPriceAndProfit form={form} />

        <ProductGallery form={form} />

        {/* 底部操作按钮 */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? '保存' : '创建'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
