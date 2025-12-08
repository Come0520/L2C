'use client';

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

import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card';
import { PaperNav, PaperNavItem } from '@/components/ui/paper-nav';
import { ProductDetailModal } from '@/features/products/components/details/product-detail-modal';
import {
  ProductArchivesTab,
  CategoryManagementTab,
  StoreStrategyTab,
  SpecialCraftsTab,
  ApprovalsTab
} from '@/features/products/components/tabs';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/services/products.client';



export default function ProductManagementPage() {
  const [activeTab, setActiveTab] = React.useState<'archives' | 'categories' | 'store-strategy' | 'special-crafts' | 'approvals'>('archives');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [categoryLevel1Filter, setCategoryLevel1Filter] = React.useState('all');
  const [categoryLevel2Filter, setCategoryLevel2Filter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(10);

  const { products, isLoading, isError } = useProducts();

  // 一级分类选项
  // const categoryLevel1Options = [
  //   { value: 'all', label: '全部分类' },
  //   { value: '窗帘', label: '窗帘' },
  //   { value: '墙布', label: '墙布' },
  //   { value: '墙咔', label: '墙咔' },
  //   { value: '飘窗垫', label: '飘窗垫' },
  //   { value: '标品', label: '标品' },
  //   { value: '礼品', label: '礼品' },
  //   { value: '销售道具', label: '销售道具' }
  // ];

  // 二级分类选项（根据一级分类动态生成）
  // const getCategoryLevel2Options = () => {
  //   const allOptions = [
  //     { value: 'all', label: '全部子分类' }
  //   ];

  //   if (categoryLevel1Filter === 'all' || categoryLevel1Filter === '窗帘') {
  //     allOptions.push(
  //       { value: '布', label: '布' },
  //       { value: '纱', label: '纱' },
  //       { value: '轨道', label: '轨道' },
  //       { value: '电机', label: '电机' },
  //       { value: '功能帘', label: '功能帘' },
  //       { value: '绑带', label: '绑带' }
  //     );
  //   }

  //   if (categoryLevel1Filter === 'all' || categoryLevel1Filter === '墙布') {
  //     allOptions.push(
  //       { value: '艺术漆', label: '艺术漆' },
  //       { value: '提花', label: '提花' },
  //       { value: '印花', label: '印花' }
  //     );
  //   }

  //   if (categoryLevel1Filter === 'all' || categoryLevel1Filter === '墙咔') {
  //     allOptions.push(
  //       { value: '大板', label: '大板' },
  //       { value: '小板', label: '小板' },
  //       { value: '灯带', label: '灯带' },
  //       { value: '金属条', label: '金属条' }
  //     );
  //   }

  //   if (categoryLevel1Filter === 'all' || categoryLevel1Filter === '飘窗垫') {
  //     allOptions.push(
  //       { value: '有底板', label: '有底板' },
  //       { value: '没底板', label: '没底板' }
  //     );
  //   }

  //   if (categoryLevel1Filter === 'all' || categoryLevel1Filter === '标品') {
  //     allOptions.push(
  //       { value: '毛浴巾', label: '毛浴巾' },
  //       { value: '四件套', label: '四件套' },
  //       { value: '被芯', label: '被芯' },
  //       { value: '枕芯', label: '枕芯' }
  //     );
  //   }

  //   if (categoryLevel1Filter === 'all' || categoryLevel1Filter === '礼品') {
  //     allOptions.push(
  //       { value: '办公用品', label: '办公用品' },
  //       { value: '家居用品', label: '家居用品' },
  //       { value: '定制礼品', label: '定制礼品' },
  //       { value: '促销礼品', label: '促销礼品' }
  //     );
  //   }

  //   if (categoryLevel1Filter === 'all' || categoryLevel1Filter === '销售道具') {
  //     allOptions.push(
  //       { value: '展示器材', label: '展示器材' },
  //       { value: '宣传物料', label: '宣传物料' },
  //       { value: '样品', label: '样品' },
  //       { value: '工具包', label: '工具包' }
  //     );
  //   }

  //   return allOptions;
  // };

  // 状态选项
  // const statusOptions = [
  //   { value: 'all', label: '全部状态' },
  //   { value: 'draft', label: '草稿' },
  //   { value: 'pending', label: '待审核' },
  //   { value: 'approved', label: '已通过' },
  //   { value: 'rejected', label: '已驳回' },
  //   { value: 'online', label: '已上架' },
  //   { value: 'offline', label: '已下架' }
  // ];

  // 筛选商品
  //  // const filteredProducts = products.filter(product => {
  //   const matchesSearch =
  //     product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     product.productCode.toLowerCase().includes(searchTerm.toLowerCase());
  //
  //   const matchesCategoryLevel1 = categoryLevel1Filter === 'all' || product.categoryLevel1 === categoryLevel1Filter;
  //   const matchesCategoryLevel2 = categoryLevel2Filter === 'all' || product.categoryLevel2 === categoryLevel2Filter;
  //   const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
  //
  //   return matchesSearch && matchesCategoryLevel1 && matchesCategoryLevel2 && matchesStatus;
  // });// });

  // const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  // const startIndex = (currentPage - 1) * itemsPerPage;
  // const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg text-ink-500">加载中...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg text-red-500">加载失败，请稍后重试</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
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
              <PaperNavItem href="#" active={activeTab === 'archives'} onClick={() => setActiveTab('archives')} icon={<Package className="h-5 w-5" />}>商品档案</PaperNavItem>
              <PaperNavItem href="#" active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} icon={<Layers className="h-5 w-5" />}>分类管理</PaperNavItem>
              <PaperNavItem href="#" active={activeTab === 'store-strategy'} onClick={() => setActiveTab('store-strategy')} icon={<Settings className="h-5 w-5" />}>门店策略</PaperNavItem>
              <PaperNavItem href="#" active={activeTab === 'special-crafts'} onClick={() => setActiveTab('special-crafts')} icon={<Box className="h-5 w-5" />}>特殊工艺</PaperNavItem>
              <PaperNavItem href="#" active={activeTab === 'approvals'} onClick={() => setActiveTab('approvals')} icon={<FileText className="h-5 w-5" />}>审批管理</PaperNavItem>
            </PaperNav>
          </PaperCardContent>
        </PaperCard>

        {activeTab === 'archives' && (
          <>
            <ProductArchivesTab
              products={products}
              searchTerm={searchTerm}
              categoryLevel1Filter={categoryLevel1Filter}
              categoryLevel2Filter={categoryLevel2Filter}
              statusFilter={statusFilter}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onSearchChange={setSearchTerm}
              onCategoryLevel1Change={setCategoryLevel1Filter}
              onCategoryLevel2Change={setCategoryLevel2Filter}
              onStatusChange={setStatusFilter}
              onPageChange={setCurrentPage}
              onViewProduct={setSelectedProduct}
            />
            {selectedProduct && (
              <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
            )}
          </>
        )}

        {activeTab === 'categories' && <CategoryManagementTab />}

        {activeTab === 'store-strategy' && <StoreStrategyTab products={products} />}

        {activeTab === 'special-crafts' && <SpecialCraftsTab />}

        {activeTab === 'approvals' && <ApprovalsTab />}
      </div>
    </DashboardLayout>
  );
}
