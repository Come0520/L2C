'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ProcessorTable } from '@/features/supply-chain/components/processor-table';
import { ProcessorDialog } from '@/features/supply-chain/components/processor-dialog';
import { getSuppliers } from '@/features/supply-chain/actions/supplier-actions';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar';
import { Button } from '@/shared/ui/button';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { toast } from 'sonner';

export function ProcessorsClient({
  initialData,
  initialTotal,
}: {
  initialData: any[];
  initialTotal: number;
}) {
  const [data, setData] = useState<any[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProcessor, setSelectedProcessor] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialTotal);
  const pageSize = 100;
  const isFirstRender = useRef(true);

  const fetchData = useCallback(async () => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setLoading(true);
    try {
      const result = await getSuppliers({ page, pageSize, query, type: 'PROCESSOR' });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setData(result.data?.data || []);
      setTotal(result.data?.total || 0);
    } catch {
      toast.error('获取加工厂列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = () => {
    setSelectedProcessor(null);
    setDialogOpen(true);
  };

  const handleEdit = (processor: any) => {
    setSelectedProcessor(processor);
    setDialogOpen(true);
  };

  return (
    <div className="glass-liquid-ultra flex flex-col gap-4 rounded-2xl border border-white/10 p-6">
      <DataTableToolbar
        searchProps={{
          value: query,
          onChange: setQuery,
          placeholder: '搜索名称...',
        }}
        actions={
          <Button onClick={handleCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            新建加工厂
          </Button>
        }
        className="border-none bg-transparent p-0 shadow-none"
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      ) : (
        <ProcessorTable
          data={data}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onEdit={handleEdit}
          onSuccess={fetchData}
        />
      )}

      {/* 用于新建/编辑的 Dialog */}
      <ProcessorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={selectedProcessor}
        onSuccess={fetchData}
      />
    </div>
  );
}
