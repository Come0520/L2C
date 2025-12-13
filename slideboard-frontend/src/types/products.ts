// 产品管理系统 - 产品类型定义
export type { Product, ProductStatus, ProductPrices, ProductImages, ProductTags } from '@/shared/types/product';

// 积分商城 - 产品类型定义
export interface MallProduct {
  id: string;
  name: string;
  description: string;
  category: MallProductCategory;
  points: number;
  stock: number;
  image: string;
  status: MallProductStatus;
  exchangeCount: number;
  validityPeriod?: string;
  specifications?: string[];
}

// 积分商城 - 产品分类类型
export type MallProductCategory = 'digital' | 'physical' | 'service' | 'coupon';

// 积分商城 - 产品状态类型
export type MallProductStatus = 'available' | 'limited' | 'sold_out';

// 积分记录类型
export interface PointsRecord {
  id: string;
  type: 'earn' | 'spend';
  points: number;
  description: string;
  timestamp: string;
  balance: number;
}

// 用户积分信息类型
export interface UserPoints {
  total: number;
  available: number;
  expired: number;
  level: PointsLevel;
  levelName: string;
  nextLevelPoints: number;
  currentMonthEarn: number;
}

// 积分等级类型
export type PointsLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

// 供应商类型定义
export interface Supplier {
  id: string;
  name: string;
  type: SupplierType;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  rating: number;
  cooperationStatus: CooperationStatus;
  serviceScope: string[];
  contractExpiry: string;
  monthlyCapacity: number;
}

// 供应商类型
export type SupplierType = 'material' | 'service' | 'logistics';

// 合作状态类型
export type CooperationStatus = 'active' | 'pending' | 'suspended';

// 服务提供商类型定义
export interface ServiceProvider {
  id: string;
  name: string;
  serviceType: ServiceType;
  specialty: string;
  contactPerson: string;
  phone: string;
  qualificationLevel: QualificationLevel;
  rating: number;
  projectCount: number;
  status: ProviderStatus;
  priceRange: string;
}

// 服务类型
export type ServiceType = 'design' | 'construction' | 'installation' | 'maintenance';

// 资质等级类型
export type QualificationLevel = 'A' | 'B' | 'C';

// 服务提供商状态类型
export type ProviderStatus = 'available' | 'busy' | 'offline';

// 库存相关类型
export type InboundType = 'purchase' | 'transfer_in' | 'return_in' | 'stocktake_gain';
export type OutboundType = 'sales' | 'transfer_out' | 'loss_out' | 'stocktake_loss';

export interface InboundRecord {
  id: string;
  type: InboundType;
  store: string;
  orderNo: string;
  sku: string;
  productName: string;
  qty: number;
  operator: string;
  time: string;
}

export interface OutboundRecord {
  id: string;
  type: OutboundType;
  store: string;
  relatedNo: string;
  sku: string;
  productName: string;
  qty: number;
  operator: string;
  time: string;
}

export interface TransferRecord {
  id: string;
  fromStore: string;
  toStore: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  sku: string;
  productName: string;
  qty: number;
  operator: string;
  time: string;
}

export interface StocktakeRecord {
  id: string;
  store: string;
  planName: string;
  status: 'planning' | 'executing' | 'completed' | 'reconciled';
  diffQty: number;
  operator: string;
  time: string;
}

// 价格计算结果类型
export interface CalculationResult {
  materialLength: number;     // 用料长度
  materialCost: number;        // 材料费
  specialCraftCost: number;   // 特殊工艺费
  remoteFee: number;           // 远程费
  totalPrice: number;         // 总价
}
