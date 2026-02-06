'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProcessorTable } from '@/features/supply-chain/components/processor-table';
import { ProcessorDialog } from '@/features/supply-chain/components/processor-dialog';
import { getSuppliers } from '@/features/supply-chain/actions/supplier-actions';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar';
import { Button } from '@/shared/ui/button';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { toast } from 'sonner';

export default function ProcessorsPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedProcessor, setSelectedProcessor] = useState<any>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 100; // 暂时每页显示100条

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 使用 type='PROCESSOR' 筛选加工厂
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

    // Table 中点击编辑触发
    // 由于 ProcessorTable 内部维护了 editingProcessor 状态并直接渲染 ProcessorDrawer，
    // 这里其实有冲突。ProcessorTable 的设计是 self-contained editing logic。
    // 我们应该保持一种模式。
    // 之前编写 ProcessorTable 时，它内部包含了 ProcessorDrawer。
    // 这样的话，Page 不需要渲染 ProcessorDrawer，只需要渲染 ProcessorTable。
    // 但是 Page 需要一个 "Create" 按钮，这个按钮需要打开 Drawer。
    // 如果 Drawer 在 Table 内部，Page 的 Create 按钮很难控制它，除非 Table 暴露 ref 或者 Table 也负责 Create。

    // 更好的做法：将 state 提升到 Page。
    // 我需要修改 ProcessorTable，让它接受 onEdit 回调，而不是自己管理 Drawer。
    // 这样 Page 统一管理 Drawer 的显隐。

    // 不过，为了少改动，我可以这样做：
    // Page 渲染一个主要用于 Create 的 Drawer。
    // Table 内部渲染一个用于 Edit 的 Drawer。
    // 缺点是代码冗余，但实现快。

    // 更好的做法是：修改 ProcessorTable，移除内部 Drawer，改由外部传入 onEdit。
    // 让我们先按这个 "提升状态" 的思路写 Page，然后回去改 ProcessorTable。

    const handleEdit = (processor: any) => {
        setSelectedProcessor(processor);
        setDialogOpen(true);
    };

    return (
        <div className="glass-liquid-ultra p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
            <DataTableToolbar
                searchProps={{
                    value: query,
                    onChange: setQuery,
                    placeholder: "搜索名称..."
                }}
                actions={
                    <Button onClick={handleCreate} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        新建加工厂
                    </Button>
                }
                className="border-none shadow-none p-0 bg-transparent"
            />

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
