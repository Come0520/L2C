'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProductGrid } from '@/features/products/components/product-grid';
import { ProductFilter } from '@/features/products/components/product-filter';
import { ProductDialog } from '@/features/products/components/product-dialog';
import { getProducts } from '@/features/products/actions/queries';
import { activateProduct, deleteProduct } from '@/features/products/actions/mutations';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Layers from 'lucide-react/dist/esm/icons/layers';
import Boxes from 'lucide-react/dist/esm/icons/boxes';
import Tags from 'lucide-react/dist/esm/icons/tags';
import { toast } from 'sonner';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'; // Removed
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { ProductsToolbar } from '@/features/products/components/products-toolbar';
import { PackageManager } from '@/features/products/components/package-manager';
import { AttributeTemplateManager } from '@/features/products/components/attribute-template-manager';

export default function ProductsPage() {
  const [data, setData] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('ALL');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<unknown>(null);
  const [activeTab, setActiveTab] = useState('products');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProducts({
        page: 1,
        pageSize: 50,
        search: query,
        category: category === 'ALL' ? undefined : category,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setData(result.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('获取产品列表失败');
    } finally {
      setLoading(false);
    }
  }, [query, category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (product: unknown) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const result = await activateProduct({ id, isActive: !currentStatus });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(!currentStatus ? '产品已上架' : '产品已下架');
      fetchData();
    } catch (_error) {
      toast.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该产品吗？')) return;
    try {
      const result = await deleteProduct({ id });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('产品已删除');
      fetchData();
    } catch (_error) {
      toast.error('删除失败');
    }
  };

  return (
    <div className="space-y-4">
      <AnimatedTabs
        tabs={[
          { value: 'products', label: '产品库', icon: <Boxes className="mr-2 h-4 w-4" /> },
          { value: 'packages', label: '套餐管理', icon: <Layers className="mr-2 h-4 w-4" /> },
          { value: 'templates', label: '属性模板', icon: <Tags className="mr-2 h-4 w-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      >
        {activeTab === 'products' && (
        <div data-tab-value="products" className="glass-liquid-ultra p-6 rounded-2xl border border-white/10">
          <div className="flex flex-col items-start gap-6 md:flex-row">
            {/* Sidebar Filters */}
            <div className="w-full shrink-0 md:w-64">
              <ProductFilter category={category} onCategoryChange={setCategory} />
            </div>

            {/* Main Content */}
            <div className="w-full flex-1 space-y-6">
              <ProductsToolbar
                search={query}
                onSearchChange={setQuery}
                onRefresh={fetchData}
                onAdd={handleAdd}
                onImportSuccess={fetchData}
                loading={loading}
                className="border-none shadow-none p-0 bg-transparent"
              />


              {/* Product Grid */}
              <div className="min-h-[500px]">
                {loading ? (
                  <div className="flex h-64 items-center justify-center">
                    <RefreshCw className="text-primary h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <ProductGrid
                    data={data}
                    onEdit={handleEdit}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDelete}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        )}

        {activeTab === 'packages' && (
        <div data-tab-value="packages" className="glass-liquid-ultra p-6 rounded-2xl border border-white/10">
          <PackageManager />
        </div>
        )}

        {activeTab === 'templates' && (
        <div data-tab-value="templates" className="glass-liquid-ultra p-6 rounded-2xl border border-white/10">
          <AttributeTemplateManager />
        </div>
        )}
      </AnimatedTabs>

      <ProductDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialData={editingProduct}
        onSuccess={fetchData}
      />
    </div>
  );
}
