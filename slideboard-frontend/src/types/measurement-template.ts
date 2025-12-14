// 测量模板类型定义

// 测量房间接口
interface MeasurementRoom {
  id: string;
  name: string;
  area: number;
  items: Array<Record<string, any>>;
}

// 自定义测量字段类型
export interface CustomMeasurementField {
  id: string;
  name: string;
  label: string;
  type: 'number' | 'string' | 'boolean' | 'select' | 'multiselect';
  unit?: string;
  required: boolean;
  defaultValue?: any;
  options?: Array<{ value: string | number; label: string }>;
  description?: string;
  order: number;
}

// 测量规则类型
export interface MeasurementRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  description?: string;
  enabled: boolean;
}

// 计算公式类型
export interface CalculationFormula {
  id: string;
  name: string;
  formula: string;
  resultField: string;
  description?: string;
  enabled: boolean;
  dependencies?: string[];
}

// 质量标准类型
export interface QualityStandard {
  id: string;
  name: string;
  minValue?: number;
  maxValue?: number;
  tolerance?: number;
  description?: string;
  fieldName: string;
  severity: 'low' | 'medium' | 'high';
}

// 测量模板接口
export interface MeasurementTemplate {
  id: string;
  name: string;
  description: string;
  productCategory: string;
  totalArea: number;
  rooms: MeasurementRoom[];
  isDefault: boolean;
  status: 'active' | 'inactive';
  version: string;
  customFields: CustomMeasurementField[];
  measurementRules: MeasurementRule[];
  calculationFormulas: CalculationFormula[];
  qualityStandards: QualityStandard[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 创建测量模板请求
export interface CreateMeasurementTemplateRequest {
  name: string;
  description: string;
  productCategory: string;
  totalArea: number;
  rooms: MeasurementRoom[];
  isDefault: boolean;
  status?: 'active' | 'inactive';
  version?: string;
  customFields?: CustomMeasurementField[];
  measurementRules?: MeasurementRule[];
  calculationFormulas?: CalculationFormula[];
  qualityStandards?: QualityStandard[];
}

// 更新测量模板请求
export interface UpdateMeasurementTemplateRequest {
  name?: string;
  description?: string;
  productCategory?: string;
  totalArea?: number;
  rooms?: MeasurementRoom[];
  isDefault?: boolean;
  status?: 'active' | 'inactive';
  version?: string;
  customFields?: CustomMeasurementField[];
  measurementRules?: MeasurementRule[];
  calculationFormulas?: CalculationFormula[];
  qualityStandards?: QualityStandard[];
}

// 测量模板筛选条件
export interface MeasurementTemplateFilters {
  name?: string;
  productCategory?: string;
  status?: 'active' | 'inactive';
  isDefault?: boolean;
  limit?: number;
  offset?: number;
}
