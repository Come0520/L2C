'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { upsertAttributeTemplate, getAttributeTemplate } from '../actions/templates';
import { productCategoryEnum } from '@/shared/api/schema/enums';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
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
import { Switch } from '@/shared/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Save from 'lucide-react/dist/esm/icons/save';
import { toast } from 'sonner';

// Schema for a single field definition
// [Product-01] 扩展属性类型支持
const attributeFieldSchema = z.object({
    key: z.string().min(1, 'Key is required').regex(/^[a-zA-Z0-9_]+$/, 'Key must be alphanumeric'),
    label: z.string().min(1, 'Label is required'),
    type: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'SELECT', 'DATE', 'TEXTAREA', 'COLOR', 'IMAGE', 'RANGE']),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(), // For SELECT type
    unit: z.string().optional(), // For NUMBER/RANGE types
    placeholder: z.string().optional(),
    // [Product-01] 新增数值类型配置
    min: z.number().optional(), // For NUMBER/RANGE
    max: z.number().optional(), // For NUMBER/RANGE
    step: z.number().optional(), // For NUMBER/RANGE
    // [Product-01] 新增文本类型配置
    maxLength: z.number().optional(), // For STRING/TEXTAREA
    rows: z.number().optional(), // For TEXTAREA
    // [Product-01] 新增说明文本
    description: z.string().optional(), // Help text
    defaultValue: z.any().optional(), // Default value
});

// Overall schema for the form
const templateFormSchema = z.object({
    category: z.enum(productCategoryEnum.enumValues),
    templateSchema: z.array(attributeFieldSchema),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

export function AttributeTemplateManager() {
    const [selectedCategory, setSelectedCategory] = useState<string>('CURTAIN_FABRIC');
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<TemplateFormValues>({
        // 注意: zod 4 与 @hookform/resolvers 存在类型不兼容问题，运行时正常
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(templateFormSchema) as any,
        defaultValues: {
            category: 'CURTAIN_FABRIC' as const,
            templateSchema: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'templateSchema',
    });

    // Load template when category changes
    useEffect(() => {
        const loadTemplate = async () => {
            setIsLoading(true);
            try {
                const result = await getAttributeTemplate({ category: selectedCategory as any });
                if (result.error) {
                    toast.error(result.error);
                } else if (result.data) {
                    // Force reset with new data
                    form.reset({
                        category: selectedCategory as any,
                        // Ensure templateSchema is an array. If DB has null/empty, default to []
                        templateSchema: Array.isArray(result.data.templateSchema) ? result.data.templateSchema : [],
                    });
                }
            } catch (error) {
                console.error(error);
                toast.error('Failed to load template');
            } finally {
                setIsLoading(false);
            }
        };
        loadTemplate();
    }, [selectedCategory, form]);

    const onSubmit = async (values: TemplateFormValues) => {
        setIsLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await upsertAttributeTemplate(values as any);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Template saved successfully');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to save template');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>品类属性模板配置</CardTitle>
                <div className="w-[200px]">
                    <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                        disabled={isLoading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="选择品类" />
                        </SelectTrigger>
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
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-4 p-4 border rounded-md bg-muted/10 items-start">
                                    <div className="grid grid-cols-4 gap-4 flex-1">
                                        <FormField
                                            control={form.control}
                                            name={`templateSchema.${index}.key`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">字段 Key (英文)</FormLabel>
                                                    <FormControl><Input {...field} placeholder="e.g. width" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`templateSchema.${index}.label`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">显示名称 (中文)</FormLabel>
                                                    <FormControl><Input {...field} placeholder="e.g. 幅宽" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`templateSchema.${index}.type`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">类型</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="STRING">文本</SelectItem>
                                                            <SelectItem value="TEXTAREA">多行文本</SelectItem>
                                                            <SelectItem value="NUMBER">数值</SelectItem>
                                                            <SelectItem value="RANGE">范围数值</SelectItem>
                                                            <SelectItem value="BOOLEAN">布尔 (开关)</SelectItem>
                                                            <SelectItem value="SELECT">下拉选项</SelectItem>
                                                            <SelectItem value="DATE">日期</SelectItem>
                                                            <SelectItem value="COLOR">颜色选择</SelectItem>
                                                            <SelectItem value="IMAGE">图片上传</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`templateSchema.${index}.unit`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">单位 (可选)</FormLabel>
                                                    <FormControl><Input {...field} placeholder="e.g. cm" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        {form.watch(`templateSchema.${index}.type`) === 'SELECT' && (
                                            <div className="col-span-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`templateSchema.${index}.options`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs">选项 (逗号分隔)</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Option A, Option B"
                                                                    value={field.value?.join(', ') || ''}
                                                                    onChange={e => field.onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}
                                        {/* [Product-01] NUMBER/RANGE 类型的扩展配置 */}
                                        {['NUMBER', 'RANGE'].includes(form.watch(`templateSchema.${index}.type`)) && (
                                            <div className="col-span-4 grid grid-cols-3 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`templateSchema.${index}.min`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs">最小值</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    value={field.value ?? ''}
                                                                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`templateSchema.${index}.max`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs">最大值</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="100"
                                                                    value={field.value ?? ''}
                                                                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`templateSchema.${index}.step`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs">步长</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="1"
                                                                    value={field.value ?? ''}
                                                                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}
                                        {/* [Product-01] TEXTAREA 类型的扩展配置 */}
                                        {form.watch(`templateSchema.${index}.type`) === 'TEXTAREA' && (
                                            <div className="col-span-4 grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`templateSchema.${index}.rows`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs">行数</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="3"
                                                                    value={field.value ?? ''}
                                                                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`templateSchema.${index}.maxLength`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs">最大字数</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="500"
                                                                    value={field.value ?? ''}
                                                                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}
                                        {/* [Product-01] 描述字段 */}
                                        <div className="col-span-4">
                                            <FormField
                                                control={form.control}
                                                name={`templateSchema.${index}.description`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">帮助说明 (可选)</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                placeholder="给用户的填写提示..."
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="col-span-4 flex items-center gap-4">
                                            <FormField
                                                control={form.control}
                                                name={`templateSchema.${index}.required`}
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                        <FormLabel className="text-xs font-normal">必填</FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 mt-8"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-dashed"
                            onClick={() => append({ key: '', label: '', type: 'STRING', required: false })}
                        >
                            <Plus className="mr-2 h-4 w-4" /> 添加属性字段
                        </Button>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                保存配置
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
