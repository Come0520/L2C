'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Loader2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { toggleTestimonialApproval, deleteTestimonial } from '../actions';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/shared/ui/alert-dialog';

interface TestimonialItem {
    id: string;
    content: string;
    authorName: string;
    authorRole: string | null;
    authorCompany: string | null;
    isApproved: boolean;
    createdAt: Date | string | null;
}

export function TestimonialsClient({ initialData }: { initialData: TestimonialItem[] }) {
    const [data, setData] = useState(initialData);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleToggleApproval = async (id: string, currentStatus: boolean) => {
        setLoadingId(id);
        const newStatus = !currentStatus;
        const res = await toggleTestimonialApproval(id, newStatus);

        if (res.success) {
            toast.success(`已${newStatus ? '通过' : '取消'}审核`);
            setData((prev) =>
                prev.map((item) =>
                    item.id === id ? { ...item, isApproved: newStatus } : item
                )
            );
        } else {
            toast.error('操作失败', { description: res.error });
        }
        setLoadingId(null);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setLoadingId(deleteId);
        const res = await deleteTestimonial(deleteId);

        if (res.success) {
            toast.success('评价已删除');
            setData((prev) => prev.filter((item) => item.id !== deleteId));
        } else {
            toast.error('删除失败', { description: res.error });
        }
        setLoadingId(null);
        setDeleteId(null);
    };

    return (
        <div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">姓名</TableHead>
                            <TableHead className="w-[150px]">公司 / 职位</TableHead>
                            <TableHead>评价内容</TableHead>
                            <TableHead className="w-[100px]">状态</TableHead>
                            <TableHead className="w-[150px]">提交时间</TableHead>
                            <TableHead className="w-[180px] text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    暂无留言数据
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.authorName}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                            <span>{item.authorCompany || '-'}</span>
                                            <span className="text-xs">{item.authorRole || '-'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[300px] whitespace-pre-wrap wrap-break-word">
                                        {item.content}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={item.isApproved ? 'default' : 'secondary'} className={item.isApproved ? 'bg-green-500 hover:bg-green-600' : ''}>
                                            {item.isApproved ? '已通过' : '待审核'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {item.createdAt ? format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm') : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant={item.isApproved ? 'outline' : 'default'}
                                                size="sm"
                                                className={item.isApproved ? 'text-amber-600 hover:text-amber-700' : 'bg-blue-600 hover:bg-blue-700'}
                                                disabled={loadingId === item.id}
                                                onClick={() => handleToggleApproval(item.id, item.isApproved)}
                                            >
                                                {loadingId === item.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : item.isApproved ? (
                                                    <>
                                                        <XCircle className="mr-1 h-4 w-4" /> 取消
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="mr-1 h-4 w-4" /> 通过
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                                disabled={loadingId === item.id}
                                                onClick={() => setDeleteId(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除这条评价？</AlertDialogTitle>
                        <AlertDialogDescription>
                            此操作不可撤销，删除后该评价将从系统中彻底移除。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                        >
                            确认删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
