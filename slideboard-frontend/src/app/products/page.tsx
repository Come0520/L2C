import {
  Plus,
  Package,
  Layers,
  BarChart3,
  Settings,
  Box,
  FileText
} from 'lucide-react';
import React, { Suspense } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card';
import { PaperNav, PaperNavItem } from '@/components/ui/paper-nav';
import { ProductTableSkeleton } from '@/features/products/components/archives/product-table-skeleton';
import { ProductDetailModal } from '@/features/products/components/details/product-detail-modal';
import {
  CategoryManagementTab,
  StoreStrategyTab,
  SpecialCraftsTab,
  ApprovalsTab
} from '@/features/products/components/tabs';
import { Product } from '@/services/products.client';
import { getAllProducts } from '@/services/products.server';

// 动态导入ProductArchivesTab以支持Suspense
const ProductArchivesTab = React.lazy(() => 
  import('@/features/products/components/tabs').then(module => ({
    default: module.ProductArchivesTab
  }))
);


export default async function ProductManagementPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  // 从URL参数获取筛选状态
  const searchTerm = typeof searchParams.q === 'string' ? searchParams.q : '';
  const categoryLevel1Filter = typeof searchParams.category1 === 'string' ? searchParams.category1 : 'all';
  const categoryLevel2Filter = typeof searchParams.category2 === 'string' ? searchParams.category2 : 'all';
  const statusFilter = typeof searchParams.status === 'string' ? searchParams.status : 'all';
  const currentPage = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const itemsPerPage = 10;

  // 使用服务端服务获取商品数据
  const products = await getAllProducts({
    searchTerm,
    categoryLevel1: categoryLevel1Filter,
    categoryLevel2: categoryLevel2Filter,
    status: statusFilter
  });

  return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">商品管理</h1>
            <p className="text-ink-500 mt-1">商品信息、分类、价格体系与审批流程</p>
          </div>
          <div className="flex space-x-3">
            <PaperButton variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              商品报表
            </PaperButton>
            <PaperButton variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              新增商品
            </PaperButton>
          </div>
        </div>

        <PaperCard>
          <PaperCardContent>
            <PaperNav vertical={false}>
              <PaperNavItem href="?tab=archives" active={searchParams.tab === 'archives' || !searchParams.tab} icon={<Package className="h-5 w-5" />}>商品档案</PaperNavItem>
              <PaperNavItem href="?tab=categories" active={searchParams.tab === 'categories'} icon={<Layers className="h-5 w-5" />}>分类管理</PaperNavItem>
              <PaperNavItem href="?tab=store-strategy" active={searchParams.tab === 'store-strategy'} icon={<Settings className="h-5 w-5" />}>门店策略</PaperNavItem>
              <PaperNavItem href="?tab=special-crafts" active={searchParams.tab === 'special-crafts'} icon={<Box className="h-5 w-5" />}>特殊工艺</PaperNavItem>
              <PaperNavItem href="?tab=approvals" active={searchParams.tab === 'approvals'} icon={<FileText className="h-5 w-5" />}>审批管理</PaperNavItem>
            </PaperNav>
          </PaperCardContent>
        </PaperCard>

        {(searchParams.tab === 'archives' || !searchParams.tab) && (
          <>
            <Suspense fallback={<ProductTableSkeleton />}>
              <ProductArchivesTab
                products={products}
                searchTerm={searchTerm}
                categoryLevel1Filter={categoryLevel1Filter}
                categoryLevel2Filter={categoryLevel2Filter}
                statusFilter={statusFilter}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
              />
            </Suspense>
          </>
        )}

        {searchParams.tab === 'categories' && <CategoryManagementTab />}

        {searchParams.tab === 'store-strategy' && <StoreStrategyTab products={products} />}

        {searchParams.tab === 'special-crafts' && <SpecialCraftsTab />}

        {searchParams.tab === 'approvals' && <ApprovalsTab />}
      </div>
  );
}
