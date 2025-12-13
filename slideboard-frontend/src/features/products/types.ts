// 产品管理模块 - 类型定义
// 重新导出全局产品类型
import { 
  Product, 
  ProductStatus, 
  ProductPrices, 
  ProductImages, 
  ProductTags 
} from '@/shared/types/product';

// 产品筛选参数类型
export interface ProductFilterParams {
  searchTerm: string;
  categoryLevel1: string;
  categoryLevel2: string;
  status: string;
  page: number;
  itemsPerPage: number;
}

// 产品表单数据类型
export type ProductFormData = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

// 导出重新导出的类型
export type { 
  Product, 
  ProductStatus, 
  ProductPrices, 
  ProductImages, 
  ProductTags 
};
