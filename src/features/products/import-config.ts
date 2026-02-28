import { z } from 'zod';
import { ExcelImporterProps } from '@/shared/components/excel-import/types';
import { productCategoryEnum } from '@/shared/api/schema/enums';
import { CATEGORY_LABELS } from '@/features/quotes/constants';

// ----------------------------------------------------------------------
// 1. Generic parsers
// ----------------------------------------------------------------------

const parseNumber = (val: any) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) return parsed;
  }
  return 0; // Default fallback instead of throwing to be more forgiving in Excel
};

const parseBooleanStr = (val: any) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim();
    if (['是', '1', 'true', 'yes', 'y'].includes(lower)) return true;
    if (['否', '0', 'false', 'no', 'n'].includes(lower)) return false;
  }
  return false;
};

// ----------------------------------------------------------------------
// 2. Base Schema (Common to all categories)
// ----------------------------------------------------------------------

export const baseProductImportSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  sku: z.string().min(1, 'SKU不能为空'),
  // 后端所需的 category 将直接从 config 生成时注入或固定映射
  category: z.preprocess(
    (val) => {
      if (typeof val !== 'string') return val;
      // 尝试反向查找 Label
      const entry = Object.entries(CATEGORY_LABELS).find(([_, label]) => label === val);
      return entry ? entry[0] : val;
    },
    z.enum(productCategoryEnum.enumValues as [string, ...string[]])
  ),
  unit: z.string().min(1, '计价单位不能为空'),

  // 成本维度
  purchasePrice: z.preprocess(parseNumber, z.number().min(0)),
  logisticsCost: z.preprocess(parseNumber, z.number().min(0)),
  processingCost: z.preprocess(parseNumber, z.number().min(0)),
  lossRate: z.preprocess(parseNumber, z.number().min(0)),

  // 销售维度
  retailPrice: z.preprocess(parseNumber, z.number().min(0)),
  floorPrice: z.preprocess(parseNumber, z.number().min(0)),

  // 库存与控制
  isStockable: z.preprocess(parseBooleanStr, z.boolean()),
  isToBEnabled: z.preprocess(parseBooleanStr, z.boolean()),
  isToCEnabled: z.preprocess(parseBooleanStr, z.boolean()),

  description: z.string().optional(),

  // 动态属性承载区
  attributes: z.record(z.string(), z.any()).default({}),
});

export type BaseProductImportItem = z.infer<typeof baseProductImportSchema>;

// ----------------------------------------------------------------------
// 3. Category specific schemas and mappings
// ----------------------------------------------------------------------

/**
 * 通用基础列映射
 */
const baseColumnMapping = {
  产品名称: 'name',
  SKU型号: 'sku',
  建议零售价: 'retailPrice',
  建议底价: 'floorPrice',
  采购基准价: 'purchasePrice',
  预估物流费: 'logisticsCost',
  描述: 'description',
  是否启用库存: 'isStockable',
  ToB可见: 'isToBEnabled',
  ToC可见: 'isToCEnabled',
} as const;

/**
 * 生成各品类的配置工厂
 */
export function getImportConfigByCategory(category: string): Omit<ExcelImporterProps<any>, 'onImport'> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const categoryLabel = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || '其它商品';

  // ========== 窗帘类 (成品/面料) ==========
  if (category === 'CURTAIN' || category === 'CURTAIN_FABRIC') {
    // 扩展规格：幅宽、由于是动态属性，需在 preprocess 把它们压入 attributes，这里先直接拉平校验
    const schema = baseProductImportSchema.extend({
      fabricWidthType: z.enum(['WIDTH', 'HEIGHT']).optional().default('WIDTH'),
      fabricWidthValue: z.string().optional(),
      material: z.string().optional(),
    }).transform(data => {
      data.attributes.fabricWidthType = data.fabricWidthType;
      data.attributes.fabricWidthValue = data.fabricWidthValue;
      data.attributes.material = data.material;
      return data;
    });

    return {
      title: `批量导入: ${String(categoryLabel)}`,
      description: '请下载模板，按说明填入窗帘规格与价格信息',
      schema,
      columnMapping: {
        ...baseColumnMapping,
        '计价单位': 'unit',
        '预估加工费': 'processingCost',
        '损耗率(0-1)': 'lossRate',
        '风格/材质': 'material',
        '幅宽类型(WIDTH/HEIGHT)': 'fabricWidthType',
        '幅宽数值(cm)': 'fabricWidthValue',
      },
      exampleData: {
        name: '星辰遮光帘',
        sku: 'CR_XC_001',
        category,
        unit: '米',
        retailPrice: 280,
        floorPrice: 200,
        purchasePrice: 80,
        logisticsCost: 10,
        processingCost: 15,
        lossRate: 0.05,
        isStockable: '是',
        isToBEnabled: '是',
        isToCEnabled: '是',
        material: '涤纶',
        fabricWidthType: 'WIDTH',
        fabricWidthValue: '280',
        description: '一级遮光面料，垂感好',
      }
    };
  }

  // ========== 墙布 / 墙纸 ==========
  if (category === 'WALLPAPER' || category === 'WALLCLOTH') {
    const isPaper = category === 'WALLPAPER';

    const schema = baseProductImportSchema.extend({
      fabricWidthValue: z.string().optional(), // 墙布
      wallpaperWidth: z.string().optional(), // 墙纸
      rollLength: z.string().optional(),     // 墙纸
    }).transform(data => {
      if (data.fabricWidthValue) data.attributes.fabricWidthValue = data.fabricWidthValue;
      if (data.wallpaperWidth) data.attributes.wallpaperWidth = data.wallpaperWidth;
      if (data.rollLength) data.attributes.rollLength = data.rollLength;
      return data;
    });

    const categoryMapping: Record<string, string> = isPaper
      ? { '墙纸宽度(cm)': 'wallpaperWidth', '卷长(米)': 'rollLength' }
      : { '墙布幅宽(cm)': 'fabricWidthValue' };

    return {
      title: `批量导入: ${String(categoryLabel)}`,
      description: `请下载模板，按说明填入${String(categoryLabel)}专属测算与计价参数`,
      schema,
      columnMapping: {
        ...baseColumnMapping,
        '计价单位': 'unit',
        '施工/铺贴费': 'processingCost',
        '损耗率(0-1)': 'lossRate',
        ...categoryMapping,
      },
      exampleData: {
        name: isPaper ? '进口无纺墙纸' : '蚕丝无缝墙布',
        sku: isPaper ? 'WP_IM_001' : 'WC_SK_001',
        category,
        unit: isPaper ? '卷' : '平方米',
        retailPrice: 580,
        floorPrice: 400,
        purchasePrice: 150,
        logisticsCost: 20,
        processingCost: 30, // 一卷的施工大概30~50
        lossRate: 0.1,      // 墙纸墙布损耗相对大一点
        isStockable: '否',
        isToBEnabled: '是',
        isToCEnabled: '是',
        wallpaperWidth: isPaper ? '53' : undefined,
        rollLength: isPaper ? '10' : undefined,
        fabricWidthValue: isPaper ? undefined : '280',
        description: '环保透气，易打理',
      }
    };
  }

  // ========== 标准品及其他 ==========
  return {
    title: `批量导入: ${String(categoryLabel)}`,
    description: '适用于标准计价方式的常规通货商品，如配件、五金等',
    schema: baseProductImportSchema,
    columnMapping: {
      ...baseColumnMapping,
      '计价单位': 'unit',
      '损耗率(0-1)': 'lossRate',
    },
    exampleData: {
      name: '静音滑轨 (不含安装)',
      sku: 'AC_TR_001',
      category,
      unit: '米',
      retailPrice: 38,
      floorPrice: 20,
      purchasePrice: 12,
      logisticsCost: 2,
      processingCost: 0,
      lossRate: 0,
      isStockable: '是',
      isToBEnabled: '是',
      isToCEnabled: '是',
      description: '通用型加厚铝合金滑轨',
    }
  };
}
