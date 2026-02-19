'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { confirmPoReceipt, confirmReceiptSchema } from '../actions/po-actions';
import { getWarehouses } from '../actions/inventory-actions';
import { Button } from '@/shared/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { toast } from 'sonner';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

type ConfirmReceiptFormData = z.infer<typeof confirmReceiptSchema>;

interface Warehouse {
    id: string;
    name: string;
}

interface ConfirmReceiptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    po: {
        id: string;
        items: {
            productId: string;
            productName: string;
            quantity: string | number;
        }[];
    };
}

export function ConfirmReceiptDialog({
    open,
    onOpenChange,
    po
}: ConfirmReceiptDialogProps) {
    const router = useRouter();
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loadingWarehouses, setLoadingWarehouses] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
        reset
    } = useForm<ConfirmReceiptFormData>({
        resolver: zodResolver(confirmReceiptSchema),
        defaultValues: {
            poId: po.id,
            receivedDate: format(new Date(), 'yyyy-MM-dd HH:mm'),
            remark: '',
            items: po.items.map(item => ({
                productId: item.productId,
                quantity: Number(item.quantity)
            }))
        }
    });

    const { fields } = useFieldArray({
        control,
        name: "items"
    });

    useEffect(() => {
        if (open) {
            setLoadingWarehouses(true);
            getWarehouses()
                .then(res => {
                    if (res.success && res.data) {
                        setWarehouses(res.data);
                        // Default to first warehouse if available
                        if (res.data.length > 0) {
                            setValue('warehouseId', res.data[0].id);
                        }
                    }
                })
                .finally(() => setLoadingWarehouses(false));

            reset({
                poId: po.id,
                receivedDate: format(new Date(), 'yyyy-MM-dd HH:mm'),
                remark: '',
                items: po.items.map(item => ({
                    productId: item.productId,
                    quantity: Number(item.quantity)
                }))
            });
        }
    }, [open, po, reset, setValue]);

    const onSubmit = async (data: ConfirmReceiptFormData) => {
        try {
            const result = await confirmPoReceipt({
                ...data,
                // Ensure quantity is number
                items: data.items.map(item => ({
                    ...item,
                    quantity: Number(item.quantity)
                }))
            });

            if (!result.success) {
                toast.error(result.error || '确认收货失败');
                return;
            }

            toast.success('收货已确认，库存已更新');
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            toast.error('请求失败');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>确认收货入库</DialogTitle>
                    <DialogDescription>
                        请确认入库仓库和实收数量。
                        <br />
                        确认后状态将更为 <strong>已完成</strong>，并增加相应库存。
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="warehouseId">入库仓库</Label>
                            <Select
                                onValueChange={(val) => setValue('warehouseId', val)}
                                disabled={loadingWarehouses}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={loadingWarehouses ? "加载中..." : "选择仓库"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {warehouses.map(warehouse => (
                                        <SelectItem key={warehouse.id} value={warehouse.id}>
                                            {warehouse.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.warehouseId && (
                                <p className="text-sm text-red-500">{errors.warehouseId.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="receivedDate">收货时间</Label>
                            <Input
                                id="receivedDate"
                                type="datetime-local"
                                {...register('receivedDate')}
                            />
                            {errors.receivedDate && (
                                <p className="text-sm text-red-500">{errors.receivedDate.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>商品</TableHead>
                                    <TableHead className="w-[100px]">采购数量</TableHead>
                                    <TableHead className="w-[120px]">实收数量</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fields.map((field, index) => {
                                    const orderedItem = po.items.find(i => i.productId === field.productId);
                                    return (
                                        <TableRow key={field.id}>
                                            <TableCell className="font-medium">
                                                {orderedItem?.productName || '未知商品'}
                                            </TableCell>
                                            <TableCell>
                                                {Number(orderedItem?.quantity || 0)}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    className="h-8"
                                                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        {errors.items && (
                            <p className="text-sm text-red-500 px-4 py-2">请检查入库数量</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="remark">备注</Label>
                        <Textarea
                            id="remark"
                            rows={2}
                            placeholder="填写收货备注..."
                            {...register('remark')}
                        />
                        {errors.remark && (
                            <p className="text-sm text-red-500">{errors.remark.message}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            取消
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            确认入库
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
