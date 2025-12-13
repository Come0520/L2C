// 产品管理模块 - 产品表单Hook
import { useState, useCallback } from 'react';

import { Product, CreateProductRequest, ProductPrices, ProductImages, ProductTags } from '@/shared/types/product';

import { productSchema, validateProduct } from '../utils/product-validators';

interface UseProductFormProps {
  initialProduct?: Partial<Product>;
  onSubmit?: (product: CreateProductRequest) => Promise<void>;
}

interface UseProductFormReturn {
  // 产品数据
  product: CreateProductRequest;
  
  // 加载状态
  isLoading: boolean;
  error: string | null;
  
  // 表单操作方法
  updateProductBasicInfo: (updates: Partial<Pick<Product, 'productCode' | 'productName' | 'categoryLevel1' | 'categoryLevel2' | 'unit' | 'status'>>) => void;
  updateProductPrices: (updates: Partial<ProductPrices>) => void;
  updateProductAttributes: (updates: Record<string, string>) => void;
  addProductAttribute: (key: string, value: string) => void;
  removeProductAttribute: (key: string) => void;
  updateProductImages: (type: keyof ProductImages, images: string[]) => void;
  addProductImage: (type: keyof ProductImages, imageUrl: string) => void;
  removeProductImage: (type: keyof ProductImages, index: number) => void;
  updateProductTags: (type: keyof ProductTags, tags: string[]) => void;
  toggleProductTag: (type: keyof ProductTags, tag: string) => void;
  
  // 表单提交
  handleSubmit: () => Promise<void>;
}

// 默认产品数据
export const DEFAULT_PRODUCT: CreateProductRequest = {
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

export const useProductForm = ({ 
  initialProduct = {}, 
  onSubmit 
}: UseProductFormProps): UseProductFormReturn => {
  // 产品数据状态
  const [product, setProduct] = useState<CreateProductRequest>({
    ...DEFAULT_PRODUCT,
    ...initialProduct,
    prices: {
      ...DEFAULT_PRODUCT.prices,
      ...initialProduct.prices
    },
    images: {
      ...DEFAULT_PRODUCT.images,
      ...initialProduct.images
    },
    tags: {
      ...DEFAULT_PRODUCT.tags,
      ...initialProduct.tags
    },
    attributes: {
      ...DEFAULT_PRODUCT.attributes,
      ...initialProduct.attributes
    }
  });

  // 加载和错误状态
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 更新产品基本信息
  const updateProductBasicInfo = useCallback((updates: Partial<Pick<Product, 'productCode' | 'productName' | 'categoryLevel1' | 'categoryLevel2' | 'unit' | 'status'>>) => {
    setProduct(prev => ({ ...prev, ...updates }));
  }, []);

  // 更新产品价格
  const updateProductPrices = useCallback((updates: Partial<ProductPrices>) => {
    setProduct(prev => ({
      ...prev,
      prices: { ...prev.prices, ...updates }
    }));
  }, []);

  // 更新产品属性
  const updateProductAttributes = useCallback((updates: Record<string, string>) => {
    setProduct(prev => ({
      ...prev,
      attributes: { ...prev.attributes, ...updates }
    }));
  }, []);

  // 添加产品属性
  const addProductAttribute = useCallback((key: string, value: string) => {
    if (key && !product.attributes[key]) {
      setProduct(prev => ({
        ...prev,
        attributes: {
          ...prev.attributes,
          [key]: value
        }
      }));
    }
  }, [product.attributes]);

  // 删除产品属性
  const removeProductAttribute = useCallback((key: string) => {
    setProduct(prev => {
      const updatedAttributes = { ...prev.attributes };
      delete updatedAttributes[key];
      return {
        ...prev,
        attributes: updatedAttributes
      };
    });
  }, []);

  // 更新产品图片
  const updateProductImages = useCallback((type: keyof ProductImages, images: string[]) => {
    setProduct(prev => ({
      ...prev,
      images: {
        ...prev.images,
        [type]: images
      }
    }));
  }, []);

  // 添加产品图片
  const addProductImage = useCallback((type: keyof ProductImages, imageUrl: string) => {
    setProduct(prev => ({
      ...prev,
      images: {
        ...prev.images,
        [type]: [...prev.images[type], imageUrl]
      }
    }));
  }, []);

  // 删除产品图片
  const removeProductImage = useCallback((type: keyof ProductImages, index: number) => {
    setProduct(prev => {
      const updatedImages = [...prev.images[type]];
      updatedImages.splice(index, 1);
      return {
        ...prev,
        images: {
          ...prev.images,
          [type]: updatedImages
        }
      };
    });
  }, []);

  // 更新产品标签
  const updateProductTags = useCallback((type: keyof ProductTags, tags: string[]) => {
    setProduct(prev => ({
      ...prev,
      tags: {
        ...prev.tags,
        [type]: tags
      }
    }));
  }, []);

  // 切换产品标签
  const toggleProductTag = useCallback((type: keyof ProductTags, tag: string) => {
    setProduct(prev => {
      const tags = [...prev.tags[type]];
      const tagIndex = tags.indexOf(tag);
      
      if (tagIndex > -1) {
        tags.splice(tagIndex, 1);
      } else {
        tags.push(tag);
      }
      
      return {
        ...prev,
        tags: {
          ...prev.tags,
          [type]: tags
        }
      };
    });
  }, []);

  // 表单提交
  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 验证产品数据
      const validationResult = validateProduct(product);
      
      if (!validationResult.success) {
        const errorMessage = validationResult.error.issues.map(issue => issue.message).join('; ');
        throw new Error(errorMessage);
      }
      
      // 调用外部提交函数
      if (onSubmit) {
        await onSubmit(validationResult.data as CreateProductRequest);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败，请稍后重试');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [product, onSubmit]);

  return {
    product,
    isLoading,
    error,
    updateProductBasicInfo,
    updateProductPrices,
    updateProductAttributes,
    addProductAttribute,
    removeProductAttribute,
    updateProductImages,
    addProductImage,
    removeProductImage,
    updateProductTags,
    toggleProductTag,
    handleSubmit
  };
};
