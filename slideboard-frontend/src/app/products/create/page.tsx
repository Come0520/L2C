'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card';
import { ProductAttributes } from '@/features/products/components/create/ProductAttributes';
import { ProductBasicInfo } from '@/features/products/components/create/ProductBasicInfo';
import { ProductImages } from '@/features/products/components/create/ProductImages';
import { ProductPricing } from '@/features/products/components/create/ProductPricing';
import { ProductTags } from '@/features/products/components/create/ProductTags';
import { Product } from '@/types/products';

// 初始产品数据
const initialProduct: Product = {
  productCode: '',
  productName: '',
  categoryLevel1: '',
  categoryLevel2: '',
  unit: '',
  status: 'draft',
  prices: {
    costPrice: 0,
    internalCostPrice: 0,
    internalSettlementPrice: 0,
    settlementPrice: 0,
    retailPrice: 0
  },
  attributes: {},
  images: {
    detailImages: [],
    effectImages: [],
    caseImages: []
  },
  tags: {
    styleTags: [],
    packageTags: [],
    activityTags: [],
    seasonTags: [],
    demographicTags: []
  }
};

export default function ProductCreatePage() {
  const router = useRouter();
  const [product, setProduct] = useState<Product>(initialProduct);
  const [activeStep, setActiveStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 处理产品字段变化
  const handleProductChange = (updates: Partial<Product>) => {
    setProduct(prev => ({
      ...prev,
      ...updates
    }));
  };

  // 下一步
  const handleNext = () => {
    setActiveStep(prev => Math.min(prev + 1, 5));
  };

  // 上一步
  const handlePrevious = () => {
    setActiveStep(prev => Math.max(prev - 1, 1));
  };

  // 提交审批
  const handleSubmitApproval = () => {
    // 这里应该是提交到服务器的逻辑
    console.log('提交产品：', product);
    // 提交成功后跳转回产品列表
    router.push('/products');
  };

  // 渲染当前步骤的内容
  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return <ProductBasicInfo product={product} onProductChange={handleProductChange} />;
      case 2:
        return <ProductPricing product={product} onProductChange={handleProductChange} />;
      case 3:
        return <ProductAttributes product={product} onProductChange={handleProductChange} />;
      case 4:
        return <ProductImages product={product} onProductChange={handleProductChange} />;
      case 5:
        return <ProductTags product={product} onProductChange={handleProductChange} />;
      default:
        return null;
    }
  };

  return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">新增产品</h1>
            <p className="text-ink-500 mt-1">创建并管理产品信息</p>
          </div>
          
          <div className="flex space-x-3">
            <PaperButton variant="outline" onClick={() => router.push('/products')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回列表
            </PaperButton>
          </div>
        </div>

        <PaperCard>
          <PaperCardContent className="p-6">
            {/* 步骤指示器 */}
            <div className="flex justify-between items-center mb-8">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium mb-2 ${activeStep >= step ? 'bg-primary-600 text-white' : 'bg-paper-300 text-ink-500'}`}
                  >
                    {step}
                  </div>
                  <div className="text-xs text-ink-500">
                    {step === 1 && '基本信息'}
                    {step === 2 && '价格设置'}
                    {step === 3 && '产品属性'}
                    {step === 4 && '产品图片'}
                    {step === 5 && '标签体系'}
                  </div>
                </div>
              ))}
            </div>

            {/* 步骤内容 */}
            {renderStepContent()}
          </PaperCardContent>
          
          {/* 步骤导航按钮 */}
          <div className="border-t border-paper-600 px-6 py-4 flex justify-between">
            <PaperButton 
              variant="outline" 
              onClick={handlePrevious} 
              disabled={activeStep === 1}
            >
              上一步
            </PaperButton>
            
            {activeStep < 5 ? (
              <PaperButton variant="primary" onClick={handleNext}>
                下一步
              </PaperButton>
            ) : (
              <PaperButton variant="primary" onClick={handleSubmitApproval}>
                提交审批
              </PaperButton>
            )}
          </div>
        </PaperCard>
      </div>
  );
}