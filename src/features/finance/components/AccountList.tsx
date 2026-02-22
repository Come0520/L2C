'use client';

import { logger } from "@/shared/lib/logger";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import Edit2 from 'lucide-react/dist/esm/icons/edit-2';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import { useState } from 'react';
import { AccountDialog } from './AccountDialog';
import { Badge } from '@/shared/ui/badge';
import type { InferSelectModel } from 'drizzle-orm';
import type { financeAccounts } from '@/shared/api/schema';

/** 财务账户行类型 */
type FinanceAccount = InferSelectModel<typeof financeAccounts>;

interface AccountListProps {
    accounts: FinanceAccount[];
}

export function AccountList({ accounts }: AccountListProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<FinanceAccount | null>(null);

    const handleEdit = (account: FinanceAccount) => {
        setEditingAccount(account);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingAccount(null);
        setIsDialogOpen(true);
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            BANK: '银行账户',
            WECHAT: '微信支付',
            ALIPAY: '支付宝',
            CASH: '现金账户',
        };
        return labels[type] || type;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">财务账户</h3>
                <Button onClick={handleCreate} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    添加账户
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>账户名称</TableHead>
                            <TableHead>类型</TableHead>
                            <TableHead>账号/卡号</TableHead>
                            <TableHead>持有人</TableHead>
                            <TableHead>当前余额</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {accounts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    暂无财务账户
                                </TableCell>
                            </TableRow>
                        ) : (
                            accounts.map((account) => (
                                <TableRow key={account.id}>
                                    <TableCell className="font-medium">
                                        {account.accountName}
                                        {account.isDefault && (
                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                                默认
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>{getTypeLabel(account.accountType)}</TableCell>
                                    <TableCell>{account.accountNumber || '-'}</TableCell>
                                    <TableCell>{account.holderName}</TableCell>
                                    <TableCell>¥ {parseFloat(account.balance).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={account.isActive ? 'success' : 'secondary'}
                                        >
                                            {account.isActive ? '启用' : '禁用'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AccountDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                initialData={editingAccount}
            />
        </div>
    );
}
