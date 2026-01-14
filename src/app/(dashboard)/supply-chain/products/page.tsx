'use client';

import { useState, useEffect } from 'react';
import { ProductTable } from '@/features/products/components/product-table';
import { ProductDialog } from '@/features/products/components/product-dialog';
import { getProducts } from '@/features/products/actions/queries';
import { activateProduct, deleteProduct } from '@/features/products/actions/mutations';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductsPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await getProducts({ page: 1, pageSize: 50, search: query });
            if (result.error) {
                toast.error(result.error);
                return;
            }
            setData(result.data?.data || []);
        } catch (error) {
            toast.error('获取产品列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = () => {
        setEditingProduct(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (product: any) => {
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
        } catch (error) {
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
        } catch (error) {
            toast.error('删除失败');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">产品管理</h1>
                    <p className="text-muted-foreground text-sm">管理系统中的所有产品及规格、价格体系</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> 刷新
                    </Button>
                    <Button onClick={handleAdd}>
                        <Plus className="h-4 w-4 mr-2" /> 新增产品
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索 SKU 或名称..."
                        className="pl-8"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                    />
                </div>
                <Button onClick={fetchData}>查询</Button>
            </div>

            <ProductTable
                data={data}
                onEdit={handleEdit}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDelete}
            />

            <ProductDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                initialData={editingProduct}
                onSuccess={fetchData}
            />
        </div>
    );
}
