'use client';

import { Edit } from 'lucide-react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

import { PaperBadge, PaperStatus } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';

import { SalesTool, StockRecord } from '../useToolsPageState';

interface ProductDetailModalProps {
  product: SalesTool | null;
  stockRecords: StockRecord[];
  getStatusText: (status: SalesTool['status']) => string;
  getStatusColor: (status: SalesTool['status']) => 'success' | 'warning' | 'error' | 'info';
  getRecordTypeText: (recordType: StockRecord['recordType']) => string;
  onClose: () => void;
}

export const ProductDetailModal = ({
  product,
  stockRecords,
  getStatusText,
  getStatusColor,
  getRecordTypeText,
  onClose
}: ProductDetailModalProps) => {
  if (!product) return null;

  const productRecords = stockRecords
    .filter(record => record.sku === product.sku)
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-paper-400 border border-paper-600 rounded-xl shadow-paper-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-paper-600 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-ink-800">商品详情</h2>
            <PaperBadge variant={getStatusColor(product.status)}>
              {product.sku}
            </PaperBadge>
          </div>
          <button
            onClick={onClose}
            className="paper-button p-2"
            aria-label="关闭"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 基本信息 */}
            <div className="space-y-6">
              <PaperCard>
                <PaperCardHeader>
                  <PaperCardTitle>基本信息</PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden border border-paper-600">
                      <Image 
                        src={product.imageUrl} 
                        alt={product.name} 
                        width={96} 
                        height={96} 
                        className="object-cover w-full h-full" 
                        unoptimized 
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-ink-800">{product.name}</h3>
                      <p className="text-sm text-ink-500 mt-1">{product.sku}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-ink-500 mb-1">分类</p>
                      <p className="text-sm font-medium text-ink-800">销售道具</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-500 mb-1">子分类</p>
                      <p className="text-sm font-medium text-ink-800">{product.subCategory}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-500 mb-1">计量单位</p>
                      <p className="text-sm font-medium text-ink-800">{product.unit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-500 mb-1">状态</p>
                      <PaperStatus 
                        status={getStatusColor(product.status)} 
                        text={getStatusText(product.status)} 
                      />
                    </div>
                  </div>
                </PaperCardContent>
              </PaperCard>

              {/* 价格和库存 */}
              <PaperCard>
                <PaperCardHeader>
                  <PaperCardTitle>价格和库存</PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-ink-500 mb-1">零售价</p>
                      <p className="text-lg font-semibold text-success-600">¥{product.price.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-500 mb-1">成本价</p>
                      <p className="text-lg font-semibold text-ink-800">¥{product.cost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-500 mb-1">当前库存</p>
                      <p className="text-lg font-semibold text-ink-800">{product.stock} {product.unit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-500 mb-1">安全库存范围</p>
                      <p className="text-lg font-semibold text-ink-800">{product.minStock}-{product.maxStock} {product.unit}</p>
                    </div>
                  </div>
                </PaperCardContent>
              </PaperCard>
            </div>
            
            {/* 其他信息 */}
            <div className="space-y-6">
              <PaperCard>
                <PaperCardHeader>
                  <PaperCardTitle>库存变动记录</PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent className="space-y-3">
                  {productRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between py-2 border-b border-paper-600 last:border-b-0">
                      <div className="flex items-center space-x-2">
                        {record.type === 'in' ? (
                          <ArrowRight className="h-4 w-4 text-success-600" />
                        ) : (
                          <ArrowLeft className="h-4 w-4 text-warning-600" />
                        )}
                        <span className="text-sm text-ink-600">{getRecordTypeText(record.recordType)}</span>
                      </div>
                      <div className="text-sm font-medium">
                        {record.type === 'in' ? '+' : '-'}{record.qty} {product.unit}
                      </div>
                      <div className="text-xs text-ink-500">{record.time}</div>
                    </div>
                  ))}
                </PaperCardContent>
              </PaperCard>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-paper-600 flex items-center justify-end space-x-3">
          <PaperButton variant="outline" onClick={onClose}>
            关闭
          </PaperButton>
          <PaperButton variant="primary">
            <Edit className="h-4 w-4 mr-2" />
            编辑商品
          </PaperButton>
        </div>
      </div>
    </div>
  );
};