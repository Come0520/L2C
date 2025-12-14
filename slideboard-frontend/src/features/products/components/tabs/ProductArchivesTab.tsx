'use client';

import { Search } from 'lucide-react'
import React from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card'
import { PaperSelect } from '@/components/ui/paper-select'
import { VanishInput } from '@/components/ui/vanish-input'
import { CATEGORY_LEVEL1_OPTIONS, CATEGORY_LEVEL2_MAPPING, PRODUCT_STATUS_OPTIONS } from '@/constants/products'
import ProductList from '@/features/products/components/archives/ProductList'
import { Product } from '@/shared/types/product'

interface ProductArchivesTabProps {
  products: Product[]
  searchTerm: string
  categoryLevel1Filter: string
  categoryLevel2Filter: string
  statusFilter: string
  currentPage: number
  itemsPerPage: number
  onSearchChange: (value: string) => void
  onCategoryLevel1Change: (value: string) => void
  onCategoryLevel2Change: (value: string) => void
  onStatusChange: (value: string) => void
  onPageChange: (page: number) => void
  onViewProduct: (product: Product) => void
}

export const ProductArchivesTab: React.FC<ProductArchivesTabProps> = ({
  products,
  searchTerm,
  categoryLevel1Filter,
  categoryLevel2Filter,
  statusFilter,
  currentPage,
  itemsPerPage,
  onSearchChange,
  onCategoryLevel1Change,
  onCategoryLevel2Change,
  onStatusChange,
  onPageChange,
  onViewProduct
}) => {
  // 一级分类选项使用常量
  const categoryLevel1Options = CATEGORY_LEVEL1_OPTIONS

  // 二级分类选项（根据一级分类动态生成）
  const getCategoryLevel2Options = () => {
    const allOptions = [
      { value: 'all', label: '全部子分类' }
    ]

    // 如果选择了全部分类，添加所有二级分类
    if (categoryLevel1Filter === 'all') {
      Object.values(CATEGORY_LEVEL2_MAPPING).forEach(options => {
        allOptions.push(...options)
      })
    } else {
      // 否则只添加对应一级分类的二级分类
      const categoryOptions = CATEGORY_LEVEL2_MAPPING[categoryLevel1Filter as keyof typeof CATEGORY_LEVEL2_MAPPING]
      if (categoryOptions) {
        allOptions.push(...categoryOptions)
      }
    }

    return allOptions
  }

  // 状态选项使用常量
  const statusOptions = PRODUCT_STATUS_OPTIONS

  // 筛选商品
  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productCode.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategoryLevel1 = categoryLevel1Filter === 'all' || product.categoryLevel1 === categoryLevel1Filter
    const matchesCategoryLevel2 = categoryLevel2Filter === 'all' || product.categoryLevel2 === categoryLevel2Filter
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter

    return matchesSearch && matchesCategoryLevel1 && matchesCategoryLevel2 && matchesStatus
  })

  return (
    <>
      <PaperCard>
        <PaperCardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <VanishInput
                placeholders={["搜索产品名称...", "搜索编码...", "输入关键词..."]}
                value={searchTerm}
                onChange={(value) => onSearchChange(value)}
                className="w-full"
              />
            </div>
            <div className="w-48">
              <PaperSelect
                value={categoryLevel1Filter}
                onChange={(e) => {
                  onCategoryLevel1Change(e.target.value)
                  onCategoryLevel2Change('all')
                }}
                options={categoryLevel1Options}
                title="一级分类"
              />
            </div>
            <div className="w-48">
              <PaperSelect
                value={categoryLevel2Filter}
                onChange={(e) => onCategoryLevel2Change(e.target.value)}
                options={getCategoryLevel2Options()}
                title="二级分类"
              />
            </div>
            <div className="w-48">
              <PaperSelect
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value)}
                options={statusOptions}
                title="商品状态"
              />
            </div>
            <PaperButton>
              <Search className="h-4 w-4 mr-2" />
              搜索
            </PaperButton>
          </div>
        </PaperCardContent>
      </PaperCard>

      <ProductList
        products={filteredProducts}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
        onViewProduct={onViewProduct}
      />
    </>
  )
}
