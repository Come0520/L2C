'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createInternalTransfer } from '../actions/transfers';
import { getFinanceAccounts } from '../actions/config';
import { useQuery } from '@tanstack/react-query';

interface CreateTransferDialogProps {
    trigger: React.ReactNode;
}

/**
 * 新建资金调拨弹窗
 */
export function CreateTransferDialog({ trigger }: CreateTransferDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [fromAccountId, setFromAccountId] = useState('');
    const [toAccountId, setToAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [remark, setRemark] = useState('');

    // 获取账户列表
    const { data: accountsData } = useQuery({
        queryKey: ['finance-accounts'],
        queryFn: async () => {
            const res = await getFinanceAccounts();
            return res || [];
        },
        enabled: open,
    });

    const accounts = accountsData || [];

    const handleSubmit = async () => {
        if (!fromAccountId || !toAccountId || !amount) {
            toast.error('请填写完整信息');
            return;
        }

        if (fromAccountId === toAccountId) {
            toast.error('转出和转入账户不能相同');
            return;
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            toast.error('请输入有效金额');
            return;
        }

        setLoading(true);
        try {
            const result = await createInternalTransfer({
                fromAccountId,
                toAccountId,
                amount: amountNum,
                remark: remark || undefined,
            });

            if (result.success) {
                toast.success('调拨成功');
                setOpen(false);
                resetForm();
                router.refresh();
            } else {
                toast.error(result.error || '调拨失败');
            }
        } catch (_error) {
            toast.error('操作失败');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFromAccountId('');
        setToAccountId('');
        setAmount('');
        setRemark('');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>新建资金调拨</DialogTitle>
                    <DialogDescription>
                        在账户间进行资金调拨，调拨后将自动生成双边流水
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="fromAccount">转出账户 *</Label>
                        <Select value={fromAccountId} onValueChange={setFromAccountId}>
                            <SelectTrigger>
                                <SelectValue placeholder="选择转出账户" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map((acc: any) => (
                                    <SelectItem key={acc.id} value={acc.id}>
                                        {acc.accountName} (¥{Number(acc.balance || 0).toLocaleString()})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="toAccount">转入账户 *</Label>
                        <Select value={toAccountId} onValueChange={setToAccountId}>
                            <SelectTrigger>
                                <SelectValue placeholder="选择转入账户" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map((acc: any) => (
                                    <SelectItem key={acc.id} value={acc.id}>
                                        {acc.accountName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">调拨金额 *</Label>
                        <Input
                            id="amount"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="请输入金额"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="remark">备注</Label>
                        <Textarea
                            id="remark"
                            placeholder="调拨原因或说明"
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        取消
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        确认调拨
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
