
import { z } from 'zod';
import { ExcelImporterProps } from '@/shared/components/excel-import/types';
import { productCategoryEnum } from '@/shared/api/schema/enums';

export const productImportSchema = z.object({
    name: z.string().min(1, '名称不能为空'),
    sku: z.string().min(1, 'SKU不能为空'),
    category: z.enum(productCategoryEnum.enumValues),
    unit: z.string().default('件'),
    retailPrice: z.coerce.number().min(0).default(0),
    purchasePrice: z.coerce.number().min(0).default(0),
    description: z.string().optional(),
});

export type ProductImportItem = z.infer<typeof productImportSchema>;

// Omit 'onImport' as it will be handled by the component or defined here if generic
export const productImportConfig: Omit<ExcelImporterProps<ProductImportItem>, 'onImport'> = {
    templateUrl: '/templates/product_import_template.xlsx',
    schema: productImportSchema,
    columnMapping: {
        '产品名称': 'name',
        'SKU型号': 'sku',
        '品类': 'category',
        '零售价': 'retailPrice',
        '采购价': 'purchasePrice'
    },
    title: '批量导入商品',
    description: '支持 .xlsx 格式，请下载模板填写'
};
