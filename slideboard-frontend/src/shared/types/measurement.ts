// 测量单类型定义

// 测量单状态类型
export type MeasurementStatus = 
  | 'pending_measurement' 
  | 'measuring_pending_assignment' 
  | 'measuring_assigning' 
  | 'measuring_pending_visit' 
  | 'measuring_pending_confirmation' 
  | 'completed' 
  | 'cancelled'

// 测量数据坐标类型
export interface MeasurementCoordinate {
  x: number;
  y: number;
  z?: number;
}

// 测量数据项类型
export interface MeasurementItem {
  id: string;
  name: string;
  value: number | string | boolean;
  unit: string;
  coordinates?: MeasurementCoordinate;
  notes?: string;
  status: 'completed' | 'pending' | 'not_applicable';
}

// 测量房间类型
export interface MeasurementRoom {
  id: string;
  name: string;
  area: number;
  items: MeasurementItem[];
}

// 测量数据类型
export interface MeasurementData {
  items?: MeasurementItem[];
  totalArea?: number;
  totalVolume?: number;
  wallMeasurements?: MeasurementItem[];
  floorMeasurements?: MeasurementItem[];
  ceilingMeasurements?: MeasurementItem[];
  windowMeasurements?: MeasurementItem[];
  doorMeasurements?: MeasurementItem[];
  customMeasurements?: MeasurementItem[];
  rooms?: MeasurementRoom[];
  remark?: string;
  notes?: string;
  photos?: string[];
  diagrams?: string[];
  version?: number;
}

// 测量单类型
export interface Measurement {
  id: string
  quoteVersionId: string
  quoteId: string
  quoteNo: string
  customerName: string
  projectAddress: string
  surveyorId?: string
  surveyorName?: string
  status: MeasurementStatus
  scheduledAt?: string
  completedAt?: string
  measurementData?: MeasurementData // 测量数据，具体结构根据业务需求定义
  homeScreenshotUrl?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// 测量单创建请求类型
export interface CreateMeasurementRequest {
  quoteVersionId: string
  scheduledAt?: string
  surveyorId?: string
}

// 测量单更新请求类型
export interface UpdateMeasurementRequest {
  status?: MeasurementStatus
  surveyorId?: string
  scheduledAt?: string
  measurementData?: MeasurementData
  completedAt?: string
}
