import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProductSchema, updateProductSchema } from '../schema';
import { z } from 'zod';
import { toast } from 'sonner';
import { logger } from '@/shared/lib/logger';
import { getSuppliers } from '@/features/supply-chain/actions/supplier-actions';

export type ProductFormValues = z.infer<typeof createProductSchema> & { id?: string };

export interface AttributeField {
  key: string;
  label: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'SELECT';
  required: boolean;
  options?: string[];
  unit?: string;
  placeholder?: string;
}

export const CATEGORY_TABS = [
  { value: 'CURTAIN', label: '窗帘成品', defaultUnit: '米' },
  { value: 'CURTAIN_FABRIC', label: '窗帘面料', defaultUnit: '米' },
  { value: 'WALLCLOTH', label: '墙布', defaultUnit: '平方米' },
  { value: 'WALLPAPER', label: '墙纸', defaultUnit: '卷' },
  { value: 'CURTAIN_ACCESSORY', label: '窗帘配件', defaultUnit: '件' },
  { value: 'MATTRESS', label: '床垫', defaultUnit: '张' },
  { value: 'OTHER', label: '其他', defaultUnit: '件' },
] as const;

export const CURTAIN_PATTERN_OPTIONS = [
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

export const FABRIC_WIDTH_VALUES = ['140', '145', '150', '200', '250', '270', '280', '300'];
export const WALLPAPER_WIDTH_VALUES = ['53', '60', '70', '90', '100', '106'];
export const WALLPAPER_ROLL_LENGTH_VALUES = ['5', '7', '10', '15', '20', '25'];

export const STYLE_OPTIONS = [
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

interface UseProductFormProps {
  /** 初始数据，用于编辑场景下预填充表单 */
  initialData?: Partial<ProductFormValues> & { specs?: Record<string, unknown> };
}

export function useProductForm({ initialData }: UseProductFormProps) {
  const [suppliersList, setSuppliersList] = useState<{ id: string; name: string }[]>([]);
  const [fetchingSuppliers, setFetchingSuppliers] = useState(false);
  const [createSupplierOpen, setCreateSupplierOpen] = useState(false);
  const [attributeSchema, setAttributeSchema] = useState<AttributeField[]>([]);

  const form = useForm<ProductFormValues, unknown, ProductFormValues>({
    resolver: zodResolver(
      initialData?.id ? updateProductSchema : createProductSchema
    ) as Resolver<ProductFormValues>,
    defaultValues: initialData
      ? {
          ...initialData,
          images: initialData.images || [],
          attributes: initialData.specs || {},
          purchasePrice: Number(initialData.purchasePrice) || 0,
          logisticsCost: Number(initialData.logisticsCost) || 0,
          processingCost: Number(initialData.processingCost) || 0,
          lossRate: Number(initialData.lossRate) || 0,
          retailPrice: Number(initialData.retailPrice) || 0,
          floorPrice: Number(initialData.floorPrice) || 0,
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
  const purchasePrice = form.watch('purchasePrice') || 0;
  const retailPrice = form.watch('retailPrice') || 0;

  // Derived properties for category types
  const isCurtain = category === 'CURTAIN';
  const isCurtainFabric = category === 'CURTAIN_FABRIC';
  const hasCurtainSpecs = isCurtain || isCurtainFabric;
  const isWallcloth = category === 'WALLCLOTH';
  const isWallpaper = category === 'WALLPAPER';
  const hasWidthSpec = hasCurtainSpecs || isWallcloth || isWallpaper;
  const hidePurchaseType = hasCurtainSpecs || isWallcloth || isWallpaper;

  const lossRate = isCurtain ? 0 : form.watch('lossRate') || 0;
  const logisticsCost = Number(form.watch('logisticsCost') || 0);
  const processingCost = isCurtain ? 0 : Number(form.watch('processingCost') || 0);

  // Computed financial metrics
  const totalCost = useMemo(() => {
    return purchasePrice * (1 + lossRate) + logisticsCost + processingCost;
  }, [purchasePrice, lossRate, logisticsCost, processingCost]);

  const grossProfit = useMemo(() => {
    return retailPrice - totalCost;
  }, [retailPrice, totalCost]);

  const grossMargin = useMemo(() => {
    return retailPrice > 0 ? (grossProfit / retailPrice) * 100 : 0;
  }, [grossProfit, retailPrice]);

  // Derived arrays arrays for patterns and styles
  const _watchedPatterns = form.watch('attributes.patterns') as string[] | undefined;
  const currentPatterns: string[] = useMemo(() => _watchedPatterns || [], [_watchedPatterns]);

  const _watchedStyles = form.watch('attributes.styles') as string[] | undefined;
  const currentStyles: string[] = useMemo(() => _watchedStyles || [], [_watchedStyles]);

  const handleCategoryTabChange = useCallback(
    (tabValue: string) => {
      form.setValue('category', tabValue as ProductFormValues['category']);
      const tab = CATEGORY_TABS.find((t) => t.value === tabValue);
      if (tab && !initialData?.id) {
        form.setValue('unit', tab.defaultUnit);
      }

      if (tabValue === 'CURTAIN') {
        form.setValue('productType', 'FINISHED');
        form.setValue('lossRate', 0);
        form.setValue('processingCost', 0);
      }

      if (tabValue === 'CURTAIN_FABRIC' || tabValue === 'WALLCLOTH' || tabValue === 'WALLPAPER') {
        form.setValue('productType', 'CUSTOM');
      }
    },
    [form, initialData?.id]
  );

  const addPattern = useCallback(
    (p: string) => {
      const trimmed = p.trim();
      if (!trimmed || currentPatterns.includes(trimmed)) return;
      form.setValue('attributes.patterns', [...currentPatterns, trimmed]);
    },
    [currentPatterns, form]
  );

  const removePattern = useCallback(
    (p: string) => {
      form.setValue(
        'attributes.patterns',
        currentPatterns.filter((x) => x !== p)
      );
    },
    [currentPatterns, form]
  );

  const addStyle = useCallback(
    (style: string) => {
      const trimmed = style.trim();
      if (!trimmed || currentStyles.includes(trimmed)) return;
      form.setValue('attributes.styles', [...currentStyles, trimmed]);
    },
    [currentStyles, form]
  );

  const removeStyle = useCallback(
    (style: string) => {
      form.setValue(
        'attributes.styles',
        currentStyles.filter((s) => s !== style)
      );
    },
    [currentStyles, form]
  );

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
    fetchSuppliers();
  }, [fetchSuppliers]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  return {
    form,
    category,
    isCurtain,
    isCurtainFabric,
    hasCurtainSpecs,
    isWallcloth,
    isWallpaper,
    hasWidthSpec,
    hidePurchaseType,
    totalCost,
    grossProfit,
    grossMargin,
    suppliersList,
    fetchingSuppliers,
    createSupplierOpen,
    setCreateSupplierOpen,
    attributeSchema,
    currentPatterns,
    currentStyles,
    fetchSuppliers,
    handleCategoryTabChange,
    addPattern,
    removePattern,
    addStyle,
    removeStyle,
  };
}
