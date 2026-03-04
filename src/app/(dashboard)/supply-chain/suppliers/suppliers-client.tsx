'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SupplierTable } from '@/features/supply-chain/components/supplier-table';
import { SupplierDialog } from '@/features/supply-chain/components/supplier-dialog';
import { getSuppliers, updateSupplier } from '@/features/supply-chain/actions/supplier-actions';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar';
import { Button } from '@/shared/ui/button';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { toast } from 'sonner';

export function SuppliersClient({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState<any[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const isFirstRender = useRef(true);

  const fetchData = useCallback(async () => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setLoading(true);
    try {
      const result = await getSuppliers({ page: 1, pageSize: 100, query });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setData(result.data?.data || []);
    } catch (_error: unknown) {
      toast.error('获取供应商失败');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = () => {
    setSelectedSupplier(null);
    setDialogOpen(true);
  };

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

      const refreshResult = await getSuppliers({ page: 1, pageSize: 100, query });
      if (!refreshResult.error) {
        setData(refreshResult.data?.data || []);
      }
    } catch (_error: unknown) {
      toast.error('操作失败');
    }
  };

  return (
    <div className="glass-liquid-ultra flex flex-col gap-4 rounded-2xl border border-white/10 p-6">
      <DataTableToolbar
        searchProps={{
          value: query,
          onChange: setQuery,
          placeholder: '搜索名称或编号...',
        }}
        actions={
          <Button onClick={handleCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            新建供应商
          </Button>
        }
        className="border-none bg-transparent p-0 shadow-none"
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      ) : (
        <SupplierTable data={data} onEdit={handleEdit} onToggleStatus={handleToggleStatus} />
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
