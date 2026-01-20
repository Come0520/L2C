'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    getProductSuppliers,
    addProductSupplier,
    updateProductSupplier,
    removeProductSupplier
} from '../actions';
import { getSuppliers } from '@/features/supply-chain/actions/supplier-actions';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Switch } from '@/shared/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/shared/ui/form';
import { Loader2, Plus, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

// Schema for adding a supplier
const addSupplierSchema = z.object({
    supplierId: z.string().uuid('请选择供应商'),
    purchasePrice: z.coerce.number().min(0, '价格不能为负'),
    leadTimeDays: z.coerce.number().int().min(0, '天数不能为负'),
    isDefault: z.boolean().default(false),
});

type AddSupplierFormValues = z.infer<typeof addSupplierSchema>;

interface ProductSupplierManagerProps {
    productId: string;
}

export function ProductSupplierManager({ productId }: ProductSupplierManagerProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [allSuppliers, setAllSuppliers] = useState<{ id: string; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Fetch product suppliers

    const fetchProductSuppliers = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await getProductSuppliers({ productId });
            if (result.error) {
                toast.error(result.error);
            } else if (result.data) {
                setSuppliers(result.data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load product suppliers');
        } finally {
            setIsLoading(false);
        }
    }, [productId]);

    // Fetch all available suppliers for the dropdown
    useEffect(() => {
        const loadAllSuppliers = async () => {
            const result = await getSuppliers({ page: 1, pageSize: 100 });
            if (result.data) {
                setAllSuppliers(result.data.data);
            }
        };
        loadAllSuppliers();
        if (productId) {
            fetchProductSuppliers();
        }
    }, [productId, fetchProductSuppliers]);

    const form = useForm({
        resolver: zodResolver(addSupplierSchema),
        defaultValues: {
            purchasePrice: 0,
            leadTimeDays: 7,
            isDefault: false,
        },
    });

    const onSubmit = async (values: AddSupplierFormValues) => {
        const result = await addProductSupplier({ ...values, productId });
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success('已添加供应商');
            setIsDialogOpen(false);
            form.reset();
            fetchProductSuppliers();
        }
    };

    const handleRemove = async (id: string) => {
        if (!confirm('确定要移除该供应商关联吗？')) return;
        const result = await removeProductSupplier({ id, productId });
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success('已移除');
            fetchProductSuppliers();
        }
    };

    const handleSetDefault = async (id: string) => {
        const result = await updateProductSupplier({ id, isDefault: true });
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success('已设为默认');
            fetchProductSuppliers();
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">供应商列表</h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            添加供应商
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>关联供应商</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="supplierId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>选择供应商</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="选择供应商" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {allSuppliers.map(s => (
                                                        <SelectItem key={s.id} value={s.id} disabled={suppliers.some(ps => ps.supplierId === s.id)}>
                                                            {s.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="purchasePrice"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>采购价</FormLabel>
                                                <FormControl>
                                                    {/* @ts-expect-error */}
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="leadTimeDays"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>货期 (天)</FormLabel>
                                                <FormControl>
                                                    {/* @ts-expect-error */}
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="isDefault"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                            <div className="space-y-0.5">
                                                <FormLabel>设为默认供应商</FormLabel>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full">保存</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>供应商名称</TableHead>
                            <TableHead>采购价</TableHead>
                            <TableHead>货期 (天)</TableHead>
                            <TableHead>默认</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-4">加载中...</TableCell>
                            </TableRow>
                        ) : suppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">该产品暂无关联供应商</TableCell>
                            </TableRow>
                        ) : (
                            suppliers.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.supplierName}</TableCell>
                                    <TableCell>¥{Number(item.purchasePrice).toFixed(2)}</TableCell>
                                    <TableCell>{item.leadTimeDays}</TableCell>
                                    <TableCell>
                                        {item.isDefault ? (
                                            <span className="text-green-600 flex items-center gap-1 text-xs font-medium">
                                                <Check className="w-3 h-3" /> 默认
                                            </span>
                                        ) : (
                                            <Button variant="ghost" size="sm" onClick={() => handleSetDefault(item.id)} className="h-6 text-xs text-muted-foreground hover:text-primary">
                                                设为默认
                                            </Button>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500"
                                            onClick={() => handleRemove(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
