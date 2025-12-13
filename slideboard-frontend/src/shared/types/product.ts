// 产品状态类型
export type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'online' | 'offline';

// 产品价格类型
export interface ProductPrices {
  costPrice: number;
  internalCostPrice: number;
  internalSettlementPrice: number;
  settlementPrice: number;
  retailPrice: number;
}

// 产品图片类型
export interface ProductImages {
  detailImages: string[];
  effectImages: string[];
  caseImages: string[];
}

// 产品标签类型
export interface ProductTags {
  styleTags: string[];
  packageTags: string[];
  activityTags: string[];
  seasonTags: string[];
  demographicTags: string[];
}

// 产品核心类型定义
export interface Product {
  id: string;
  productCode: string;
  productName: string;
  categoryLevel1: string;
  categoryLevel2: string;
  unit: string;
  status: ProductStatus;
  prices: ProductPrices;
  attributes: Record<string, string>;
  images: ProductImages;
  tags: ProductTags;
  createdAt: string;
  updatedAt: string;
}

// 创建产品请求类型
export type CreateProductRequest = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

// 更新产品请求类型
export type UpdateProductRequest = Partial<CreateProductRequest>;

// 产品筛选条件
export interface ProductFilter {
  searchTerm?: string;
  categoryLevel1?: string;
  categoryLevel2?: string;
  status?: ProductStatus | 'all';
  dateRange?: {
    start: string;
    end: string;
  };
}
