'use client';

import { Suspense, useState, useEffect } from 'react';
import { SupplierTable } from '@/features/supply-chain/components/supplier-table';
import { SupplierDialog } from '@/features/supply-chain/components/supplier-dialog';
import { getSuppliers, updateSupplier } from '@/features/supply-chain/actions/supplier-actions';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar';
import { Button } from '@/shared/ui/button';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { toast } from 'sonner';

export default function SuppliersPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

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
    const handleEdit = (supplier: any) => {
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
        <div className="glass-liquid-ultra p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
            <DataTableToolbar
                searchProps={{
                    value: query,
                    onChange: setQuery,
                    placeholder: "搜索名称或编号..."
                }}
                actions={
                    <Button onClick={handleCreate} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        新建供应商
                    </Button>
                }
                className="border-none shadow-none p-0 bg-transparent"
            />

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
