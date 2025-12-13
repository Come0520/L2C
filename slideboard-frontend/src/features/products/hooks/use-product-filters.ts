// 产品管理模块 - 产品筛选Hook
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';

import { CATEGORY_LEVEL1_OPTIONS, CATEGORY_LEVEL2_MAPPING, PRODUCT_STATUS_OPTIONS } from '@/constants/products';
import { Product } from '@/types/products';

import { validateProductFilterParams } from '../utils/product-validators';

interface UseProductFiltersProps {
  initialProducts: Product[];
  initialPage?: number;
  initialItemsPerPage?: number;
}

interface ProductFiltersReturn {
  // 筛选状态
  searchTerm: string;
  categoryLevel1Filter: string;
  categoryLevel2Filter: string;
  statusFilter: string;
  currentPage: number;
  itemsPerPage: number;
  
  // 筛选选项
  categoryLevel1Options: typeof CATEGORY_LEVEL1_OPTIONS;
  categoryLevel2Options: Array<{ value: string; label: string }>;
  statusOptions: typeof PRODUCT_STATUS_OPTIONS;
  
  // 筛选后的产品
  filteredProducts: Product[];
  totalPages: number;
  
  // 筛选操作方法
  onSearchChange: (value: string) => void;
  onCategoryLevel1Change: (value: string) => void;
  onCategoryLevel2Change: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPageChange: (page: number) => void;
}

export const useProductFilters = ({ 
  initialProducts, 
  initialPage = 1, 
  initialItemsPerPage = 10 
}: UseProductFiltersProps): ProductFiltersReturn => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 从URL参数中获取筛选条件，或使用默认值
  const getFilterFromUrl = () => {
    const params = {
      searchTerm: searchParams.get('q') || '',
      categoryLevel1: searchParams.get('category1') || 'all',
      categoryLevel2: searchParams.get('category2') || 'all',
      status: searchParams.get('status') || 'all',
      page: parseInt(searchParams.get('page') || `${initialPage}`),
      itemsPerPage: initialItemsPerPage
    };

    // 验证筛选参数
    const validationResult = validateProductFilterParams(params);
    if (!validationResult.success) {
      console.error('Invalid filter params:', validationResult.error);
      return {
        searchTerm: '',
        categoryLevel1: 'all',
        categoryLevel2: 'all',
        status: 'all',
        page: initialPage,
        itemsPerPage: initialItemsPerPage
      };
    }

    return validationResult.data;
  };

  const [filterParams, setFilterParams] = useState(getFilterFromUrl());

  // 更新URL参数
  const updateSearchParams = (updates: Partial<typeof filterParams>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    const updatedFilterParams = { ...filterParams, ...updates };

    // 更新URL参数
    Object.entries(updatedFilterParams).forEach(([key, value]) => {
      if (key === 'itemsPerPage') return; // 不将itemsPerPage存入URL
      if (value === '' || value === 'all' || value === 1) {
        newParams.delete(key === 'searchTerm' ? 'q' : key);
      } else {
        newParams.set(key === 'searchTerm' ? 'q' : key, value.toString());
      }
    });

    // 更新状态
    setFilterParams(updatedFilterParams);

    // 导航到新的URL
    router.push(`?${newParams.toString()}`);
  };

  // 二级分类选项（根据一级分类动态生成）
  const categoryLevel2Options = useMemo(() => {
    const allOptions = [{ value: 'all', label: '全部子分类' }];

    if (filterParams.categoryLevel1 === 'all') {
      Object.values(CATEGORY_LEVEL2_MAPPING).forEach(options => {
        allOptions.push(...options);
      });
    } else {
      const categoryOptions = CATEGORY_LEVEL2_MAPPING[filterParams.categoryLevel1 as keyof typeof CATEGORY_LEVEL2_MAPPING];
      if (categoryOptions) {
        allOptions.push(...categoryOptions);
      }
    }

    return allOptions;
  }, [filterParams.categoryLevel1]);

  // 根据筛选条件过滤产品
  const filteredProducts = useMemo(() => {
    return initialProducts.filter(product => {
      const matchesSearch = 
        product.productName.toLowerCase().includes(filterParams.searchTerm.toLowerCase()) ||
        product.productCode.toLowerCase().includes(filterParams.searchTerm.toLowerCase());

      const matchesCategoryLevel1 = filterParams.categoryLevel1 === 'all' || product.categoryLevel1 === filterParams.categoryLevel1;
      const matchesCategoryLevel2 = filterParams.categoryLevel2 === 'all' || product.categoryLevel2 === filterParams.categoryLevel2;
      const matchesStatus = filterParams.status === 'all' || product.status === filterParams.status;

      return matchesSearch && matchesCategoryLevel1 && matchesCategoryLevel2 && matchesStatus;
    });
  }, [initialProducts, filterParams]);

  // 计算总页数
  const totalPages = Math.ceil(filteredProducts.length / filterParams.itemsPerPage);

  // 筛选操作方法
  const onSearchChange = (value: string) => {
    updateSearchParams({ searchTerm: value, page: 1 });
  };

  const onCategoryLevel1Change = (value: string) => {
    updateSearchParams({ categoryLevel1: value, categoryLevel2: 'all', page: 1 });
  };

  const onCategoryLevel2Change = (value: string) => {
    updateSearchParams({ categoryLevel2: value, page: 1 });
  };

  const onStatusChange = (value: string) => {
    updateSearchParams({ status: value, page: 1 });
  };

  const onPageChange = (page: number) => {
    updateSearchParams({ page });
  };

  return {
    // 筛选状态
    searchTerm: filterParams.searchTerm,
    categoryLevel1Filter: filterParams.categoryLevel1,
    categoryLevel2Filter: filterParams.categoryLevel2,
    statusFilter: filterParams.status,
    currentPage: filterParams.page,
    itemsPerPage: filterParams.itemsPerPage,
    
    // 筛选选项
    categoryLevel1Options: CATEGORY_LEVEL1_OPTIONS,
    categoryLevel2Options,
    statusOptions: PRODUCT_STATUS_OPTIONS,
    
    // 筛选后的产品
    filteredProducts,
    totalPages,
    
    // 筛选操作方法
    onSearchChange,
    onCategoryLevel1Change,
    onCategoryLevel2Change,
    onStatusChange,
    onPageChange
  };
};
