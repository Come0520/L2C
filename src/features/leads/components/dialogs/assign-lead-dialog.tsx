'use client';

import { logger } from "@/shared/lib/logger";
import { useState, useEffect, useTransition } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { AssignLeadDialogProps, SalesUser } from '../../types';
import { getSalesUsers } from '../../actions/queries';
import { assignLead } from '../../actions/mutations';
import { toast } from 'sonner';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';

export function AssignLeadDialog({
    leadId,
    currentAssignedId,
    open,
    onOpenChange,
    onSuccess
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
                .then(data => {
                    if (!mounted) return;
                    // 适配后端返回类型
                    const users: SalesUser[] = data.map(u => ({
                        id: u.id,
                        name: u.name,
                        role: u.role || undefined
                    }));
                    setSalesUsers(users);
                })
                .catch(err => {
                    if (!mounted) return;
                    logger.error('Failed to load sales users:', err);
                    toast.error('加载销售列表失败');
                })
                .finally(() => {
                    if (mounted) setIsLoadingUsers(false);
                });

            // 重置选中状态为当前分配人
            if (currentAssignedId) {
                setTimeout(() => {
                    if (mounted) setSelectedSalesId(currentAssignedId);
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
    }, [open, currentAssignedId]);

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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>分配线索</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">选择销售人员</label>
                        <Select
                            value={selectedSalesId}
                            onValueChange={setSelectedSalesId}
                            disabled={isLoadingUsers || isPending}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingUsers ? "加载中..." : "选择销售..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {salesUsers.map(user => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name} {user.id === currentAssignedId ? '(当前)' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
