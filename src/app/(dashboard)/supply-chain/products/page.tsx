'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProductTable } from '@/features/products/components/product-table';
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


import { productCategoryEnum } from '@/shared/api/schema/enums';
import { ScrollArea, ScrollBar } from '@/shared/ui/scroll-area';

const CATEGORY_LABELS: Record<string, string> = {
    'CURTAIN': '窗帘',
    'WALLPAPER': '墙纸',
    'WALLCLOTH': '墙布',
    'MATTRESS': '床垫',
    'OTHER': '其他',
    'CURTAIN_FABRIC': '窗帘面料',
    'CURTAIN_SHEER': '窗纱',
    'CURTAIN_TRACK': '窗帘轨道',
    'MOTOR': '电机',
    'CURTAIN_ACCESSORY': '窗帘辅料',
    'WALLCLOTH_ACCESSORY': '墙布辅料',
    'WALLPANEL': '墙咔',
    'WINDOWPAD': '飘窗垫',
    'STANDARD': '标品',
    'SERVICE': '服务/费用'
};

export default function ProductsPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<string>('ALL');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getProducts({
                page: 1,
                pageSize: 50,
                search: query,
                category: category === 'ALL' ? undefined : category
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
            <PageHeader
                title="基础资料管理"
                description="管理商品库、套餐方案及品类属性定义"
            />

            <Tabs defaultValue="products" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="products">
                        <Boxes className="h-4 w-4 mr-2" /> 产品库
                    </TabsTrigger>
                    <TabsTrigger value="packages">
                        <Layers className="h-4 w-4 mr-2" /> 套餐管理
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                        <Tags className="h-4 w-4 mr-2" /> 属性模板
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="space-y-6 pt-4">
                    <Tabs defaultValue="ALL" className="w-full" onValueChange={(val) => {
                        setCategory(val);
                        // Reset query is optional, but usually good to keep search. 
                        // fetchData will be triggered by useEffect when category changes
                    }}>
                        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                            <TabsList className="w-full justify-start h-auto p-2 bg-background">
                                <TabsTrigger value="ALL">全部</TabsTrigger>
                                {productCategoryEnum.enumValues.map((cat) => (
                                    <TabsTrigger key={cat} value={cat}>
                                        {CATEGORY_LABELS[cat] || cat}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </Tabs>

                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
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
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={fetchData} disabled={loading}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> 刷新
                            </Button>
                            <Button onClick={handleAdd}>
                                <Plus className="h-4 w-4 mr-2" /> 新增产品
                            </Button>
                        </div>
                    </div>

                    <ProductTable
                        data={data}
                        onEdit={handleEdit}
                        onToggleStatus={handleToggleStatus}
                        onDelete={handleDelete}
                    />
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
