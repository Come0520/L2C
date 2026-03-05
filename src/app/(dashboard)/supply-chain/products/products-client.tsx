'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ProductGrid } from '@/features/products/components/product-grid';
import { ProductFilter } from '@/features/products/components/product-filter';
import { useConfirm } from '@/shared/hooks/use-confirm';
import dynamic from 'next/dynamic';
const ProductDialog = dynamic(
  () => import('@/features/products/components/product-dialog').then((mod) => mod.ProductDialog),
  { ssr: false }
);
import { getProducts } from '@/features/products/actions/queries';
import { activateProduct, deleteProduct } from '@/features/products/actions/mutations';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Layers from 'lucide-react/dist/esm/icons/layers';
import Boxes from 'lucide-react/dist/esm/icons/boxes';
import Tags from 'lucide-react/dist/esm/icons/tags';
import { toast } from 'sonner';
import { AceternityTabs } from '@/shared/ui/aceternity-tabs';
import { ProductsToolbar } from '@/features/products/components/products-toolbar';
import { PackageManager } from '@/features/products/components/package-manager';
import { AttributeTemplateManager } from '@/features/products/components/attribute-template-manager';
import { Product } from '@/features/products/types';

export function ProductsClient({ initialData }: { initialData: Product[] }) {
  const [data, setData] = useState<Product[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('ALL');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [activeTab, setActiveTab] = useState('products');
  const isFirstRender = useRef(true);

  const fetchData = useCallback(async () => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
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
      setData((result.data?.data as unknown as Product[]) || []);
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

  const handleEdit = (product: Partial<Product>) => {
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

  const confirm = useConfirm();

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: '删除产品',
      description: '确定要删除该产品吗？该操作不可逆转。',
      variant: 'destructive',
    });
    if (!isConfirmed) return;
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
    <div className="space-y-6">
      <AceternityTabs
        tabs={[
          { value: 'products', title: '产品库', icon: <Boxes className="h-4 w-4" /> },
          { value: 'packages', title: '套餐管理', icon: <Layers className="h-4 w-4" /> },
          { value: 'templates', title: '属性模板', icon: <Tags className="h-4 w-4" /> },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'products' && (
        <div
          data-tab-value="products"
          className="glass-liquid-ultra rounded-2xl border border-white/10 p-6"
        >
          <div className="flex flex-col items-start gap-6 md:flex-row">
            <div className="w-full shrink-0 md:w-64">
              <ProductFilter category={category} onCategoryChange={setCategory} />
            </div>

            <div className="w-full flex-1 space-y-6">
              <ProductsToolbar
                search={query}
                onSearchChange={setQuery}
                onRefresh={fetchData}
                onAdd={handleAdd}
                onImportSuccess={fetchData}
                loading={loading}
                className="border-none bg-transparent p-0 shadow-none"
              />

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
        <div
          data-tab-value="packages"
          className="glass-liquid-ultra rounded-2xl border border-white/10 p-6"
        >
          <PackageManager />
        </div>
      )}

      {activeTab === 'templates' && (
        <div
          data-tab-value="templates"
          className="glass-liquid-ultra rounded-2xl border border-white/10 p-6"
        >
          <AttributeTemplateManager />
        </div>
      )}

      {isDialogOpen && (
        <ProductDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          initialData={
            editingProduct
              ? (editingProduct as unknown as React.ComponentProps<
                  typeof ProductDialog
                >['initialData'])
              : undefined
          }
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
