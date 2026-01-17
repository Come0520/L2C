
import { ProductSupplierManager } from './product-supplier-manager';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProductSchema, updateProductSchema } from '../schema';
import { z } from 'zod';
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
import { Switch } from '@/shared/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Card, CardContent } from '@/shared/ui/card';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Save from 'lucide-react/dist/esm/icons/save';
import { toast } from 'sonner';
import { getSuppliers } from '@/features/supply-chain/actions/supplier-actions';


type ProductFormValues = z.infer<typeof createProductSchema> & { id?: string };

interface ProductFormProps {
    initialData?: Partial<ProductFormValues> & { specs?: Record<string, any> };
    onSubmit: (values: ProductFormValues) => Promise<void>;
    isLoading?: boolean;
}

export function ProductForm({ initialData, onSubmit, isLoading }: ProductFormProps) {
    const [suppliersList, setSuppliersList] = useState<{ id: string; name: string }[]>([]);
    const [fetchingSuppliers, setFetchingSuppliers] = useState(false);

    const form = useForm({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(initialData?.id ? updateProductSchema : createProductSchema) as any,
        defaultValues: initialData ? {
            ...initialData,
            attributes: initialData.specs || {},
            purchasePrice: Number(initialData.purchasePrice),
            logisticsCost: Number(initialData.logisticsCost),
            processingCost: Number(initialData.processingCost),
            lossRate: Number(initialData.lossRate),
            retailPrice: Number(initialData.retailPrice),
            channelPrice: Number(initialData.channelPrice),
            channelDiscountRate: Number(initialData.channelDiscountRate),
            floorPrice: Number(initialData.floorPrice),
        } : {
            sku: '',
            name: '',
            category: 'CURTAIN_FABRIC',
            unit: '米',
            purchasePrice: 0,
            logisticsCost: 0,
            processingCost: 0,
            lossRate: 0.05,
            retailPrice: 0,
            channelPriceMode: 'FIXED',
            channelPrice: 0,
            channelDiscountRate: 1,
            floorPrice: 0,
            isToBEnabled: true,
            isToCEnabled: true,
            isStockable: false,
            attributes: {},
        },
    });

    const category = form.watch('category');

    useEffect(() => {
        const fetchSuppliers = async () => {
            setFetchingSuppliers(true);
            try {
                const result = await getSuppliers({ page: 1, pageSize: 100 });
                if (result.error) {
                    toast.error(result.error);
                    return;
                }
                if (result.data) {
                    setSuppliersList(result.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch suppliers', error);
            } finally {
                setFetchingSuppliers(false);
            }
        };
        fetchSuppliers();
    }, []);

    const [attributeSchema, setAttributeSchema] = useState<{
        key: string;
        label: string;
        type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'SELECT';
        required: boolean;
        options?: string[];
        unit?: string;
        placeholder?: string;
    }[]>([]);

    useEffect(() => {
        const fetchTemplate = async () => {
            if (!category) return;
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const result = await import('../actions').then(mod => mod.getAttributeTemplate({ category: category as any }));
                if (result.data?.templateSchema && Array.isArray(result.data.templateSchema)) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setAttributeSchema(result.data.templateSchema as any[]);
                } else {
                    setAttributeSchema([]);
                }
            } catch (error) {
                console.error('Failed to fetch attribute template', error);
            }
        };
        fetchTemplate();
    }, [category]);

    // 辅助函数：根据品类渲染动态属性
    const renderAttributeFields = () => {
        if (attributeSchema.length === 0) {
            return <div className="text-sm text-muted-foreground p-4 text-center border dashed rounded-md">
                该品类暂未配置属性模板，请联系管理员配置。
            </div>;
        }

        return (
            <div className="grid grid-cols-2 gap-4">
                {attributeSchema.map((field: any) => (
                    <FormField
                        key={field.key}
                        control={form.control}
                        name={`attributes.${field.key}`}
                        render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel>
                                    {field.label}
                                    {field.unit && <span className="text-xs text-muted-foreground ml-1">({field.unit})</span>}
                                </FormLabel>
                                <FormControl>
                                    {field.type === 'SELECT' ? (
                                        <Select onValueChange={formField.onChange} defaultValue={formField.value} >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={field.placeholder || "请选择"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {field.options?.map((opt: string) => (
                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : field.type === 'BOOLEAN' ? (
                                        <div className="flex items-center space-x-2 h-10">
                                            <Switch
                                                checked={formField.value === true || formField.value === 'true'}
                                                onCheckedChange={formField.onChange}
                                            />
                                            <span className="text-sm text-muted-foreground">{formField.value ? '是' : '否'}</span>
                                        </div>
                                    ) : (
                                        <Input
                                            type={field.type === 'NUMBER' ? 'number' : 'text'}
                                            placeholder={field.placeholder}
                                            {...formField}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                formField.onChange(field.type === 'NUMBER' ? (val === '' ? '' : Number(val)) : val);
                                            }}
                                        />
                                    )}
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ))}
            </div>
        );
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="basic">基础信息</TabsTrigger>
                        <TabsTrigger value="pricing">价格体系</TabsTrigger>
                        <TabsTrigger value="attributes">规格属性</TabsTrigger>
                        <TabsTrigger value="supply">库存供应</TabsTrigger>
                    </TabsList>

                    {/* 基础信息 */}
                    <TabsContent value="basic" className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>产品名称</FormLabel>
                                        <FormControl><Input placeholder="输入产品名称" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="sku"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SKU / 型号</FormLabel>
                                        <FormControl><Input placeholder="输入型号" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>产品品类</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="选择品类" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="CURTAIN">窗帘成品</SelectItem>
                                                <SelectItem value="CURTAIN_FABRIC">窗帘面料</SelectItem>
                                                <SelectItem value="WALLCLOTH">墙布</SelectItem>
                                                <SelectItem value="WALLPAPER">墙纸</SelectItem>
                                                <SelectItem value="CURTAIN_ACCESSORY">窗帘配件</SelectItem>
                                                <SelectItem value="MATTRESS">床垫</SelectItem>
                                                <SelectItem value="OTHER">其他</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="unit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>计价单位</FormLabel>
                                        <FormControl><Input placeholder="如：米、卷、件" {...field} /></FormControl>
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
                                    <FormLabel>产品描述</FormLabel>
                                    <FormControl><Textarea placeholder="输入产品描述" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </TabsContent>

                    {/* 价格体系 */}
                    <TabsContent value="pricing" className="space-y-6 pt-4">
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium border-l-4 border-primary pl-2">成本维度</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="purchasePrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>采购基准价</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lossRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>损耗率 (0-1)</FormLabel>
                                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="logisticsCost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>预估物流费</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="processingCost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>预估加工费</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* 利润分析实时预览 */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">实时利润分析 (预估)</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <div className="text-xs text-slate-400">综合成本</div>
                                    <div className="text-lg font-mono font-bold">¥{
                                        ((form.watch('purchasePrice') || 0) * (1 + (form.watch('lossRate') || 0)) +
                                            Number(form.watch('logisticsCost') || 0) +
                                            Number(form.watch('processingCost') || 0)).toFixed(2)
                                    }</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400">毛利金额</div>
                                    <div className="text-lg font-mono font-bold text-green-600">¥{
                                        ((form.watch('retailPrice') || 0) -
                                            ((form.watch('purchasePrice') || 0) * (1 + (form.watch('lossRate') || 0)) +
                                                Number(form.watch('logisticsCost') || 0) +
                                                Number(form.watch('processingCost') || 0))).toFixed(2)
                                    }</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400">毛利率</div>
                                    <div className="text-lg font-mono font-bold text-blue-600">{
                                        (form.watch('retailPrice') > 0 ?
                                            (((form.watch('retailPrice') || 0) -
                                                ((form.watch('purchasePrice') || 0) * (1 + (form.watch('lossRate') || 0)) +
                                                    Number(form.watch('logisticsCost') || 0) +
                                                    Number(form.watch('processingCost') || 0))) / (form.watch('retailPrice') || 1) * 100).toFixed(1) : 0)
                                    }%</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-medium border-l-4 border-blue-500 pl-2">销售维度</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="retailPrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>建议零售价</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="floorPrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>销售底价</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="channelPriceMode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>渠道定价模式</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="FIXED">固定渠道价</SelectItem>
                                                    <SelectItem value="DISCOUNT">零售价折扣</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {form.watch('channelPriceMode') === 'FIXED' ? (
                                    <FormField
                                        control={form.control}
                                        name="channelPrice"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>渠道固定价</FormLabel>
                                                <FormControl><Input type="number" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ) : (
                                    <FormField
                                        control={form.control}
                                        name="channelDiscountRate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>渠道折扣率 (0-1)</FormLabel>
                                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* 规格属性 */}
                    <TabsContent value="attributes" className="pt-4">
                        <Card>
                            <CardContent className="pt-6">
                                {renderAttributeFields()}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 库存供应 */}
                    <TabsContent value="supply" className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="defaultSupplierId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>默认供应商</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={fetchingSuppliers ? "加载中..." : "选择供应商"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {suppliersList.map((s) => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>用于自动生成采购单时的默认指向</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4 border rounded-md p-4">
                            <FormField
                                control={form.control}
                                name="isStockable"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>启用库存管理</FormLabel>
                                            <FormDescription>是否跟踪该产品的实时库存</FormDescription>
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
                            <div className="flex gap-4">
                                <FormField
                                    control={form.control}
                                    name="isToBEnabled"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            <FormLabel>ToB 可见</FormLabel>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="isToCEnabled"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            <FormLabel>ToC 可见</FormLabel>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {initialData?.id ? (
                                <div className="pt-4 border-t">
                                    <ProductSupplierManager productId={initialData.id} />
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground bg-secondary/30 p-4 rounded text-center border border-dashed">
                                    保存产品后即可管理多供应商价格与货期
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2">
                    <Button type="submit" disabled={isLoading} size="lg">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {initialData?.id ? '保存修改' : '立即创建'}
                    </Button>
                </div>
            </form>
        </Form >
    );
}
