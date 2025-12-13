'use client';

import { Eye, Edit } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

import { PaperStatus } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperSelect } from '@/components/ui/paper-input';
import { PaperTablePagination } from '@/components/ui/paper-table';
import { Product } from '@/shared/types/product';

interface ProductListProps {
  products: Product[];
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onViewProduct: (product: Product) => void;
}

const ProductList: React.FC<ProductListProps> = ({ 
  products, 
  currentPage, 
  itemsPerPage, 
  onPageChange, 
  onViewProduct 
}) => {
  // 获取状态文本
  const getStatusText = (status: Product['status']) => {
    switch (status) {
      case 'draft': return '草稿';
      case 'pending': return '待审核';
      case 'approved': return '已通过';
      case 'rejected': return '已驳回';
      case 'online': return '已上架';
      case 'offline': return '已下架';
      default: return '未知';
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: Product['status']) => {
    switch (status) {
      case 'draft': return 'info';
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'online': return 'success';
      case 'offline': return 'warning';
      default: return 'info';
    }
  };

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = products.slice(startIndex, startIndex + itemsPerPage);

  return (
    <PaperCard>
      <PaperCardHeader>
        <div className="flex items-center justify-between">
          <PaperCardTitle>商品列表</PaperCardTitle>
          <div className="flex space-x-3">
            <PaperSelect 
              options={[
                { value: 'price-asc', label: '价格从低到高' },
                { value: 'price-desc', label: '价格从高到低' },
                { value: 'created-asc', label: '创建时间从早到晚' },
                { value: 'created-desc', label: '创建时间从晚到早' }
              ]} 
              placeholder="排序方式"
              className="w-48"
            />
            <PaperButton variant="outline" size="sm">导出数据</PaperButton>
          </div>
        </div>
      </PaperCardHeader>
      <PaperCardContent className="p-6">
        {paginatedProducts.length === 0 ? (
          <div className="text-center py-12 bg-paper-300 rounded-lg">
            <p className="text-ink-500">没有找到匹配的商品</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {paginatedProducts.map((product) => {
              // 获取商品的第一张图片，如果没有则使用默认图片
              const productImage = product.images.detailImages[0] || product.images.effectImages[0] || product.images.caseImages[0] || 'https://picsum.photos/seed/default/400';
              
              return (
                <div 
                  key={product.id} 
                  className="bg-paper-400 border border-paper-600 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* 商品图片 */}
                  <div className="relative w-full h-48 overflow-hidden bg-paper-300">
                    <Image 
                      src={productImage} 
                      alt={product.productName} 
                      width={400} 
                      height={300} 
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      className="object-cover w-full h-full transition-transform hover:scale-105"
                      unoptimized 
                    />
                    {/* 商品状态标签 */}
                    <div className="absolute top-2 left-2">
                      <PaperStatus 
                        status={getStatusColor(product.status)} 
                        text={getStatusText(product.status)} 
                      />
                    </div>
                  </div>
                  
                  {/* 商品信息 */}
                  <div className="p-4 space-y-3">
                    {/* 商品分类 */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-ink-500">{product.categoryLevel1}</span>
                      <span className="text-xs text-ink-400">/</span>
                      <span className="text-xs text-ink-500">{product.categoryLevel2}</span>
                    </div>
                    
                    {/* 商品名称 */}
                    <h3 className="font-medium text-ink-800 line-clamp-2 h-12">
                      {product.productName}
                    </h3>
                    
                    {/* 商品编码 */}
                    <p className="text-sm text-ink-500">
                      编码: {product.productCode}
                    </p>
                    
                    {/* 价格信息 */}
                    <div className="space-y-1">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-xl font-bold text-success-600">¥{product.prices.retailPrice.toLocaleString()}</span>
                        <span className="text-sm text-ink-500 line-through">¥{product.prices.settlementPrice.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-ink-500">
                        结算价: ¥{product.prices.settlementPrice.toLocaleString()}
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex space-x-2 pt-2 border-t border-paper-600">
                      <PaperButton 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => onViewProduct(product)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        查看
                      </PaperButton>
                      <PaperButton 
                        size="sm" 
                        variant="primary" 
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        编辑
                      </PaperButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* 分页 */}
        <div className="mt-8">
          <PaperTablePagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            totalItems={products.length} 
            itemsPerPage={itemsPerPage} 
            onPageChange={onPageChange} 
          />
        </div>
      </PaperCardContent>
    </PaperCard>
  );
};

export default ProductList;
