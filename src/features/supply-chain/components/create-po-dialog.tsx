'use client';
import { logger } from '@/shared/lib/logger';

import { useState, useEffect, useTransition } from 'react';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getProducts } from '@/features/products/actions/queries';
import type { Product } from '@/features/products/types';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    // DialogFooter, // Unused
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
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
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/shared/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/shared/ui/popover';
import { Check, ChevronsUpDown, Loader2, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useRouter } from 'next/navigation';

import { createPOSchema } from '@/features/supply-chain/schemas';
import { createPurchaseOrder } from '@/features/supply-chain/actions/po-actions';

// Removed duplicate type CreatePOFormData definition if it existed or ensuring usage of imported one.
// Actually lines 55-55 was: type CreatePOFormData = z.infer<typeof createPOSchema>;
// I will keep it but rely on schema being available. Assuming createPOSchema is imported.
// Wait, I need to check imports.
// The file has imports at top.
// I will just fix the SubmitHandler usage if needed, or imports.
// The previous tsc error said "Duplicate identifier". 
// I'll check imports first.



// Product type is imported from schema



interface CreatePODialogProps {
    suppliers: { id: string; name: string }[];
}

export function CreatePODialog({ suppliers }: CreatePODialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<z.input<typeof createPOSchema>>({
        resolver: zodResolver(createPOSchema),
        defaultValues: {
            supplierId: '',
            type: 'FINISHED' as const,
            items: [{ productId: '', quantity: 1, unitCost: 0 }],
        },
    });

    const { register, control, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = form;
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items',
    });

    const onSubmit: SubmitHandler<z.input<typeof createPOSchema>> = (data) => {
        startTransition(async () => {
            try {
                const parsedData = createPOSchema.parse(data);
                const result = await createPurchaseOrder(parsedData);
                if (!result.success) {
                    toast.error('创建失败', { description: result.error || '验证失败' });
                    return;
                }
                toast.success('采购单创建成功');
                setOpen(false);
                form.reset();
                router.refresh();
            } catch (error) {
                const message = error instanceof Error ? error.message : '未知系统错误';
                toast.error('创建失败', { description: message });
            }
        });
    };

    const totalAmount = watch('items').reduce((sum, item) => {
        return sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
    }, 0);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    新建采购单
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>新建采购单</DialogTitle>
                    <DialogDescription>
                        手动创建采购单。选择供应商并添加采购商品。
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>供应商</Label>
                            <Select
                                onValueChange={(val) => setValue('supplierId', val)}
                                value={watch('supplierId')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="选择供应商" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.supplierId && <p className="text-sm text-red-500">{errors.supplierId.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>关联订单 ID (可选)</Label>
                            <Input {...register('orderId')} placeholder="例如：ORD-2024001" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>采购明细</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ productId: '', quantity: 1, unitCost: 0 })}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                添加商品
                            </Button>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[300px]">产品</TableHead>
                                        <TableHead className="w-[100px]">数量</TableHead>
                                        <TableHead className="w-[120px]">单价</TableHead>
                                        <TableHead className="w-[120px]">小计</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, index) => (
                                        <TableRow key={field.id}>
                                            <TableCell className="p-2">
                                                <ProductSelect
                                                    value={watch(`items.${index}.productId`)}
                                                    onSelect={(product) => {
                                                        setValue(`items.${index}.productId`, product.id);
                                                        // 自动填充采购价
                                                        setValue(`items.${index}.unitCost`, Number(product.purchasePrice) || 0);
                                                    }}
                                                />
                                                {errors.items?.[index]?.productId && (
                                                    <p className="text-xs text-red-500 mt-1">{errors.items[index]?.productId?.message}</p>
                                                )}
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    {...register(`items.${index}.quantity`)}
                                                />
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    {...register(`items.${index}.unitCost`)}
                                                />
                                            </TableCell>
                                            <TableCell className="p-2 text-right font-medium">
                                                ¥{(Number(watch(`items.${index}.quantity`) || 0) * Number(watch(`items.${index}.unitCost`) || 0)).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => remove(index)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {errors.items && <p className="text-sm text-red-500">{errors.items.message}</p>}
                    </div>

                    <div className="flex items-center justify-end space-x-4 border-t pt-4">
                        <div className="text-lg font-semibold">
                            总计: <span className="text-primary">¥{totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex space-x-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
                            <Button type="submit" disabled={isPending || isSubmitting}>
                                {(isPending || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                创建采购单
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// --- Product Select Component ---

function ProductSelect({ value, onSelect }: { value: string, onSelect: (product: Product) => void }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    // Simple debounce effect could be added, here relying on useEffect dependency
    useEffect(() => {
        if (!open) return;

        const fetchProducts = async () => {
            setLoading(true);
            try {
                const res = await getProducts({ page: 1, pageSize: 20, search: search, isActive: true });
                if (res?.data) {
                    setProducts(res.data as unknown as Product[]);
                }
            } catch (err) {
                logger.error(err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchProducts, 300);
        return () => clearTimeout(timer);
    }, [open, search]);

    const selectedProduct = products.find(p => p.id === value) || (value ? { name: '已选择产品', id: value, sku: 'unknown', purchasePrice: "0", productType: 'FINISHED', defaultSupplierId: null } as Product : null);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    {selectedProduct ?
                        (selectedProduct.name !== '已选择产品' ? `${selectedProduct.name} (${selectedProduct.sku})` : '已选择 (加载中...)')
                        : "搜索产品..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="搜索产品名称或 SKU..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        {loading && <div className="py-6 text-center text-sm"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />加载中...</div>}
                        {!loading && products.length === 0 && <CommandEmpty>无匹配产品</CommandEmpty>}
                        <CommandGroup>
                            {products.map((product) => (
                                <CommandItem
                                    key={product.id}
                                    value={product.id}
                                    onSelect={() => {
                                        onSelect(product);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === product.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{product.name}</span>
                                        <span className="text-xs text-muted-foreground">{product.sku}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
