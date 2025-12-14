import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { Product } from '@/types/products';

import { ProductImages } from '../ProductImages';

// 模拟Product数据
const mockProduct: Product = {
  id: 'test-product',
  productCode: 'SKU001',
  productName: 'Test Product',
  categoryLevel1: 'Category 1',
  categoryLevel2: 'Category 2',
  unit: 'PCS',
  status: 'draft',
  prices: {
    costPrice: 0,
    internalCostPrice: 0,
    internalSettlementPrice: 0,
    settlementPrice: 0,
    retailPrice: 0,
  },
  attributes: {},
  images: {
    detailImages: [],
    effectImages: [],
    caseImages: []
  },
  tags: {
    styleTags: [],
    packageTags: [],
    activityTags: [],
    seasonTags: [],
    demographicTags: []
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
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
    expect(screen.getByText('产品细节图')).toBeInTheDocument();
    expect(screen.getByText('效果展示图')).toBeInTheDocument();
    expect(screen.getByText('案例效果图')).toBeInTheDocument();
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
    // Find the first file input (for product details images)
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = fileInputs[0];
    
    expect(fileInput).toBeInTheDocument();
    
    // 触发文件上传
    fireEvent.change(fileInput!, { target: { files: [file] } });
    
    // 检查是否调用了onProductChange
    await waitFor(() => {
      // Because upload is simulated with setTimeout(1000), we need to wait
      expect(mockOnProductChange).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('should display uploaded images correctly', () => {
    const productWithImages: Product = {
      ...mockProduct,
      images: {
        detailImages: ['https://example.com/image1.jpg'],
        effectImages: [],
        caseImages: []
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

  it('should handle image removal correctly', async () => {
     const productWithImages: Product = {
      ...mockProduct,
      images: {
        detailImages: ['https://example.com/image1.jpg'],
        effectImages: [],
        caseImages: []
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
    // Note: PaperFileUpload renders a button with text "点击上传"
    const fileUploadButtons = screen.getAllByText('点击上传');
    expect(fileUploadButtons.length).toBeGreaterThan(1);
  });
});
