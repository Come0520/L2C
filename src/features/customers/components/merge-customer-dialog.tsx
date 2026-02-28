'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { toast } from 'sonner';
import Search from 'lucide-react/dist/esm/icons/search';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import UserCheck from 'lucide-react/dist/esm/icons/user-check';
import { mergeCustomersAction, previewMergeAction } from '../actions/mutations';
import { getCustomers } from '../actions/queries';
import { Input } from '@/shared/ui/input';
import { ScrollArea } from '@/shared/ui/scroll-area';

interface Customer {
  id: string;
  customerNo: string;
  name: string;
  phone: string;
  level: string | null;
}

interface MergeCustomerDialogProps {
  targetCustomer: Customer;
  userId: string;
  trigger?: React.ReactNode;
}

interface MergePreview {
  primary: Customer;
  secondary: Customer;
  conflicts: Record<string, { primary: string | number | null; secondary: string | number | null }>;
  affectedData: {
    orders: number;
    quotes: number;
    leads: number;
  };
}

export function MergeCustomerDialog({ targetCustomer, userId, trigger }: MergeCustomerDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [preview, setPreview] = useState<MergePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // 搜索客户
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        // Ensure params match getCustomers signature.
        // Assuming it accepts { search, page, pageSize }
        const res = await getCustomers({ search: searchTerm, page: 1, pageSize: 5 });
        // 排除目标客户自己
        // res.data is assumed to be Customer[] or compatible
        setSearchResults(res.data.filter((c: Customer) => c.id !== targetCustomer.id));
      } catch (_err) {
        toast.error('搜索客户失败');
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, targetCustomer.id]);

  // 预览合并
  useEffect(() => {
    if (!selectedSourceId) {
      setPreview(null);
      return;
    }

    const fetchPreview = async () => {
      try {
        const res = await previewMergeAction(selectedSourceId, targetCustomer.id);
        // Ensure res matches MergePreview
        setPreview(res as unknown as MergePreview);
      } catch (_err) {
        toast.error('获取预览失败');
      }
    };

    fetchPreview();
  }, [selectedSourceId, targetCustomer.id]);

  const handleMerge = async () => {
    if (!selectedSourceId) return;

    setLoading(true);
    try {
      await mergeCustomersAction(
        {
          targetCustomerId: targetCustomer.id,
          sourceCustomerIds: [selectedSourceId],
          fieldPriority: 'PRIMARY',
        },
        userId
      );
      toast.success('合并申请已提交，等待店长审批');
      setOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '合并失败';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">合并客户</Button>}
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle>合并客户档案</DialogTitle>
          <DialogDescription>
            将其他客户的订单、线索等数据迁移到主档案{' '}
            <strong>
              {targetCustomer.name} ({targetCustomer.customerNo})
            </strong>{' '}
            中。 注意：被合并的档案将被标记为已合并并停用。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden py-4">
          {!selectedSourceId ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                <Input
                  placeholder="输入姓名、电话或编号搜索要合并的客户..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <ScrollArea className="h-[300px] rounded-md border p-2">
                {searching ? (
                  <div className="text-muted-foreground py-8 text-center">搜索中...</div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((c) => (
                      <div
                        key={c.id}
                        className="hover:bg-muted/10 flex cursor-pointer items-center justify-between rounded border p-3 transition-colors"
                        onClick={() => setSelectedSourceId(c.id)}
                      >
                        <div>
                          <div className="font-medium">{c.name}</div>
                          <div className="text-muted-foreground text-xs">
                            {c.phone} | {c.customerNo}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          选择
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground py-8 text-center">
                    {searchTerm.length < 2 ? '请输入搜索关键词' : '未找到匹配客户'}
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto pr-2">
              <div className="bg-primary/5 border-primary/10 flex items-center justify-between rounded-lg border p-4">
                <div className="flex-1 text-center">
                  <div className="text-destructive mb-1 text-xs font-semibold">
                    被合并档案 (将被删除)
                  </div>
                  <div className="text-foreground font-bold">{preview?.secondary?.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {preview?.secondary?.customerNo}
                  </div>
                </div>
                <ArrowRight className="text-muted-foreground mx-4 h-6 w-6" />
                <div className="flex-1 text-center">
                  <div className="mb-1 text-xs font-semibold text-green-600">主档案 (保留)</div>
                  <div className="text-foreground font-bold">{targetCustomer.name}</div>
                  <div className="text-muted-foreground text-xs">{targetCustomer.customerNo}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-4 h-7 text-xs"
                  onClick={() => setSelectedSourceId(null)}
                >
                  重新选择
                </Button>
              </div>

              {preview && (
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>即将迁移的数据统计</AlertTitle>
                    <AlertDescription className="mt-2 grid grid-cols-3 gap-2">
                      <div className="glass-empty-state rounded border p-2 text-center">
                        <div className="text-lg font-bold">{preview.affectedData.orders}</div>
                        <div className="text-muted-foreground text-xs">订单</div>
                      </div>
                      <div className="glass-empty-state rounded border p-2 text-center">
                        <div className="text-lg font-bold">{preview.affectedData.quotes}</div>
                        <div className="text-muted-foreground text-xs">报价</div>
                      </div>
                      <div className="glass-empty-state rounded border p-2 text-center">
                        <div className="text-lg font-bold">{preview.affectedData.leads}</div>
                        <div className="text-muted-foreground text-xs">线索</div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  {Object.keys(preview.conflicts).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">字段冲突说明 (将保留主档案值)</h4>
                      <div className="divide-y rounded-md border text-xs">
                        {Object.entries(preview.conflicts).map(([field, vals]) => (
                          <div key={field} className="grid grid-cols-2 gap-4 p-2">
                            <div>
                              <span className="mr-2 text-gray-400">{field}:</span>
                              <span className="text-red-400 line-through">
                                {String(vals.secondary || '空')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ArrowRight className="h-3 w-3 text-gray-400" />
                              <span className="font-medium text-green-600">
                                {String(vals.primary || '空')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            取消
          </Button>
          <Button disabled={!selectedSourceId || loading} onClick={handleMerge}>
            {loading ? (
              '提交中...'
            ) : (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                提交合并申请
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
