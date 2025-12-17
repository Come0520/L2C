import {
  Plus,
  Package,
  Layers,
  BarChart3,
  Settings,
  Box,
  FileText
} from 'lucide-react';
import React from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card';
import { PaperNav, PaperNavItem } from '@/components/ui/paper-nav';
import { getAllProducts } from '@/services/products.server';

// 占位符组件 - 待开发
const PlaceholderTab = ({ title }: { title: string }) => (
  <PaperCard>
    <PaperCardContent>
      <div className="text-center py-12 text-ink-500">
        <p className="text-lg font-medium">{title}</p>
        <p className="text-sm mt-2">功能开发中...</p>
      </div>
    </PaperCardContent>
  </PaperCard>
);

// 商品档案Tab组件
const ProductArchivesTab = ({ products }: { products: any[] }) => (
  <PaperCard>
    <PaperCardContent>
      <div className="text-center py-8">
        <p className="text-lg font-medium text-ink-800">商品列表</p>
        <p className="text-ink-500 mt-2">共 {products?.length || 0} 个商品</p>
        <p className="text-sm text-ink-400 mt-4">商品管理功能开发中...</p>
      </div>
    </PaperCardContent>
  </PaperCard>
);

export default async function ProductManagementPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  // 从URL参数获取筛选状态
  const searchTerm = typeof searchParams.q === 'string' ? searchParams.q : '';
  const categoryLevel1Filter = typeof searchParams.category1 === 'string' ? searchParams.category1 : 'all';
  const categoryLevel2Filter = typeof searchParams.category2 === 'string' ? searchParams.category2 : 'all';
  const statusFilter = typeof searchParams.status === 'string' ? searchParams.status : 'all';

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
        <ProductArchivesTab products={products} />
      )}

      {searchParams.tab === 'categories' && <PlaceholderTab title="分类管理" />}

      {searchParams.tab === 'store-strategy' && <PlaceholderTab title="门店策略" />}

      {searchParams.tab === 'special-crafts' && <PlaceholderTab title="特殊工艺" />}

      {searchParams.tab === 'approvals' && <PlaceholderTab title="审批管理" />}
    </div>
  );
}
