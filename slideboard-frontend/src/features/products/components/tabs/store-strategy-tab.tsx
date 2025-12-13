'use client';

import { Search } from 'lucide-react'
import React from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'
import { PaperInput } from '@/components/ui/paper-input'
import { PaperSelect } from '@/components/ui/paper-select'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table'
import { Product } from '@/shared/types/product'

interface StoreStrategyTabProps {
  products: Product[]
}

export const StoreStrategyTab: React.FC<StoreStrategyTabProps> = ({ products }) => {
  return (
    <PaperCard>
      <PaperCardHeader>
        <PaperCardTitle>门店产品策略</PaperCardTitle>
      </PaperCardHeader>
      <PaperCardContent>
        <div className="space-y-6">
          {/* 门店选择 */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-64">
              <PaperSelect
                title="选择门店"
                options={[
                  { value: 'store1', label: '北京旗舰店' },
                  { value: 'store2', label: '上海体验店' },
                  { value: 'store3', label: '广州专卖店' }
                ]}
              />
            </div>
            <PaperButton variant="primary">
              <Search className="h-4 w-4 mr-2" />
              查询策略
            </PaperButton>
          </div>

          {/* 策略列表 */}
          <div>
            <h3 className="text-lg font-medium text-ink-800 mb-4">产品策略列表</h3>
            <PaperTable>
              <PaperTableHeader>
                <PaperTableCell>产品信息</PaperTableCell>
                <PaperTableCell>门店自定义名称</PaperTableCell>
                <PaperTableCell>门店结算价</PaperTableCell>
                <PaperTableCell>状态</PaperTableCell>
                <PaperTableCell>操作</PaperTableCell>
              </PaperTableHeader>
              <PaperTableBody>
                {products.slice(0, 3).map((product) => (
                  <PaperTableRow key={product.id}>
                    <PaperTableCell>
                      <div>
                        <p className="font-medium text-ink-800">{product.productName}</p>
                        <p className="text-sm text-ink-500">编码: {product.productCode}</p>
                      </div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <PaperInput placeholder="自定义名称" className="w-full" />
                    </PaperTableCell>
                    <PaperTableCell>
                      <PaperInput type="number" placeholder="结算价" className="w-full" />
                    </PaperTableCell>
                    <PaperTableCell>
                      <PaperSelect
                        options={[
                          { value: 'active', label: '激活' },
                          { value: 'inactive', label: '停用' }
                        ]}
                        defaultValue="active"
                      />
                    </PaperTableCell>
                    <PaperTableCell>
                      <PaperButton size="sm" variant="primary">保存</PaperButton>
                    </PaperTableCell>
                  </PaperTableRow>
                ))}
              </PaperTableBody>
            </PaperTable>
          </div>
        </div>
      </PaperCardContent>
    </PaperCard>
  )
}
