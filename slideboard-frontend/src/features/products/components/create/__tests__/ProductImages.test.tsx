import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { Product } from '@/types/products';

import { ProductImages } from '../ProductImages';

// 模拟Product数据
const mockProduct: Product = {
  id: 'test-product',
  name: 'Test Product',
  images: {
    main: [],
    detail: [],
    gallery: []
  },
  // 其他Product必填字段
  description: '',
  category: '',
  price: 0,
  stock: 0,
  status: 'draft',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  sku: '',
  weight: 0,
  dimensions: { length: 0, width: 0, height: 0 },
  variants: [],
  tags: [],
  attributes: {},
  metadata: {}
};

describe('ProductImages Component', () => {
  let mockOnProductChange: vi.Mock;

  beforeEach(() => {
    mockOnProductChange = vi.fn();
  });

  it('should render the component correctly', () => {
    render(
      <ProductImages 
        product={mockProduct} 
        onProductChange={mockOnProductChange} 
      />
    );

    // 检查标题
    expect(screen.getByText('产品图片')).toBeInTheDocument();
    
    // 检查不同类型图片的标题
    expect(screen.getByText('主图')).toBeInTheDocument();
    expect(screen.getByText('详情图')).toBeInTheDocument();
    expect(screen.getByText('画廊图')).toBeInTheDocument();
  });

  it('should handle image upload correctly', async () => {
    render(
      <ProductImages 
        product={mockProduct} 
        onProductChange={mockOnProductChange} 
      />
    );

    // 模拟文件上传
    const file = new File(['test-image'], 'test-image.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/上传主图/i).closest('input[type="file"]');
    
    expect(fileInput).toBeInTheDocument();
    
    // 触发文件上传
    fireEvent.change(fileInput!, { target: { files: [file] } });
    
    // 检查是否调用了onProductChange
    await waitFor(() => {
      expect(mockOnProductChange).toHaveBeenCalled();
    });
  });

  it('should display uploaded images correctly', () => {
    const productWithImages: Product = {
      ...mockProduct,
      images: {
        main: ['https://example.com/image1.jpg'],
        detail: [],
        gallery: []
      }
    };

    render(
      <ProductImages 
        product={productWithImages} 
        onProductChange={mockOnProductChange} 
      />
    );

    // 检查是否显示了上传的图片
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });

  it('should handle image removal correctly', () => {
    const productWithImages: Product = {
      ...mockProduct,
      images: {
        main: ['https://example.com/image1.jpg'],
        detail: [],
        gallery: []
      }
    };

    render(
      <ProductImages 
        product={productWithImages} 
        onProductChange={mockOnProductChange} 
      />
    );

    // 找到删除按钮并点击
    const deleteButton = screen.getByLabelText('删除图片');
    fireEvent.click(deleteButton);
    
    // 检查是否调用了onProductChange
    expect(mockOnProductChange).toHaveBeenCalled();
  });

  it('should handle multiple image types correctly', () => {
    render(
      <ProductImages 
        product={mockProduct} 
        onProductChange={mockOnProductChange} 
      />
    );

    // 检查是否有多个文件上传组件
    const fileUploads = screen.getAllByRole('button', { name: /点击上传|拖拽文件到此处/i });
    expect(fileUploads.length).toBeGreaterThan(1);
  });
});
