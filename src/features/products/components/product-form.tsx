import { logger } from '@/shared/lib/logger';
import { ProductSupplierManager } from './product-supplier-manager';
import { PhotoUpload } from '@/shared/components/photo-upload/photo-upload';

import { useState, useEffect, useCallback } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { Switch } from '@/shared/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Badge } from '@/shared/ui/badge';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Save from 'lucide-react/dist/esm/icons/save';
import X from 'lucide-react/dist/esm/icons/x';
import { toast } from 'sonner';
import { getSuppliers } from '@/features/supply-chain/actions/supplier-actions';
import { SupplierDialog } from '@/features/supply-chain/components/supplier-dialog';
import { Plus } from 'lucide-react';

export type ProductFormValues = z.infer<typeof createProductSchema> & { id?: string };

/**
 * 品类Tab配置：定义每个品类的中文标签和默认计量单位
 */
const CATEGORY_TABS = [
  { value: 'CURTAIN', label: '窗帘成品', defaultUnit: '米' },
  { value: 'CURTAIN_FABRIC', label: '窗帘面料', defaultUnit: '米' },
  { value: 'WALLCLOTH', label: '墙布', defaultUnit: '平方米' },
  { value: 'WALLPAPER', label: '墙纸', defaultUnit: '卷' },
  { value: 'CURTAIN_ACCESSORY', label: '窗帘配件', defaultUnit: '件' },
  { value: 'MATTRESS', label: '床垫', defaultUnit: '张' },
  { value: 'OTHER', label: '其他', defaultUnit: '件' },
] as const;

/** 窗帘成品的预设纹样选项 */
const CURTAIN_PATTERN_OPTIONS = [
  '素色',
  '条纹',
  '格子',
  '花卉',
  '几何',
  '提花',
  '印花',
  '绣花',
  '卡通',
  '渐变',
];

/** 窗帘成品的常见幅宽数值 (cm) */
const FABRIC_WIDTH_VALUES = ['140', '145', '150', '200', '250', '270', '280', '300'];

/** 墙纸常见宽度 (cm) */
const WALLPAPER_WIDTH_VALUES = ['53', '60', '70', '90', '100', '106'];

/** 墙纸常见卷长 (米) */
const WALLPAPER_ROLL_LENGTH_VALUES = ['5', '7', '10', '15', '20', '25'];

/** 所有商品通用的预设风格选项 */
const STYLE_OPTIONS = [
  '现代简约',
  '新中式',
  '欧式',
  '美式',
  '北欧',
  '轻奢',
  '日式',
  '田园',
  '地中海',
  '工业风',
  '法式',
  '东南亚',
];

interface ProductFormProps {
  initialData?: Partial<ProductFormValues> & { specs?: Record<string, unknown> };
  onSubmit: (values: ProductFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function ProductForm({ initialData, onSubmit, isLoading }: ProductFormProps) {
  const [suppliersList, setSuppliersList] = useState<{ id: string; name: string }[]>([]);
  const [fetchingSuppliers, setFetchingSuppliers] = useState(false);
  const [createSupplierOpen, setCreateSupplierOpen] = useState(false);
  // 窗帘纹样标签输入
  const [patternInput, setPatternInput] = useState('');
  // 风格标签自定义输入
  const [styleInput, setStyleInput] = useState('');

  const form = useForm<ProductFormValues, unknown, ProductFormValues>({
    resolver: zodResolver(
      initialData?.id ? updateProductSchema : createProductSchema
    ) as Resolver<ProductFormValues>,
    defaultValues: initialData
      ? {
        ...initialData,
        images: initialData.images || [],
        attributes: initialData.specs || {},
        purchasePrice: Number(initialData.purchasePrice),
        logisticsCost: Number(initialData.logisticsCost),
        processingCost: Number(initialData.processingCost),
        lossRate: Number(initialData.lossRate),
        retailPrice: Number(initialData.retailPrice),
        floorPrice: Number(initialData.floorPrice),
      }
      : {
        sku: '',
        name: '',
        category: 'CURTAIN',
        productType: 'FINISHED',
        unit: '米',
        purchasePrice: 0,
        logisticsCost: 0,
        processingCost: 0,
        lossRate: 0.05,
        retailPrice: 0,
        floorPrice: 0,
        isToBEnabled: true,
        isToCEnabled: true,
        isStockable: false,
        images: [],
        attributes: {},
      },
  });

  const category = form.watch('category');
  /** 窗帘成品：不需要损耗率/加工费/采购类型 */
  const isCurtain = category === 'CURTAIN';
  /** 窗帘面料：有损耗率和加工费，但共享窗帘规格字段 */
  const isCurtainFabric = category === 'CURTAIN_FABRIC';
  /** 窗帘系列（成品+面料）共享规格字段：幅宽、纹样、材质 */
  const hasCurtainSpecs = isCurtain || isCurtainFabric;
  /** 墙布：有幅宽 + 施工费 + 损耗 + 运费，无加工费 */
  const isWallcloth = category === 'WALLCLOTH';
  /** 墙纸：宽度 + 卷长 + 铺贴费 + 损耗 + 运费 */
  const isWallpaper = category === 'WALLPAPER';
  /** 拥有幅宽字段的品类（窗帘系列 + 墙布 + 墙纸） */
  const hasWidthSpec = hasCurtainSpecs || isWallcloth || isWallpaper;
  /** 隐藏采购类型选择器的品类（Tab已隐含） */
  const hidePurchaseType = hasCurtainSpecs || isWallcloth || isWallpaper;

  // 品类Tab切换时自动设置品类值和默认单位，并重置品类相关字段
  const handleCategoryTabChange = (tabValue: string) => {
    form.setValue('category', tabValue as ProductFormValues['category']);
    const tab = CATEGORY_TABS.find((t) => t.value === tabValue);
    if (tab && !initialData?.id) {
      form.setValue('unit', tab.defaultUnit);
    }
    // 窗帘成品：自动设为成品采购，无损耗无加工
    if (tabValue === 'CURTAIN') {
      form.setValue('productType', 'FINISHED');
      form.setValue('lossRate', 0);
      form.setValue('processingCost', 0);
    }
    // 窗帘面料：自动设为原材料采购（需要二次加工）
    if (tabValue === 'CURTAIN_FABRIC') {
      form.setValue('productType', 'CUSTOM');
    }
    // 墙布：自动设为原材料采购
    if (tabValue === 'WALLCLOTH') {
      form.setValue('productType', 'CUSTOM');
    }
    // 墙纸：自动设为原材料采购
    if (tabValue === 'WALLPAPER') {
      form.setValue('productType', 'CUSTOM');
    }
  };

  // 获取供应商列表
  const fetchSuppliers = useCallback(async () => {
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
      logger.error('获取供应商列表失败', error);
    } finally {
      setFetchingSuppliers(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // 动态属性模板
  interface AttributeField {
    key: string;
    label: string;
    type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'SELECT';
    required: boolean;
    options?: string[];
    unit?: string;
    placeholder?: string;
  }

  const [attributeSchema, setAttributeSchema] = useState<AttributeField[]>([]);

  const fetchTemplate = useCallback(async () => {
    if (!category) return;
    try {
      const result = await import('../actions').then((mod) =>
        mod.getAttributeTemplate({ category })
      );
      if (result.data?.templateSchema && Array.isArray(result.data.templateSchema)) {
        setAttributeSchema(result.data.templateSchema as AttributeField[]);
      } else {
        setAttributeSchema([]);
      }
    } catch (error) {
      logger.error('获取属性模板失败', error);
    }
  }, [category]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  // 渲染品类专属属性字段
  const renderAttributeFields = () => {
    if (attributeSchema.length === 0) return null;

    return (
      <div className="grid grid-cols-2 gap-4">
        {attributeSchema.map((field) => (
          <FormField
            key={field.key}
            control={form.control}
            name={`attributes.${field.key}`}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.unit && (
                    <span className="text-muted-foreground ml-1 text-xs">({field.unit})</span>
                  )}
                </FormLabel>
                <FormControl>
                  {field.type === 'SELECT' ? (
                    <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || '请选择'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {field.options?.map((opt: string) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'BOOLEAN' ? (
                    <div className="flex h-10 items-center space-x-2">
                      <Switch
                        checked={formField.value === true || formField.value === 'true'}
                        onCheckedChange={formField.onChange}
                      />
                      <span className="text-muted-foreground text-sm">
                        {formField.value ? '是' : '否'}
                      </span>
                    </div>
                  ) : (
                    <Input
                      type={field.type === 'NUMBER' ? 'number' : 'text'}
                      placeholder={field.placeholder}
                      {...formField}
                      onChange={(e) => {
                        const val = e.target.value;
                        formField.onChange(
                          field.type === 'NUMBER' ? (val === '' ? '' : Number(val)) : val
                        );
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

  // ==================== 窗帘成品专属字段渲染 ====================
  const renderCurtainFields = () => {
    // 当前已选纹样列表
    const currentPatterns: string[] = (form.watch('attributes.patterns') as string[]) || [];

    const addPattern = (p: string) => {
      const trimmed = p.trim();
      if (!trimmed || currentPatterns.includes(trimmed)) return;
      form.setValue('attributes.patterns', [...currentPatterns, trimmed]);
    };
    const removePattern = (p: string) => {
      form.setValue(
        'attributes.patterns',
        currentPatterns.filter((x) => x !== p)
      );
    };

    return (
      <section className="space-y-4">
        <h3 className="border-l-4 border-amber-500 pl-2 text-sm font-semibold">窗帘规格</h3>
        {/* 幅宽：定高/定宽 + 数值 */}
        <div className="space-y-2">
          <FormLabel>幅宽</FormLabel>
          <div className="flex items-center gap-2">
            <FormField
              control={form.control}
              name="attributes.fabricWidthType"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || 'WIDTH'}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WIDTH">定宽</SelectItem>
                    <SelectItem value="HEIGHT">定高</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FormField
              control={form.control}
              name="attributes.fabricWidthValue"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value?.toString()}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="选择幅宽" />
                  </SelectTrigger>
                  <SelectContent>
                    {FABRIC_WIDTH_VALUES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v} cm
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <span className="text-muted-foreground text-sm">
              {form.watch('attributes.fabricWidthType') === 'HEIGHT' ? 'H' : 'W'}
              {form.watch('attributes.fabricWidthValue') || '—'}
            </span>
          </div>
          <FormDescription>如 W280 表示定宽面料，宽幅 280cm</FormDescription>
        </div>

        {/* 纹样：多标签 */}
        <div className="space-y-2">
          <FormLabel>纹样</FormLabel>
          <div className="flex min-h-[32px] flex-wrap gap-1.5">
            {currentPatterns.map((p) => (
              <Badge key={p} variant="secondary" className="gap-1 text-xs">
                {p}
                <button
                  type="button"
                  onClick={() => removePattern(p)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="mb-2 flex flex-wrap gap-1">
            {CURTAIN_PATTERN_OPTIONS.filter((o) => !currentPatterns.includes(o)).map((o) => (
              <Badge
                key={o}
                variant="outline"
                className="hover:bg-primary/10 cursor-pointer text-xs"
                onClick={() => addPattern(o)}
              >
                + {o}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="自定义纹样"
              className="h-8 text-sm"
              value={patternInput}
              onChange={(e) => setPatternInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addPattern(patternInput);
                  setPatternInput('');
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => {
                addPattern(patternInput);
                setPatternInput('');
              }}
            >
              添加
            </Button>
          </div>
        </div>

        {/* 材质 */}
        <FormField
          control={form.control}
          name="attributes.material"
          render={({ field }) => (
            <FormItem>
              <FormLabel>材质</FormLabel>
              <FormControl>
                <Input placeholder="如：涤纶、棉麻、雪尼尔" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </section>
    );
  };

  // ==================== 利润分析计算 ====================
  const purchasePrice = form.watch('purchasePrice') || 0;
  const lossRate = isCurtain ? 0 : form.watch('lossRate') || 0;
  const logisticsCost = Number(form.watch('logisticsCost') || 0);
  // 窗帘成品无加工/施工费，其他品类都纳入
  const processingCost = isCurtain ? 0 : Number(form.watch('processingCost') || 0);
  const retailPrice = form.watch('retailPrice') || 0;

  const totalCost = purchasePrice * (1 + lossRate) + logisticsCost + processingCost;
  const grossProfit = retailPrice - totalCost;
  const grossMargin = retailPrice > 0 ? (grossProfit / retailPrice) * 100 : 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ==================== 品类Tab选择 ==================== */}
        <Tabs value={category} onValueChange={handleCategoryTabChange} className="w-full">
          <TabsList className="flex h-auto flex-wrap gap-1">
            {CATEGORY_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* ==================== ① 基础信息区 ==================== */}
        <section className="space-y-4">
          <h3 className="border-primary border-l-4 pl-2 text-sm font-semibold">基础信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>产品名称</FormLabel>
                  <FormControl>
                    <Input placeholder="输入产品名称" {...field} />
                  </FormControl>
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
                  <FormControl>
                    <Input placeholder="输入型号" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>计价单位</FormLabel>
                  <FormControl>
                    <Input placeholder="如：米、卷、件" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* 窗帘系列 + 墙布 Tab 已隐含采购类型 */}
            {!hidePurchaseType && (
              <FormField
                control={form.control}
                name="productType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>采购类型</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || 'FINISHED'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择采购类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FINISHED">成品采购</SelectItem>
                        <SelectItem value="CUSTOM">原材料采购</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      决定转采购单时是直接购买成品还是发到加工厂二次加工
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>产品描述</FormLabel>
                <FormControl>
                  <Textarea placeholder="输入产品描述" rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 风格标签（所有品类通用） */}
          <div className="space-y-2">
            <FormLabel>风格</FormLabel>
            {/* 已选风格 Badge */}
            {(() => {
              const currentStyles: string[] = (form.watch('attributes.styles') as string[]) || [];
              return (
                currentStyles.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {currentStyles.map((s) => (
                      <Badge key={s} variant="secondary" className="gap-1">
                        {s}
                        <button
                          type="button"
                          className="hover:text-destructive ml-0.5"
                          onClick={() => {
                            form.setValue(
                              'attributes.styles',
                              currentStyles.filter((x) => x !== s)
                            );
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )
              );
            })()}
            {/* 预设风格快捷按钮 */}
            <div className="flex flex-wrap gap-1.5">
              {STYLE_OPTIONS.map((opt) => {
                const currentStyles: string[] = (form.watch('attributes.styles') as string[]) || [];
                const isSelected = currentStyles.includes(opt);
                return (
                  <Button
                    key={opt}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      if (isSelected) {
                        form.setValue(
                          'attributes.styles',
                          currentStyles.filter((s) => s !== opt)
                        );
                      } else {
                        form.setValue('attributes.styles', [...currentStyles, opt]);
                      }
                    }}
                  >
                    {isSelected ? opt : `+ ${opt}`}
                  </Button>
                );
              })}
            </div>
            {/* 自定义风格输入 */}
            <div className="flex gap-2">
              <Input
                placeholder="自定义风格"
                value={styleInput}
                onChange={(e) => setStyleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && styleInput.trim()) {
                    e.preventDefault();
                    const currentStyles: string[] =
                      (form.watch('attributes.styles') as string[]) || [];
                    if (!currentStyles.includes(styleInput.trim())) {
                      form.setValue('attributes.styles', [...currentStyles, styleInput.trim()]);
                    }
                    setStyleInput('');
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (styleInput.trim()) {
                    const currentStyles: string[] =
                      (form.watch('attributes.styles') as string[]) || [];
                    if (!currentStyles.includes(styleInput.trim())) {
                      form.setValue('attributes.styles', [...currentStyles, styleInput.trim()]);
                    }
                    setStyleInput('');
                  }
                }}
              >
                添加
              </Button>
            </div>
          </div>
        </section>

        {/* ==================== ② 窗帘专属规格（窗帘成品 + 窗帘面料） ==================== */}
        {hasCurtainSpecs && renderCurtainFields()}

        {/* ==================== ②-b 墙布专属规格（仅幅宽） ==================== */}
        {isWallcloth && (
          <section className="space-y-4">
            <h3 className="border-l-4 border-amber-500 pl-2 text-sm font-semibold">墙布规格</h3>
            <div className="space-y-2">
              <FormLabel>幅宽</FormLabel>
              <div className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name="attributes.fabricWidthType"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || 'WIDTH'}>
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WIDTH">定宽</SelectItem>
                        <SelectItem value="HEIGHT">定高</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FormField
                  control={form.control}
                  name="attributes.fabricWidthValue"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="选择幅宽" />
                      </SelectTrigger>
                      <SelectContent>
                        {FABRIC_WIDTH_VALUES.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v} cm
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <span className="text-muted-foreground text-sm">
                  {form.watch('attributes.fabricWidthType') === 'HEIGHT' ? 'H' : 'W'}
                  {form.watch('attributes.fabricWidthValue') || '—'}
                </span>
              </div>
              <FormDescription>如 W280 表示定宽面料，宽幅 280cm</FormDescription>
            </div>
          </section>
        )}

        {/* ==================== ②-c 墙纸专属规格（宽度 + 卷长） ==================== */}
        {isWallpaper && (
          <section className="space-y-4">
            <h3 className="border-l-4 border-amber-500 pl-2 text-sm font-semibold">墙纸规格</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* 墙纸宽度 */}
              <div className="space-y-2">
                <FormLabel>宽度 (cm)</FormLabel>
                <FormField
                  control={form.control}
                  name="attributes.wallpaperWidth"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择宽度" />
                      </SelectTrigger>
                      <SelectContent>
                        {WALLPAPER_WIDTH_VALUES.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v} cm
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FormDescription>常见：53cm（韩式）、70cm（国产）、106cm（宽幅）</FormDescription>
              </div>
              {/* 每卷长度 */}
              <div className="space-y-2">
                <FormLabel>每卷长度 (米)</FormLabel>
                <FormField
                  control={form.control}
                  name="attributes.rollLength"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择卷长" />
                      </SelectTrigger>
                      <SelectContent>
                        {WALLPAPER_ROLL_LENGTH_VALUES.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v} 米/卷
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FormDescription>常见：10米/卷、7米/卷</FormDescription>
              </div>
            </div>
          </section>
        )}

        {/* ==================== ③ 价格区 ==================== */}
        <section className="space-y-4">
          <h3 className="border-primary border-l-4 pl-2 text-sm font-semibold">价格</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <FormField
              control={form.control}
              name="purchasePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>采购基准价</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* 窗帘成品无损耗率 */}
            {!isCurtain && (
              <FormField
                control={form.control}
                name="lossRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>损耗率 (0-1)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="logisticsCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{hasWidthSpec ? '运费（选填）' : '预估物流费'}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* 窗帘成品无加工/施工费，其他品类按类型显示不同标签 */}
            {!isCurtain && (
              <FormField
                control={form.control}
                name="processingCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isWallcloth ? '施工费用' : isWallpaper ? '铺贴费' : '预估加工费'}
                    </FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="retailPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>建议零售价</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="floorPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{hasWidthSpec ? '建议零售底价' : '销售底价'}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 实时利润分析预览 */}
          <div className="bg-muted/30 space-y-1 rounded-lg border p-3">
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              实时利润分析
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-muted-foreground text-xs">综合成本</div>
                <div className="font-mono text-base font-bold">¥{totalCost.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">毛利金额</div>
                <div className="font-mono text-base font-bold text-green-600">
                  ¥{grossProfit.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">毛利率</div>
                <div className="font-mono text-base font-bold text-blue-600">
                  {grossMargin.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 品类动态属性区（非窗帘系列/墙布时从模板加载） */}
        {!hasWidthSpec && attributeSchema.length > 0 && (
          <section className="space-y-4">
            <h3 className="border-l-4 border-amber-500 pl-2 text-sm font-semibold">规格属性</h3>
            {renderAttributeFields()}
          </section>
        )}

        {/* ==================== ④ 供应与库存区 ==================== */}
        <section className="space-y-4">
          <h3 className="border-l-4 border-emerald-500 pl-2 text-sm font-semibold">供应与库存</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="defaultSupplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    默认供应商
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-xs"
                      onClick={() => setCreateSupplierOpen(true)}
                    >
                      <Plus className="mr-1 h-3 w-3" /> 新建供应商
                    </Button>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={fetchingSuppliers ? '加载中...' : '选择供应商'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliersList.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>用于自动生成采购单时的默认指向</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="flex gap-6">
            <FormField
              control={form.control}
              name="isToBEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-y-0 space-x-2">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel>ToB 可见</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isToCEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-y-0 space-x-2">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel>ToC 可见</FormLabel>
                </FormItem>
              )}
            />
          </div>

          {initialData?.id ? (
            <div className="border-t pt-2">
              <ProductSupplierManager productId={initialData.id} />
            </div>
          ) : (
            <div className="text-muted-foreground bg-secondary/30 rounded border border-dashed p-3 text-center text-sm">
              保存产品后即可管理多供应商价格与货期
            </div>
          )}
        </section>

        {/* ==================== ⑤ 图库信息区 ==================== */}
        <section className="space-y-4">
          <h3 className="border-l-4 border-blue-500 pl-2 text-sm font-semibold">图库信息</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>商品主图</FormLabel>
                  <FormControl>
                    <PhotoUpload value={field.value || []} onChange={field.onChange} maxFiles={5} />
                  </FormControl>
                  <FormDescription>用于列表展示，最多 5 张</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="attributes.materialImages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>材质细节图</FormLabel>
                  <FormControl>
                    <PhotoUpload value={field.value || []} onChange={field.onChange} maxFiles={5} />
                  </FormControl>
                  <FormDescription>纹理及触感展示，最多 5 张</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="attributes.sceneImages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>场景搭配图</FormLabel>
                  <FormControl>
                    <PhotoUpload value={field.value || []} onChange={field.onChange} maxFiles={5} />
                  </FormControl>
                  <FormDescription>搭配效果展示，最多 5 张</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* ==================== 提交按钮 ==================== */}
        <div className="flex justify-end gap-2 border-t pt-2">
          <Button type="submit" disabled={isLoading} size="lg">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {initialData?.id ? '保存修改' : '立即创建'}
          </Button>
        </div>
      </form>

      <SupplierDialog
        open={createSupplierOpen}
        onOpenChange={setCreateSupplierOpen}
        onSuccess={() => {
          fetchSuppliers();
        }}
      />
    </Form>
  );
}
