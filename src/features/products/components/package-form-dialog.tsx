'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    createPackage,
    updatePackage,
    getPackageProducts,
    addPackageProduct,
    removePackageProduct
} from '../actions/package-actions';
import { getProducts } from '../actions/queries';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/shared/ui/table';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { toast } from 'sonner';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Search from 'lucide-react/dist/esm/icons/search';

interface PackageProductItem {
    id: string;
    packageId: string;
    productId: string;
    isRequired: boolean | null;
    minQuantity: number | string | null;
    maxQuantity: number | string | null;
    product?: {
        name: string;
        sku: string;
    };
}

interface ProductSearchResult {
    id: string;
    name: string;
    sku: string;
}

const packageFormSchema = z.object({

    packageNo: z.string().min(1, '套餐编号不能为空'),
    packageName: z.string().min(1, '套餐名称不能为空'),
    packageType: z.enum(['QUANTITY', 'COMBO', 'CATEGORY', 'TIME_LIMITED']),
    packagePrice: z.coerce.number().min(0, '价格不能小于0'),
    originalPrice: z.coerce.number().optional(),
    description: z.string().optional(),
    overflowMode: z.enum(['FIXED_PRICE', 'IGNORE', 'ORIGINAL', 'DISCOUNT']),
    overflowPrice: z.coerce.number().optional(),
    overflowDiscountRate: z.coerce.number().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export interface ProductPackage {
    id: string;
    packageNo: string;
    packageName: string;
    packageType: 'QUANTITY' | 'COMBO' | 'CATEGORY' | 'TIME_LIMITED';
    packagePrice: string | number;
    originalPrice?: string | number | null;
    description?: string | null;
    overflowMode: 'FIXED_PRICE' | 'IGNORE' | 'ORIGINAL' | 'DISCOUNT' | null;
    overflowPrice?: string | number | null;
    overflowDiscountRate?: string | number | null;
    isActive?: boolean;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
}

interface PackageData {
    id?: string;
    packageNo: string;
    packageName: string;
    packageType: 'QUANTITY' | 'COMBO' | 'CATEGORY' | 'TIME_LIMITED';
    packagePrice: number;
    originalPrice?: number;
    description?: string;
    overflowMode: 'FIXED_PRICE' | 'IGNORE' | 'ORIGINAL' | 'DISCOUNT' | null;
    overflowPrice?: number;
    overflowDiscountRate?: number;
    startDate?: string | Date;
    endDate?: string | Date;
    [key: string]: any;
}

interface PackageFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingData?: PackageData;
    onSuccess: () => void;
}

export function PackageFormDialog({
    open,
    onOpenChange,
    editingData,
    onSuccess
}: PackageFormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');
    const [packageProductsList, setPackageProductsList] = useState<PackageProductItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);


    const form = useForm<z.infer<typeof packageFormSchema>>({
        resolver: zodResolver(packageFormSchema) as any,
        defaultValues: {
            packageNo: '',
            packageName: '',
            packageType: 'COMBO',
            packagePrice: 0,
            originalPrice: 0,
            description: '',
            overflowMode: 'DISCOUNT',
            overflowPrice: 0,
            overflowDiscountRate: 1,
            startDate: '',
            endDate: '',
        },
    });

    useEffect(() => {
        if (open) {
            if (editingData) {
                form.reset({
                    ...editingData,
                    overflowMode: editingData.overflowMode ?? undefined,
                    packagePrice: Number(editingData.packagePrice),
                    originalPrice: Number(editingData.originalPrice || 0),
                    overflowPrice: Number(editingData.overflowPrice || 0),
                    overflowDiscountRate: Number(editingData.overflowDiscountRate || 1),
                    startDate: editingData.startDate ? new Date(editingData.startDate).toISOString().split('T')[0] : '',
                    endDate: editingData.endDate ? new Date(editingData.endDate).toISOString().split('T')[0] : '',
                    description: editingData.description ?? '',
                });
                loadPackageProducts(editingData.id as string);
            } else {
                form.reset({
                    packageNo: `PKG${Date.now().toString().slice(-6)}`,
                    packageName: '',
                    packageType: 'COMBO',
                    packagePrice: 0,
                    originalPrice: 0,
                    description: '',
                    overflowMode: 'DISCOUNT',
                    overflowPrice: 0,
                    overflowDiscountRate: 1,
                    startDate: '',
                    endDate: '',
                });
                setPackageProductsList([]);
                setActiveTab('basic');
            }
        }
    }, [open, editingData, form]);

    const loadPackageProducts = async (packageId: string) => {
        try {
            const result = await getPackageProducts(packageId);
            if (result.success && result.data) {
                setPackageProductsList(result.data as any);
            }
        } catch (error) {
            console.error('Failed to load package products', error);
        }
    };

    const onSubmit = async (values: z.infer<typeof packageFormSchema>) => {
        setIsLoading(true);
        try {
            let result;
            if (editingData?.id) {
                result = await updatePackage(editingData.id, values);
            } else {
                result = await createPackage(values);
            }

            if (result.success) {
                toast.success(editingData?.id ? '更新成功' : '创建成功');
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error(result.error || '保存失败');
            }
        } catch (error) {
            console.error(error);
            toast.error('保存失败');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchProducts = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const result = await getProducts({
                search: searchQuery,
                page: 1,
                pageSize: 10,
                isActive: true
            });
            if (result.data) {
                setSearchResults(result.data.data || []);
            } else if (result.error) {
                toast.error(result.error);
            }
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setIsSearching(false);
        }
    };

    const addProductToPackage = async (product: { id: string, name: string, sku: string }) => {
        if (!editingData?.id) {
            toast.warning('请先保存套餐基础信息后再添加商品');
            setActiveTab('basic');
            return;
        }

        try {
            const result = await addPackageProduct(editingData.id, {
                productId: product.id,
                isRequired: true,
                minQuantity: 1,
                maxQuantity: 1
            });
            if (result.success) {
                toast.success('添加成功');
                loadPackageProducts(editingData.id);
            } else {
                toast.error(result.error || '添加失败');
            }
        } catch (error) {
            console.error(error);
            toast.error('添加失败');
        }
    };

    const removeProductFromPackage = async (productId: string) => {
        if (!editingData?.id) return;
        try {
            const result = await removePackageProduct(editingData.id, productId);
            if (result.success) {
                toast.success('移除成功');
                loadPackageProducts(editingData.id);
            } else {
                toast.error(result.error || '移除失败');
            }
        } catch (error) {
            console.error(error);
            toast.error('移除失败');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>{editingData ? '编辑套餐' : '新建套餐'}</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 border-b">
                        <TabsList className="w-full justify-start bg-transparent border-b-0 space-x-6 h-12">
                            <TabsTrigger value="basic" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3">基础信息</TabsTrigger>
                            <TabsTrigger value="products" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3">包含商品</TabsTrigger>
                            <TabsTrigger value="overflow" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3">超出规则</TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-6">
                            <Form {...form}>
                                <form id="package-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <TabsContent value="basic" className="m-0 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="packageNo"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>套餐编号</FormLabel>
                                                        <FormControl><Input {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="packageName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>套餐名称</FormLabel>
                                                        <FormControl><Input {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="packageType"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>套餐类型</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="QUANTITY">数量套餐 (如：10平米套餐)</SelectItem>
                                                                <SelectItem value="COMBO">组合套餐 (如：三室两厅全屋包)</SelectItem>
                                                                <SelectItem value="CATEGORY">品类套餐 (如：墙布全房任选)</SelectItem>
                                                                <SelectItem value="TIME_LIMITED">限时套餐</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="packagePrice"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>套餐总价 (¥)</FormLabel>
                                                        <FormControl><Input type="number" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="originalPrice"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>市场原价 (显示参考)</FormLabel>
                                                        <FormControl><Input type="number" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="startDate"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>开始日期</FormLabel>
                                                        <FormControl><Input type="date" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="endDate"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>结束日期</FormLabel>
                                                        <FormControl><Input type="date" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>套餐描述</FormLabel>
                                                    <FormControl><Textarea {...field} rows={3} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TabsContent>

                                    <TabsContent value="products" className="m-0 space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="搜索商品并添加到套餐..."
                                                        className="pl-8"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchProducts())}
                                                    />
                                                </div>
                                                <Button type="button" onClick={handleSearchProducts} disabled={isSearching}>
                                                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : '搜索'}
                                                </Button>
                                            </div>

                                            {searchResults.length > 0 && (
                                                <div className="border rounded-md bg-muted/10 p-2 max-h-48 overflow-auto space-y-1">
                                                    {searchResults.map(p => (
                                                        <div key={p.id} className="flex justify-between items-center bg-card/50 p-2 rounded border shadow-sm text-sm glass-row-hover">
                                                            <span>{p.name} ({p.sku})</span>
                                                            <Button size="sm" variant="ghost" type="button" onClick={() => addProductToPackage(p)}>
                                                                <Plus className="h-4 w-4 mr-1" /> 添加
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="font-medium text-sm">已包含商品</h4>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>商品</TableHead>
                                                        <TableHead>SKU</TableHead>
                                                        <TableHead>必选</TableHead>
                                                        <TableHead>最大数量</TableHead>
                                                        <TableHead className="text-right">操作</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {packageProductsList.map((item) => (
                                                        <TableRow key={item.id}>
                                                            <TableCell className="font-medium">{item.product?.name || '未知商品'}</TableCell>
                                                            <TableCell>{item.product?.sku}</TableCell>
                                                            <TableCell>{item.isRequired ? '是' : '否'}</TableCell>
                                                            <TableCell>{item.maxQuantity || '不限'}</TableCell>
                                                            <TableCell className="text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-red-500"
                                                                    type="button"
                                                                    onClick={() => removeProductFromPackage(item.productId)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {packageProductsList.length === 0 && (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                                                暂无关联商品
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="overflow" className="m-0 space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="overflowMode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>超出处理模式</FormLabel>
                                                    <FormDescription>当所选商品超过套餐规定数量时的计价逻辑</FormDescription>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="ORIGINAL">按商品零售价原价计费</SelectItem>
                                                            <SelectItem value="FIXED_PRICE">按固定单价计费 (如：59元/平米)</SelectItem>
                                                            <SelectItem value="DISCOUNT">按零售价折扣计费</SelectItem>
                                                            <SelectItem value="IGNORE">不计费 (仅限封顶套餐)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {form.watch('overflowMode') === 'FIXED_PRICE' && (
                                            <FormField
                                                control={form.control}
                                                name="overflowPrice"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>超出固定单价 (¥)</FormLabel>
                                                        <FormControl><Input type="number" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}

                                        {form.watch('overflowMode') === 'DISCOUNT' && (
                                            <FormField
                                                control={form.control}
                                                name="overflowDiscountRate"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>超出部分折扣率 (0-1)</FormLabel>
                                                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </TabsContent>
                                </form>
                            </Form>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-6 border-t bg-muted/10">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            取消
                        </Button>
                        <Button type="submit" form="package-form" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingData ? '保存修改' : '立即创建'}
                        </Button>
                    </DialogFooter>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
