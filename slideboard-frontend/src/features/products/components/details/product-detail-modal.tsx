
import { FileText, Edit } from 'lucide-react'
import Image from 'next/image'

import { PaperBadge, PaperStatus } from '@/components/ui/paper-badge'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'
import { Product } from '@/services/products.client'

interface ProductDetailModalProps {
  product: Product
  onClose: () => void
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  // 获取状态文本
  const getStatusText = (status: Product['status']) => {
    switch (status) {
      case 'draft': return '草稿'
      case 'pending': return '待审核'
      case 'approved': return '已通过'
      case 'rejected': return '已驳回'
      case 'online': return '已上架'
      case 'offline': return '已下架'
      default: return '未知'
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: Product['status']) => {
    switch (status) {
      case 'draft': return 'info'
      case 'pending': return 'warning'
      case 'approved': return 'success'
      case 'rejected': return 'error'
      case 'online': return 'success'
      case 'offline': return 'warning'
      default: return 'info'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-paper-400 border border-paper-600 rounded-xl shadow-paper-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-paper-600 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-ink-800">商品详情</h2>
            <PaperBadge variant={getStatusColor(product.status)}>
              {product.productCode}
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
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-ink-600">商品名称</span>
                      <span className="text-sm font-medium text-ink-800">{product.productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-ink-600">一级分类</span>
                      <span className="text-sm text-ink-800">{product.categoryLevel1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-ink-600">二级分类</span>
                      <span className="text-sm text-ink-800">{product.categoryLevel2}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-ink-600">计量单位</span>
                      <span className="text-sm text-ink-800">{product.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-ink-600">创建时间</span>
                      <span className="text-sm text-ink-800">{product.createdAt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-ink-600">更新时间</span>
                      <span className="text-sm text-ink-800">{product.updatedAt}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 pt-3 border-t border-paper-600">
                    <div>
                      <p className="text-xs text-ink-500 mb-1">产品状态</p>
                      <PaperStatus
                        status={getStatusColor(product.status)}
                        text={getStatusText(product.status)}
                      />
                    </div>
                  </div>
                </PaperCardContent>
              </PaperCard>

              {/* 价格体系 */}
              <PaperCard>
                <PaperCardHeader>
                  <PaperCardTitle>价格体系</PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-ink-600">成本价</span>
                    <span className="text-sm font-medium text-ink-800">¥{product.prices.costPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-ink-600">内部成本价</span>
                    <span className="text-sm font-medium text-ink-800">¥{product.prices.internalCostPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-ink-600">内部结算价</span>
                    <span className="text-sm font-medium text-ink-800">¥{product.prices.internalSettlementPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-ink-600">结算价</span>
                    <span className="text-sm font-medium text-ink-800">¥{product.prices.settlementPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-ink-600">零售价</span>
                    <span className="text-sm font-medium text-success-600">¥{product.prices.retailPrice.toLocaleString()}</span>
                  </div>
                </PaperCardContent>
              </PaperCard>
            </div>

            {/* 图片资料 */}
            <div className="space-y-6">
              <PaperCard>
                <PaperCardHeader>
                  <PaperCardTitle>图片资料</PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent className="space-y-4">
                  {/* 细节图 */}
                  {product.images.detailImages.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-ink-700 mb-2">细节图</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {product.images.detailImages.map((img, index) => (
                          <div key={index} className="w-full h-24 rounded-lg overflow-hidden border border-paper-600">
                            <Image
                              src={img}
                              alt={`细节图 ${index + 1}`}
                              width={120}
                              height={90}
                              className="object-cover w-full h-full"
                              unoptimized
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 效果图 */}
                  {product.images.effectImages.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-ink-700 mb-2">效果图</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {product.images.effectImages.map((img, index) => (
                          <div key={index} className="w-full h-24 rounded-lg overflow-hidden border border-paper-600">
                            <Image
                              src={img}
                              alt={`效果图 ${index + 1}`}
                              width={120}
                              height={90}
                              className="object-cover w-full h-full"
                              unoptimized
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 案例图 */}
                  {product.images.caseImages.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-ink-700 mb-2">案例图</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {product.images.caseImages.map((img, index) => (
                          <div key={index} className="w-full h-24 rounded-lg overflow-hidden border border-paper-600">
                            <Image
                              src={img}
                              alt={`案例图 ${index + 1}`}
                              width={120}
                              height={90}
                              className="object-cover w-full h-full"
                              unoptimized
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </PaperCardContent>
              </PaperCard>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-paper-600 flex items-center justify-between">
          <div className="flex space-x-3">
            <PaperButton variant="outline" onClick={onClose}>
              关闭
            </PaperButton>
          </div>
          <div className="flex space-x-3">
            <PaperButton variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              审批记录
            </PaperButton>
            <PaperButton variant="primary">
              <Edit className="h-4 w-4 mr-2" />
              编辑商品
            </PaperButton>
          </div>
        </div>
      </div>
    </div>
  )
}
