'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import Edit from 'lucide-react/dist/esm/icons/edit';
import Ban from 'lucide-react/dist/esm/icons/ban';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import { Badge } from '@/shared/ui/badge';

interface Supplier {
    id: string;
    supplierNo: string;
    name: string;
    contactPerson: string | null;
    phone: string | null;
    paymentPeriod: string;
    isActive: boolean;
}

interface SupplierTableProps {
    data: Supplier[];
    onEdit: (supplier: Supplier) => void;
    onToggleStatus: (id: string, active: boolean) => void;
}

export function SupplierTable({ data, onEdit, onToggleStatus }: SupplierTableProps) {
    return (
        <div className="glass-table overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="glass-table-header">
                        <TableHead className="w-[130px]">供应商编号</TableHead>
                        <TableHead className="w-[200px]">供应商名称</TableHead>
                        <TableHead className="w-[120px]">联系人</TableHead>
                        <TableHead className="w-[120px]">电话</TableHead>
                        <TableHead className="w-[100px]">结算方式</TableHead>
                        <TableHead className="w-[100px]">状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                暂无供应商数据
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <TableRow key={item.id} className="glass-row-hover">
                                <TableCell className="font-mono text-xs text-blue-600">{item.supplierNo}</TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.contactPerson || '-'}</TableCell>
                                <TableCell>{item.phone || '-'}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {item.paymentPeriod === 'CASH' ? '现结' : '月结'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={item.isActive ? 'default' : 'secondary'}>
                                        {item.isActive ? '启用' : '停用'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit(item)}
                                        >
                                            <Edit className="h-4 w-4 mr-1" />
                                            编辑
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={item.isActive ? "text-destructive" : "text-green-600"}
                                            onClick={() => onToggleStatus(item.id, !item.isActive)}
                                        >
                                            {item.isActive ? (
                                                <><Ban className="h-4 w-4 mr-1" /> 停用</>
                                            ) : (
                                                <><CheckCircle className="h-4 w-4 mr-1" /> 启用</>
                                            )}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
