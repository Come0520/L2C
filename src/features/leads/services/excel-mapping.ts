/**
 * 线索导入业务映射逻辑
 */

export const LEAD_TEMPLATE_HEADER = [
  '客户姓名',
  '手机号',
  '微信号',
  '楼盘',
  '地址',
  '预估金额',
  '备注',
];

export const LEAD_TEMPLATE_EXAMPLE = [
  '张三',
  '13800138000',
  'wx123',
  '万科城',
  '1栋101',
  '50000',
  '老客户推荐',
];

const FIELD_MAPPING: Record<string, string> = {
  客户姓名: 'customerName',
  手机号: 'customerPhone',
  微信号: 'customerWechat',
  楼盘: 'community',
  地址: 'address',
  预估金额: 'estimatedAmount',
  备注: 'remark',
};

export interface ImportedLead {
  customerName: string;
  customerPhone: string;
  customerWechat?: string;
  community?: string;
  address?: string;
  estimatedAmount?: number;
  remark?: string;
}

/** 排除掉非字符串类型的字段 */
type StringFieldKey = Exclude<keyof ImportedLead, 'estimatedAmount'>;

/**
 * 将 Excel 的一行原始数据映射为线索对象
 * 消除 any 赋值，确保类型安全
 */
export function mapExcelRowToLead(row: Record<string, unknown>): ImportedLead {
  const newRow: Partial<ImportedLead> = {};
  Object.keys(row).forEach((key) => {
    const fieldName = FIELD_MAPPING[key] as keyof ImportedLead | undefined;
    if (fieldName) {
      const rawValue = row[key];
      if (fieldName === 'estimatedAmount') {
        newRow[fieldName] = rawValue ? Number(rawValue) : undefined;
      } else {
        // 类型安全赋值：fieldName 已确定不是 estimatedAmount，故必为 StringFieldKey
        const stringKey = fieldName as StringFieldKey;
        newRow[stringKey] = String(rawValue || '').trim();
      }
    }
  });
  return newRow as ImportedLead;
}

export interface ImportError {
  row: number;
  error: string;
}

export interface ImportResult {
  successCount: number;
  errors: ImportError[];
}
