'use client';

import { Suspense, useState, useEffect } from 'react';
import { SupplierTable } from '@/features/supply-chain/components/supplier-table';
import { SupplierDialog } from '@/features/supply-chain/components/supplier-dialog';
import { getSuppliers, updateSupplier } from '@/features/supply-chain/actions/supplier-actions';
import { Button } from '@/shared/ui/button';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { Input } from '@/shared/ui/input';
import { toast } from 'sonner';

export default function SuppliersPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any[]>([]); // 供应商列表类型后续可精确定义
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null); // 供应商类型后续可精确定义

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await getSuppliers({ page: 1, pageSize: 100, query });
            if (result.error) {
                toast.error(result.error);
                return;
            }
            setData(result.data?.data || []);
        } catch (error: unknown) {
            toast.error('获取供应商失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [query]);

    const handleCreate = () => {
        setSelectedSupplier(null);
        setDialogOpen(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEdit = (supplier: any) => { // 供应商类型后续可精确定义
        setSelectedSupplier(supplier);
        setDialogOpen(true);
    };

    const handleToggleStatus = async (id: string, active: boolean) => {
        try {
            const result = await updateSupplier({ id, isActive: active });
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success(active ? '供应商已启用' : '供应商已停用');
            fetchData();
        } catch (error: unknown) {
            toast.error('操作失败');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">供应商管理</h1>
                    <p className="text-muted-foreground">
                        管理系统中的所有供应商及其基本信息。
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    新建供应商
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索名称或编号..."
                        className="pl-8"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <SupplierTable
                    data={data}
                    onEdit={handleEdit}
                    onToggleStatus={handleToggleStatus}
                />
            )}

            <SupplierDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                initialData={selectedSupplier}
                onSuccess={fetchData}
            />
        </div>
    );
}
