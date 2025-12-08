'use client';

import { Plus, Save, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card';
import { PaperFileUpload } from '@/components/ui/paper-file-upload';
import { PaperInput, PaperSelect, PaperTextarea } from '@/components/ui/paper-input';

// 产品类型定义
interface Product {
  productCode: string;
  productName: string;
  categoryLevel1: string;
  categoryLevel2: string;
  unit: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'online' | 'offline';
  prices: {
    costPrice: number;
    internalCostPrice: number;
    internalSettlementPrice: number;
    settlementPrice: number;
    retailPrice: number;
  };
  attributes: Record<string, string>;
  images: {
    detailImages: string[];
    effectImages: string[];
    caseImages: string[];
  };
  tags: {
    styleTags: string[];
    packageTags: string[];
    activityTags: string[];
    seasonTags: string[];
    demographicTags: string[];
  };
}

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

  // 一级分类选项
  const categoryLevel1Options = [
    { value: '窗帘', label: '窗帘' },
    { value: '墙布', label: '墙布' },
    { value: '墙咔', label: '墙咔' },
    { value: '飘窗垫', label: '飘窗垫' },
    { value: '标品', label: '标品' },
    { value: '礼品', label: '礼品' },
    { value: '销售道具', label: '销售道具' }
  ];

  // 二级分类选项（根据一级分类动态生成）
  const getCategoryLevel2Options = () => {
    const options: { value: string; label: string }[] = [];

    if (product.categoryLevel1 === '窗帘') {
      options.push(
        { value: '布', label: '布' },
        { value: '纱', label: '纱' },
        { value: '轨道', label: '轨道' },
        { value: '电机', label: '电机' },
        { value: '功能帘', label: '功能帘' },
        { value: '绑带', label: '绑带' }
      );
    } else if (product.categoryLevel1 === '墙布') {
      options.push(
        { value: '艺术漆', label: '艺术漆' },
        { value: '提花', label: '提花' },
        { value: '印花', label: '印花' }
      );
    } else if (product.categoryLevel1 === '墙咔') {
      options.push(
        { value: '大板', label: '大板' },
        { value: '小板', label: '小板' },
        { value: '灯带', label: '灯带' },
        { value: '金属条', label: '金属条' }
      );
    } else if (product.categoryLevel1 === '飘窗垫') {
      options.push(
        { value: '有底板', label: '有底板' },
        { value: '没底板', label: '没底板' }
      );
    } else if (product.categoryLevel1 === '标品') {
      options.push(
        { value: '毛浴巾', label: '毛浴巾' },
        { value: '四件套', label: '四件套' },
        { value: '被芯', label: '被芯' },
        { value: '枕芯', label: '枕芯' }
      );
    } else if (product.categoryLevel1 === '礼品') {
      options.push(
        { value: '办公用品', label: '办公用品' },
        { value: '家居用品', label: '家居用品' },
        { value: '定制礼品', label: '定制礼品' },
        { value: '促销礼品', label: '促销礼品' }
      );
    } else if (product.categoryLevel1 === '销售道具') {
      options.push(
        { value: '展示器材', label: '展示器材' },
        { value: '宣传物料', label: '宣传物料' },
        { value: '样品', label: '样品' },
        { value: '工具包', label: '工具包' }
      );
    }

    return options;
  };

  // 计量单位选项
  const unitOptions = [
    { value: '米', label: '米' },
    { value: '平方米', label: '平方米' },
    { value: '个', label: '个' },
    { value: '张', label: '张' },
    { value: '对', label: '对' },
    { value: '件', label: '件' },
    { value: '箱', label: '箱' }
  ];

  // 标签选项
  const tagOptions = {
    styleTags: ['现代', '欧式', '中式', '美式', '北欧', '新中式'],
    packageTags: ['单品', '套餐组合', '全屋套餐'],
    activityTags: ['正常款', '促销款', '限时特惠', '新品上市'],
    seasonTags: ['春夏季', '秋冬季', '四季通用'],
    demographicTags: ['儿童', '青年', '中年', '老年', '新婚']
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // 处理嵌套属性
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (!child) return;
      setProduct(prev => {
        if (parent === 'prices') {
          const key = child as keyof Product['prices']
          return {
            ...prev,
            prices: {
              ...prev.prices,
              [key]: parseFloat(value) || 0
            }
          }
        }
        if (parent === 'attributes') {
          const nextAttrs = { ...prev.attributes }
          nextAttrs[child] = value
          return {
            ...prev,
            attributes: nextAttrs
          }
        }
        return prev
      });
    } else {
      setProduct(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 处理价格输入变化
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const priceName = name as keyof Product['prices'];
    setProduct(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        [priceName]: parseFloat(value) || 0
      }
    }));
  };

  // 处理标签选择
  const handleTagChange = (tagType: keyof Product['tags'], tag: string) => {
    setProduct(prev => {
      const tags = [...prev.tags[tagType]];
      const index = tags.indexOf(tag);
      
      if (index > -1) {
        tags.splice(index, 1);
      } else {
        tags.push(tag);
      }
      
      return {
        ...prev,
        tags: {
          ...prev.tags,
          [tagType]: tags
        }
      };
    });
  };

  // 处理图片上传
  const handleImageUpload = (type: 'detailImages' | 'effectImages' | 'caseImages', files: File[]) => {
    // 这里应该是实际的图片上传逻辑，现在只是模拟
    const imageUrls = files.map(file => URL.createObjectURL(file));
    setProduct(prev => ({
      ...prev,
      images: {
        ...prev.images,
        [type]: [...prev.images[type], ...imageUrls]
      }
    }));
  };

  // 移除图片
  const removeImage = (type: 'detailImages' | 'effectImages' | 'caseImages', index: number) => {
    setProduct(prev => {
      const images = [...prev.images[type]];
      images.splice(index, 1);
      return {
        ...prev,
        images: {
          ...prev.images,
          [type]: images
        }
      };
    });
  };

  // 验证当前步骤
  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    
    if (activeStep === 1) {
      // 验证基本信息
      if (!product.productCode) newErrors.productCode = '产品编码不能为空';
      if (!product.productName) newErrors.productName = '产品名称不能为空';
      if (!product.categoryLevel1) newErrors.categoryLevel1 = '请选择一级分类';
      if (!product.categoryLevel2) newErrors.categoryLevel2 = '请选择二级分类';
      if (!product.unit) newErrors.unit = '请选择计量单位';
    } else if (activeStep === 2) {
      // 验证价格体系
      if (product.prices.costPrice < 0) newErrors.costPrice = '成本价不能为负数';
      if (product.prices.retailPrice < product.prices.settlementPrice) {
        newErrors.retailPrice = '零售价不能低于结算价';
      }
      if (product.prices.settlementPrice < product.prices.internalSettlementPrice) {
        newErrors.settlementPrice = '结算价不能低于内部结算价';
      }
      if (product.prices.internalSettlementPrice < product.prices.internalCostPrice) {
        newErrors.internalSettlementPrice = '内部结算价不能低于内部成本价';
      }
      if (product.prices.internalCostPrice < product.prices.costPrice) {
        newErrors.internalCostPrice = '内部成本价不能低于成本价';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 下一步
  const handleNext = () => {
    if (validateStep()) {
      setActiveStep(prev => Math.min(prev + 1, 5));
    }
  };

  // 上一步
  const handlePrevious = () => {
    setActiveStep(prev => Math.max(prev - 1, 1));
  };

  // 保存草稿
  const handleSaveDraft = () => {
    // 这里应该是保存草稿的逻辑
    router.push('/products');
  };

  // 提交审批
  const handleSubmitApproval = () => {
    if (validateStep()) {
      // 这里应该是提交审批的逻辑
      router.push('/products');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <PaperButton variant="outline" onClick={() => router.push('/products')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回产品列表
            </PaperButton>
            <h1 className="text-3xl font-bold text-ink-800">新增产品</h1>
          </div>
          <div className="flex space-x-3">
            <PaperButton variant="outline" onClick={handleSaveDraft}>
              <Save className="h-4 w-4 mr-2" />
              保存草稿
            </PaperButton>
            <PaperButton variant="primary" onClick={handleSubmitApproval}>
              <Plus className="h-4 w-4 mr-2" />
              提交审批
            </PaperButton>
          </div>
        </div>

        {/* 步骤指示器 */}
        <PaperCard>
          <PaperCardContent className="p-6">
            <div className="flex justify-between">
              {[
                { step: 1, title: '基本信息' },
                { step: 2, title: '价格体系' },
                { step: 3, title: '产品属性' },
                { step: 4, title: '图片资料' },
                { step: 5, title: '标签体系' }
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    activeStep === item.step
                      ? 'bg-primary-500 text-white font-medium'
                      : activeStep > item.step
                      ? 'bg-success-500 text-white font-medium'
                      : 'bg-paper-400 text-ink-600'
                  }`}>
                    {item.step}
                  </div>
                  <span className={`text-sm ${
                    activeStep === item.step ? 'text-primary-500 font-medium' : 'text-ink-600'
                  }`}>
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </PaperCardContent>
        </PaperCard>

        {/* 表单内容 */}
        <PaperCard>
          <PaperCardContent className="p-6">
            {/* 基本信息 */}
            {activeStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-ink-800">基本信息</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">产品编码</label>
                    <PaperInput 
                      name="productCode" 
                      value={product.productCode} 
                      onChange={handleInputChange} 
                      placeholder="请输入产品编码" 
                      error={errors.productCode}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">产品名称</label>
                    <PaperInput 
                      name="productName" 
                      value={product.productName} 
                      onChange={handleInputChange} 
                      placeholder="请输入产品名称" 
                      error={errors.productName}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">一级分类</label>
                    <PaperSelect 
                      name="categoryLevel1" 
                      value={product.categoryLevel1} 
                      onChange={(e) => {
                        handleInputChange(e);
                        // 重置二级分类
                        setProduct(prev => ({
                          ...prev,
                          categoryLevel2: ''
                        }));
                      }} 
                      options={categoryLevel1Options} 
                      placeholder="请选择一级分类" 
                      error={errors.categoryLevel1}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">二级分类</label>
                    <PaperSelect 
                      name="categoryLevel2" 
                      value={product.categoryLevel2} 
                      onChange={handleInputChange} 
                      options={getCategoryLevel2Options()} 
                      placeholder="请选择二级分类" 
                      disabled={!product.categoryLevel1} 
                      error={errors.categoryLevel2}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">计量单位</label>
                    <PaperSelect 
                      name="unit" 
                      value={product.unit} 
                      onChange={handleInputChange} 
                      options={unitOptions} 
                      placeholder="请选择计量单位" 
                      error={errors.unit}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 价格体系 */}
            {activeStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-ink-800">价格体系</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">成本价</label>
                    <PaperInput 
                      type="number" 
                      name="costPrice" 
                      value={product.prices.costPrice} 
                      onChange={handlePriceChange} 
                      placeholder="请输入成本价" 
                      error={errors.costPrice}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">内部成本价</label>
                    <PaperInput 
                      type="number" 
                      name="internalCostPrice" 
                      value={product.prices.internalCostPrice} 
                      onChange={handlePriceChange} 
                      placeholder="请输入内部成本价" 
                      error={errors.internalCostPrice}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">内部结算价</label>
                    <PaperInput 
                      type="number" 
                      name="internalSettlementPrice" 
                      value={product.prices.internalSettlementPrice} 
                      onChange={handlePriceChange} 
                      placeholder="请输入内部结算价" 
                      error={errors.internalSettlementPrice}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">结算价</label>
                    <PaperInput 
                      type="number" 
                      name="settlementPrice" 
                      value={product.prices.settlementPrice} 
                      onChange={handlePriceChange} 
                      placeholder="请输入结算价" 
                      error={errors.settlementPrice}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">零售价</label>
                    <PaperInput 
                      type="number" 
                      name="retailPrice" 
                      value={product.prices.retailPrice} 
                      onChange={handlePriceChange} 
                      placeholder="请输入零售价" 
                      error={errors.retailPrice}
                    />
                  </div>
                </div>
                
                <div className="p-4 bg-warning-100 border border-warning-200 rounded-lg">
                  <p className="text-sm text-warning-700">
                    价格规则：零售价 ≥ 结算价 ≥ 内部结算价 ≥ 内部成本价 ≥ 成本价
                  </p>
                </div>
              </div>
            )}

            {/* 产品属性 */}
            {activeStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-ink-800">产品属性</h2>
                
                {product.categoryLevel1 === '窗帘' && product.categoryLevel2 === '布' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">计算方式</label>
                      <PaperSelect 
                        options={[
                          { value: '定高', label: '定高' },
                          { value: '定宽', label: '定宽' }
                        ]} 
                        placeholder="请选择计算方式"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">幅宽（米）</label>
                      <PaperInput type="number" placeholder="请输入幅宽" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">材质</label>
                      <PaperInput placeholder="请输入材质" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">工艺</label>
                      <PaperInput placeholder="请输入工艺" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">遮光度</label>
                      <PaperSelect 
                        options={[
                          { value: '透光', label: '透光' },
                          { value: '半遮光', label: '半遮光' },
                          { value: '全遮光', label: '全遮光' }
                        ]} 
                        placeholder="请选择遮光度"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">花型</label>
                      <PaperInput placeholder="请输入花型" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">克重（g/m²）</label>
                      <PaperInput type="number" placeholder="请输入克重" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">花距（cm）</label>
                      <PaperInput type="number" placeholder="请输入花距" />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-ink-700 mb-1">适用场景</label>
                      <PaperTextarea placeholder="请输入适用场景" rows={3} />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-ink-700 mb-1">清洁保养</label>
                      <PaperTextarea placeholder="请输入清洁保养说明" rows={3} />
                    </div>
                  </div>
                )}
                
                {(!product.categoryLevel1 || !product.categoryLevel2) && (
                  <div className="text-center py-8">
                    <p className="text-ink-500">请先选择产品分类，系统将根据分类显示对应的属性字段</p>
                  </div>
                )}
              </div>
            )}

            {/* 图片资料 */}
            {activeStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-ink-800">图片资料</h2>
                
                {/* 细节图 */}
                <div>
                  <h3 className="text-lg font-medium text-ink-700 mb-3">细节图</h3>
                  <PaperFileUpload 
                    onUpload={(files) => handleImageUpload('detailImages', files)} 
                    multiple 
                    accept="image/*"
                  />
                  
                  {product.images.detailImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {product.images.detailImages.map((img, index) => (
                        <div key={index} className="relative w-full h-32 rounded-lg overflow-hidden border border-paper-600">
                          <Image src={img} alt={`细节图 ${index + 1}`} width={200} height={120} className="object-cover w-full h-full" unoptimized />
                          <button 
                            onClick={() => removeImage('detailImages', index)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                            aria-label="删除图片"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* 效果图 */}
                <div>
                  <h3 className="text-lg font-medium text-ink-700 mb-3">效果图</h3>
                  <PaperFileUpload 
                    onUpload={(files) => handleImageUpload('effectImages', files)} 
                    multiple 
                    accept="image/*"
                  />
                  
                  {product.images.effectImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {product.images.effectImages.map((img, index) => (
                        <div key={index} className="relative w-full h-32 rounded-lg overflow-hidden border border-paper-600">
                          <Image src={img} alt={`效果图 ${index + 1}`} width={200} height={120} className="object-cover w-full h-full" unoptimized />
                          <button 
                            onClick={() => removeImage('effectImages', index)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                            aria-label="删除图片"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* 案例图 */}
                <div>
                  <h3 className="text-lg font-medium text-ink-700 mb-3">案例图</h3>
                  <PaperFileUpload 
                    onUpload={(files) => handleImageUpload('caseImages', files)} 
                    multiple 
                    accept="image/*"
                  />
                  
                  {product.images.caseImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {product.images.caseImages.map((img, index) => (
                        <div key={index} className="relative w-full h-32 rounded-lg overflow-hidden border border-paper-600">
                          <Image src={img} alt={`案例图 ${index + 1}`} width={200} height={120} className="object-cover w-full h-full" unoptimized />
                          <button 
                            onClick={() => removeImage('caseImages', index)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                            aria-label="删除图片"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 标签体系 */}
            {activeStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-ink-800">标签体系</h2>
                
                {Object.entries(tagOptions).map(([tagType, options]) => {
                  const titleMap: Record<string, string> = {
                    styleTags: '风格标签',
                    packageTags: '套餐标识',
                    activityTags: '活动款标识',
                    seasonTags: '季节标签',
                    demographicTags: '人群标签'
                  };
                  
                  return (
                    <div key={tagType}>
                      <h3 className="text-lg font-medium text-ink-700 mb-3">{titleMap[tagType]}</h3>
                      <div className="flex flex-wrap gap-3">
                        {options.map((option) => {
                          const isSelected = product.tags[tagType as keyof Product['tags']].includes(option);
                          return (
                            <button
                              key={option}
                              onClick={() => handleTagChange(tagType as keyof Product['tags'], option)}
                              className={`px-4 py-2 rounded-full text-sm ${
                                isSelected
                                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                                  : 'bg-paper-300 text-ink-700 border border-paper-500 hover:bg-paper-400'
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
    </DashboardLayout>
  );
}
