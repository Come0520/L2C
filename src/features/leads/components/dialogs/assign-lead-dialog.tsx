'use client';

import { logger } from '@/shared/lib/logger';
import { useState, useEffect, useMemo, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { AssignLeadDialogProps, SalesUser } from '../../types';
import { getSalesUsers } from '../../actions/queries';
import { assignLead } from '../../actions/mutations';
import { toast } from 'sonner';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import Star from 'lucide-react/dist/esm/icons/star';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';

export function AssignLeadDialog({
  leadId,
  currentAssignedId,
  createdById,
  createdByName,
  notes,
  customerName,
  open,
  onOpenChange,
  onSuccess,
}: AssignLeadDialogProps) {
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);
  const [selectedSalesId, setSelectedSalesId] = useState<string>(currentAssignedId || '');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 加载销售列表
  useEffect(() => {
    let mounted = true;
    if (open) {
      setTimeout(() => {
        if (mounted) setIsLoadingUsers(true);
      }, 0);
      getSalesUsers()
        .then((data) => {
          if (!mounted) return;
          const users: SalesUser[] = data.map((u) => ({
            id: u.id,
            name: u.name,
            role: u.role || undefined,
          }));
          setSalesUsers(users);
        })
        .catch((err) => {
          if (!mounted) return;
          logger.error('Failed to load sales users:', err);
          toast.error('加载销售列表失败');
        })
        .finally(() => {
          if (mounted) setIsLoadingUsers(false);
        });

      // 如果有创建人且在销售列表中，则默认推荐选中创建人
      if (currentAssignedId) {
        setTimeout(() => {
          if (mounted) setSelectedSalesId(currentAssignedId);
        }, 0);
      } else if (createdById) {
        // 默认推荐选中创建人
        setTimeout(() => {
          if (mounted) setSelectedSalesId(createdById);
        }, 0);
      } else {
        setTimeout(() => {
          if (mounted) setSelectedSalesId('');
        }, 0);
      }
    }
    return () => {
      mounted = false;
    };
  }, [open, currentAssignedId, createdById]);

  // 排序销售列表：创建人排第一
  const sortedSalesUsers = useMemo(() => {
    if (!createdById || salesUsers.length === 0) return salesUsers;
    const creator = salesUsers.find((u) => u.id === createdById);
    if (!creator) return salesUsers;
    return [creator, ...salesUsers.filter((u) => u.id !== createdById)];
  }, [salesUsers, createdById]);

  const handleAssign = () => {
    if (!selectedSalesId) {
      toast.warning('请选择销售人员');
      return;
    }

    startTransition(async () => {
      try {
        const res = await assignLead({ id: leadId, salesId: selectedSalesId });
        if (res.success) {
          toast.success('分配成功');
          onSuccess?.();
          onOpenChange(false);
        } else {
          toast.error(res.error || '分配失败');
        }
      } catch (error) {
        logger.error('Assign lead error:', error);
        const message = error instanceof Error ? error.message : '分配失败';
        toast.error(message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>分配线索</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* 线索信息摘要卡片 */}
          {(customerName || createdByName || notes) && (
            <div className="bg-muted/30 space-y-2 rounded-lg border p-3">
              {customerName && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">客户</span>
                  <span className="font-medium">{customerName}</span>
                </div>
              )}
              {createdByName && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">录入人</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                    {createdByName}
                  </span>
                </div>
              )}
              {notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">备注：</span>
                  <span className="text-foreground">{notes}</span>
                </div>
              )}
            </div>
          )}

          {/* 销售选择器 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">选择销售人员</label>
            <Select
              value={selectedSalesId}
              onValueChange={setSelectedSalesId}
              disabled={isLoadingUsers || isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingUsers ? '加载中...' : '选择销售...'} />
              </SelectTrigger>
              <SelectContent>
                {sortedSalesUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <span className="flex items-center gap-2">
                      {user.name}
                      {user.id === currentAssignedId && (
                        <Badge variant="outline" className="h-4 px-1 text-[10px]">
                          当前
                        </Badge>
                      )}
                      {user.id === createdById && user.id !== currentAssignedId && (
                        <Badge
                          variant="secondary"
                          className="h-4 bg-yellow-100 px-1 text-[10px] text-yellow-700"
                        >
                          ⭐ 推荐
                        </Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {createdById && createdByName && !currentAssignedId && (
              <p className="text-muted-foreground text-xs">
                💡 推荐分配给录入人 <span className="font-medium">{createdByName}</span>
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            取消
          </Button>
          <Button onClick={handleAssign} disabled={isPending || isLoadingUsers || !selectedSalesId}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            确认分配
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
