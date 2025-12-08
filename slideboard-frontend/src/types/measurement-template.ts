// 测量模板类型定义

import { MeasurementRoom } from '@/features/orders/components/measurement-data-editor';

// 测量模板接口
export interface MeasurementTemplate {
  id: string;
  name: string;
  description: string;
  totalArea: number;
  rooms: MeasurementRoom[];
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 创建测量模板请求
export interface CreateMeasurementTemplateRequest {
  name: string;
  description: string;
  totalArea: number;
  rooms: MeasurementRoom[];
  isDefault: boolean;
}

// 更新测量模板请求
export interface UpdateMeasurementTemplateRequest {
  name?: string;
  description?: string;
  totalArea?: number;
  rooms?: MeasurementRoom[];
  isDefault?: boolean;
}

// 测量模板筛选条件
export interface MeasurementTemplateFilters {
  name?: string;
  isDefault?: boolean;
  limit?: number;
  offset?: number;
}
