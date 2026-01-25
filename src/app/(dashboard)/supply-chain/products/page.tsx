'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProductGrid } from '@/features/products/components/product-grid';
import { ProductFilter } from '@/features/products/components/product-filter';
import { ProductDialog } from '@/features/products/components/product-dialog';
import { getProducts } from '@/features/products/actions/queries';
import { activateProduct, deleteProduct } from '@/features/products/actions/mutations';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Layers from 'lucide-react/dist/esm/icons/layers';
import Boxes from 'lucide-react/dist/esm/icons/boxes';
import Tags from 'lucide-react/dist/esm/icons/tags';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { PackageManager } from '@/features/products/components/package-manager';
import { AttributeTemplateManager } from '@/features/products/components/attribute-template-manager';
import { PageHeader } from '@/components/ui/page-header';
import { ProductImportDialog } from '@/features/products/components/product-import-dialog';

export default function ProductsPage() {
  const [data, setData] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('ALL');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<unknown>(null);

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
    <div className="space-y-6 p-6">
      <PageHeader title="基础资料管理" description="管理商品库、套餐方案及品类属性定义" />

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="products">
            <Boxes className="mr-2 h-4 w-4" /> 产品库
          </TabsTrigger>
          <TabsTrigger value="packages">
            <Layers className="mr-2 h-4 w-4" /> 套餐管理
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Tags className="mr-2 h-4 w-4" /> 属性模板
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="pt-6">
          <div className="flex flex-col items-start gap-6 md:flex-row">
            {/* Sidebar Filters */}
            <div className="w-full shrink-0 md:w-64">
              <ProductFilter category={category} onCategoryChange={setCategory} />
            </div>

            {/* Main Content */}
            <div className="w-full flex-1 space-y-6">
              {/* Search & Actions Bar */}
              <div className="bg-card/50 flex flex-col justify-between gap-4 rounded-lg border p-4 backdrop-blur-sm sm:flex-row">
                <div className="relative flex flex-1 items-center gap-2">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder="搜索 SKU 或名称..."
                    className="bg-background pl-9"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                  />
                  <Button onClick={fetchData} variant="secondary">
                    查询
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={fetchData} disabled={loading} size="icon">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                  <ProductImportDialog onSuccess={fetchData} />
                  <Button onClick={handleAdd} className="shadow-md transition-all hover:shadow-lg">
                    <Plus className="mr-2 h-4 w-4" /> 新增产品
                  </Button>
                </div>
              </div>

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
        </TabsContent>

        <TabsContent value="packages" className="pt-4">
          <PackageManager />
        </TabsContent>

        <TabsContent value="templates" className="pt-4">
          <AttributeTemplateManager />
        </TabsContent>
      </Tabs>

      <ProductDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialData={editingProduct}
        onSuccess={fetchData}
      />
    </div>
  );
}
