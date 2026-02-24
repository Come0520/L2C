'use client';

import { useState } from 'react';
import { updateSalesTarget } from '@/features/sales/actions/targets';
import { SalesTargetDTO } from '@/features/sales/types';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent } from '@/shared/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

interface TargetsClientPageProps {
    initialTargets: SalesTargetDTO[];
    initialYear: number;
    initialMonth: number;
}

export function TargetsClientPage({ initialTargets, initialYear, initialMonth }: TargetsClientPageProps) {
    const router = useRouter();
    const [year, setYear] = useState(String(initialYear));
    const [month, setMonth] = useState(String(initialMonth));
    const [loading, setLoading] = useState<string | null>(null); // userId being updated

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState('');

    const handleDateChange = (newYear: string, newMonth: string) => {
        setYear(newYear);
        setMonth(newMonth);
        router.push(`/settings/sales/targets?year=${newYear}&month=${newMonth}`);
    };

    const handleEdit = (target: SalesTargetDTO) => {
        setEditingId(target.userId);
        setEditAmount(String(target.targetAmount));
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditAmount('');
    };

    const handleSave = async (userId: string) => {
        const amount = parseFloat(editAmount);
        if (isNaN(amount) || amount < 0) {
            toast.error('请输入有效金额');
            return;
        }

        setLoading(userId);
        try {
            const res = await updateSalesTarget(userId, parseInt(year), parseInt(month), amount);
            if (res.success) {
                toast.success('设置成功');
                setEditingId(null);
                router.refresh(); // Refresh server component
            } else {
                toast.error(res.error || '设置失败');
            }
        } catch (error) {
            toast.error('网络错误');
        } finally {
            setLoading(null);
        }
    };

    const totalTarget = initialTargets.reduce((sum, item) => sum + item.targetAmount, 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between bg-card p-4 rounded-lg border">
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">年份</span>
                        <Select value={year} onValueChange={(val) => handleDateChange(val, month)}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 5 }).map((_, i) => {
                                    const y = new Date().getFullYear() - 2 + i;
                                    return <SelectItem key={y} value={String(y)}>{y}年</SelectItem>;
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm">月份</span>
                        <Select value={month} onValueChange={(val) => handleDateChange(year, val)}>
                            <SelectTrigger className="w-[80px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}月</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="text-sm font-medium">
                    总目标: <span className="text-primary text-lg ml-2">¥{totalTarget.toLocaleString()}</span>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>销售人员</TableHead>
                                <TableHead className="text-right">目标金额 (¥)</TableHead>
                                <TableHead className="w-[150px] text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialTargets.map((item) => (
                                <TableRow key={item.userId}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {/* Avatar could go here */}
                                            <span>{item.userName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {editingId === item.userId ? (
                                            <Input
                                                type="number"
                                                value={editAmount}
                                                onChange={(e) => setEditAmount(e.target.value)}
                                                className="w-32 ml-auto text-right h-8"
                                                autoFocus
                                            />
                                        ) : (
                                            item.targetAmount.toLocaleString()
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {editingId === item.userId ? (
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="ghost" onClick={handleCancel} disabled={!!loading}>取消</Button>
                                                <Button size="sm" onClick={() => handleSave(item.userId)} disabled={!!loading}>保存</Button>
                                            </div>
                                        ) : (
                                            <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>设置</Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {initialTargets.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                        暂无销售人员
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
