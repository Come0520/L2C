import { Search } from 'lucide-react'
import React from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card'
import { PaperInput } from '@/components/ui/paper-input'
import { PaperSelect } from '@/components/ui/paper-select'
import ProductList from '@/features/products/components/archives/product-list'
import { Product } from '@/services/products.client'

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
  // 一级分类选项
  const categoryLevel1Options = [
    { value: 'all', label: '全部分类' },
    { value: '窗帘', label: '窗帘' },
    { value: '墙布', label: '墙布' },
    { value: '墙咔', label: '墙咔' },
    { value: '飘窗垫', label: '飘窗垫' },
    { value: '标品', label: '标品' },
    { value: '礼品', label: '礼品' },
    { value: '销售道具', label: '销售道具' }
  ]

  // 二级分类选项（根据一级分类动态生成）
  const getCategoryLevel2Options = () => {
    const allOptions = [
      { value: 'all', label: '全部子分类' }
    ]

    if (categoryLevel1Filter === 'all' || categoryLevel1Filter === '窗帘') {
      allOptions.push(
        { value: '布', label: '布' },
        { value: '纱', label: '纱' },
        { value: '轨道', label: '轨道' },
        { value: '电机', label: '电机' },
        { value: '功能帘', label: '功能帘' },
        { value: '绑带', label: '绑带' }
      )
    }

    if (categoryLevel1Filter === 'all' || categoryLevel1Filter === '墙布') {
      allOptions.push(
        { value: '艺术漆', label: '艺术漆' },
        { value: '提花', label: '提花' },
        { value: '印花', label: '印花' }
      )
    }

    if (categoryLevel1Filter === 'all' || categoryLevel1Filter === '墙咔') {
      allOptions.push(
        { value: '大板', label: '大板' },
        { value: '小板', label: '小板' },
        { value: '灯带', label: '灯带' },
        { value: '金属条', label: '金属条' }
      )
    }

    if (categoryLevel1Filter === 'all' || categoryLevel1Filter === '飘窗垫') {
      allOptions.push(
        { value: '有底板', label: '有底板' },
        { value: '没底板', label: '没底板' }
      )
    }

    if (categoryLevel1Filter === 'all' || categoryLevel1Filter === '标品') {
      allOptions.push(
        { value: '毛浴巾', label: '毛浴巾' },
        { value: '四件套', label: '四件套' },
        { value: '被芯', label: '被芯' },
        { value: '枕芯', label: '枕芯' }
      )
    }

    if (categoryLevel1Filter === 'all' || categoryLevel1Filter === '礼品') {
      allOptions.push(
        { value: '办公用品', label: '办公用品' },
        { value: '家居用品', label: '家居用品' },
        { value: '定制礼品', label: '定制礼品' },
        { value: '促销礼品', label: '促销礼品' }
      )
    }

    if (categoryLevel1Filter === 'all' || categoryLevel1Filter === '销售道具') {
      allOptions.push(
        { value: '展示器材', label: '展示器材' },
        { value: '宣传物料', label: '宣传物料' },
        { value: '样品', label: '样品' },
        { value: '工具包', label: '工具包' }
      )
    }

    return allOptions
  }

  // 状态选项
  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'draft', label: '草稿' },
    { value: 'pending', label: '待审核' },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已驳回' },
    { value: 'online', label: '已上架' },
    { value: 'offline', label: '已下架' }
  ]

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
              <PaperInput placeholder="搜索产品名称、编码..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} className="w-full" icon={<Search className="h-4 w-4" />} />
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
