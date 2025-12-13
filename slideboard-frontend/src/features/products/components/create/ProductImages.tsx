/**
 * 产品图片组件
 * 
 * @description
 * 用于产品创建和编辑时上传和管理产品图片的组件，支持多种图片类型（主图、详情图、画廊图）
 * 并提供图片上传、预览和删除功能。
 * 
 * @param {ProductImagesProps} props - 组件属性
 * @param {Product} props.product - 产品数据，包含当前的图片信息
 * @param {Function} props.onProductChange - 产品数据变化回调函数，用于更新产品图片
 * @param {boolean} [props.loading=false] - 加载状态，用于在数据加载时显示骨架屏
 * 
 * @returns {JSX.Element} 产品图片组件
 * 
 * @example
 * ```typescript
 * <ProductImages 
 *   product={product} 
 *   onProductChange={handleProductChange} 
 *   loading={isLoading} 
 * />
 * ```
 */
import Image from 'next/image';
import React, { useState } from 'react';

import { PaperFileUpload } from '@/components/ui/paper-file-upload';
import { PRODUCT_IMAGE_TYPES } from '@/constants/products';
import { Product } from '@/types/products';

/**
 * 产品图片组件属性接口
 */
interface ProductImagesProps {
  /** 产品数据，包含当前的图片信息 */
  product: Product;
  /** 产品数据变化回调函数，用于更新产品图片 */
  onProductChange: (updates: Partial<Product>) => void;
  /** 加载状态，用于在数据加载时显示骨架屏 */
  loading?: boolean;
}

export function ProductImages({ product, onProductChange, loading = false }: ProductImagesProps) {
  // 为每种图片类型添加加载状态
  const [uploadingTypes, setUploadingTypes] = useState<Record<string, boolean>>({});

  const handleImageUpload = (type: string, images: string[]) => {
    onProductChange({
      images: {
        ...product.images,
        [type as keyof Product['images']]: [...(product.images[type as keyof Product['images']] || []), ...images]
      }
    });
  };

  const removeImage = (type: string, index: number) => {
    const imageKey = type as keyof Product['images'];
    const updatedImages = [...(product.images[imageKey] || [])];
    updatedImages.splice(index, 1);
    onProductChange({
      images: {
        ...product.images,
        [imageKey]: updatedImages
      }
    });
  };

  // 使用常量定义的图片类型
  const imageTypes = PRODUCT_IMAGE_TYPES;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-ink-800">产品图片</h2>
      
      {imageTypes.map(({ key, label }) => {
        // 确保key是ProductImages的有效键
        const imageKey = key as keyof Product['images'];
        const isUploading = uploadingTypes[key] || false;
        
        return (
          <div key={key} className="space-y-4">
            <h3 className="text-lg font-medium text-ink-700">{label}</h3>
            
            <PaperFileUpload
              onUpload={(files: File[]) => {
                // 设置上传中状态
                setUploadingTypes(prev => ({ ...prev, [key]: true }));
                
                // 模拟上传，实际应该调用上传API
                setTimeout(() => {
                  const mockUrls = files.map((_file, index: number) => `https://example.com/image-${key}-${index}.jpg`);
                  handleImageUpload(key, mockUrls);
                  // 清除上传中状态
                  setUploadingTypes(prev => ({ ...prev, [key]: false }));
                }, 1000); // 模拟1秒上传时间
              }}
              onUploadProgress={(progress) => {
                console.log(`Upload progress for ${key}: ${progress}%`);
              }}
              accept="image/*"
              maxFiles={5}
              uploading={isUploading}
            />
            
            {/* 已上传图片展示 */}
            {(product.images[imageKey]?.length || 0) > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {(product.images[imageKey] || []).map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-paper-300 rounded-lg overflow-hidden">
                      {loading ? (
                        // 加载状态：显示骨架屏
                        <div className="w-full h-full animate-pulse bg-gray-200"></div>
                      ) : (
                        <Image
                          src={imageUrl}
                          alt={`${label} ${index + 1}`}
                          fill
                          className="object-cover"
                          onLoadingComplete={(img) => {
                            // 图片加载完成后可以执行的逻辑
                          }}
                        />
                      )}
                    </div>
                    <button 
                      onClick={() => removeImage(key, index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="删除图片"
                      disabled={loading || isUploading}
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
        );
      })}
    </div>
  );
}
