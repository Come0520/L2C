import { getDebitNotes } from '@/features/finance/actions/debit-notes';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Plus, FileText, Clock, CheckCircle2, XCircle, FileCheck } from 'lucide-react';
import { formatDate } from '@/shared/lib/date';

/**
 * 借项通知单管理页面
 * 用于供应商扣款、退货等场景
 */
export default async function DebitNotesPage() {
    const result = await getDebitNotes();
    const notes = result.success ? result.data : [];

    return (
        <div className="space-y-6">
            {/* 页头 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">借项通知单</h1>
                    <p className="text-sm text-muted-foreground">供应商扣款、退货管理</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    新建借项
                </Button>
            </div>

            {/* 列表 */}
            {notes.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        暂无借项通知单
                    </CardContent>
                </Card>
            ) : (
                <div className="rounded-md border">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="p-3 text-left text-sm font-medium">单号</th>
                                <th className="p-3 text-left text-sm font-medium">供应商</th>
                                <th className="p-3 text-left text-sm font-medium">类型</th>
                                <th className="p-3 text-right text-sm font-medium">金额</th>
                                <th className="p-3 text-left text-sm font-medium">原因</th>
                                <th className="p-3 text-center text-sm font-medium">状态</th>
                                <th className="p-3 text-left text-sm font-medium">创建时间</th>
                                <th className="p-3 text-center text-sm font-medium">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notes.map((note) => (
                                <tr key={note.id} className="border-t hover:bg-muted/30">
                                    <td className="p-3 font-mono text-sm">{note.debitNoteNo}</td>
                                    <td className="p-3">{note.supplierName}</td>
                                    <td className="p-3">
                                        <TypeBadge type={note.type} />
                                    </td>
                                    <td className="p-3 text-right font-semibold text-green-600">
                                        ¥{Number(note.amount).toLocaleString()}
                                    </td>
                                    <td className="p-3 text-sm text-muted-foreground max-w-[200px] truncate">
                                        {note.reason}
                                    </td>
                                    <td className="p-3 text-center">
                                        <StatusBadge status={note.status} />
                                    </td>
                                    <td className="p-3 text-sm text-muted-foreground">
                                        {formatDate(note.createdAt)}
                                    </td>
                                    <td className="p-3 text-center">
                                        {note.status === 'PENDING' && (
                                            <div className="flex gap-1 justify-center">
                                                <Button size="sm" variant="outline" className="h-7 text-xs">
                                                    审批
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// 类型徽章
function TypeBadge({ type }: { type: string }) {
    const labels: Record<string, string> = {
        RETURN: '退货',
        QUALITY_DEDUCTION: '质量扣款',
        ADJUSTMENT: '调整',
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
}

// 状态徽章
function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { icon: React.ElementType; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
        DRAFT: { icon: Clock, label: '草稿', variant: 'secondary' },
        PENDING: { icon: Clock, label: '待审批', variant: 'outline' },
        APPROVED: { icon: CheckCircle2, label: '已通过', variant: 'default' },
        REJECTED: { icon: XCircle, label: '已拒绝', variant: 'destructive' },
        APPLIED: { icon: FileCheck, label: '已生效', variant: 'default' },
    };

    const { icon: Icon, label, variant } = config[status] || config.PENDING;

    return (
        <Badge variant={variant} className="gap-1">
            <Icon className="h-3 w-3" />
            {label}
        </Badge>
    );
}
