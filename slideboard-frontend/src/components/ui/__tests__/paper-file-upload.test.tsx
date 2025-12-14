import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { PaperFileUpload } from '../paper-file-upload';

describe('PaperFileUpload Component', () => {
  let mockOnUpload: vi.Mock;
  let mockOnUploadProgress: vi.Mock;
  let mockOnUploadSuccess: vi.Mock;
  let mockOnUploadError: vi.Mock;
  let mockOnValidateError: vi.Mock;

  beforeEach(() => {
    mockOnUpload = vi.fn();
    mockOnUploadProgress = vi.fn();
    mockOnUploadSuccess = vi.fn();
    mockOnUploadError = vi.fn();
    mockOnValidateError = vi.fn();
  });

  it('should render the component correctly', () => {
    render(
      <PaperFileUpload
        onUpload={mockOnUpload}
        label="测试上传"
      />
    );

    // 检查标签
    expect(screen.getByText('测试上传')).toBeInTheDocument();
    
    // 检查上传区域
    expect(screen.getByText('拖拽文件到此处 或')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '点击上传' })).toBeInTheDocument();
  });

  it('should handle file selection via button click', async () => {
    const { container } = render(
      <PaperFileUpload
        onUpload={mockOnUpload}
        onUploadSuccess={mockOnUploadSuccess}
        accept="image/*"
      />
    );

    // 模拟文件
    const file = new File(['test-image'], 'test-image.jpg', { type: 'image/jpeg' });
    
    // 点击上传按钮
    fireEvent.click(screen.getByRole('button', { name: '点击上传' }));
    
    // 获取文件输入框并触发文件选择
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    
    fireEvent.change(fileInput!, { target: { files: [file] } });
    
    // 等待文件处理完成
    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalled();
      expect(mockOnUploadSuccess).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('should handle drag and drop functionality', async () => {
    render(
      <PaperFileUpload
        onUpload={mockOnUpload}
        onUploadSuccess={mockOnUploadSuccess}
      />
    );

    // 模拟文件
    const file = new File(['test-document'], 'test-document.pdf', { type: 'application/pdf' });
    
    // 模拟拖拽事件
    const dropZone = screen.getByText('拖拽文件到此处 或').closest('div')!;
    
    // 触发dragenter事件
    fireEvent.dragEnter(dropZone);
    
    // 触发dragover事件
    fireEvent.dragOver(dropZone);
    
    // 触发drop事件
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file],
        types: ['Files'],
        items: [{ kind: 'file', type: 'application/pdf', getAsFile: () => file }],
        getData: vi.fn()
      }
    });
    
    // 等待文件处理完成
    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalled();
      expect(mockOnUploadSuccess).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('should validate file size correctly', async () => {
    const { container } = render(
      <PaperFileUpload
        onUpload={mockOnUpload}
        onValidateError={mockOnValidateError}
        maxSizeMB={0.001} // 1KB限制
        accept="image/*"
      />
    );

    // 创建一个超过大小限制的文件
    const largeFile = new File(['x'.repeat(2 * 1024)], 'large-file.jpg', { type: 'image/jpeg' });
    
    // 点击上传按钮并选择文件
    fireEvent.click(screen.getByRole('button', { name: '点击上传' }));
    const fileInput = container.querySelector('input[type="file"]');
    fireEvent.change(fileInput!, { target: { files: [largeFile] } });
    
    // 检查是否触发了验证错误
    await waitFor(() => {
      expect(mockOnValidateError).toHaveBeenCalled();
      expect(mockOnUpload).not.toHaveBeenCalled();
    });
  });

  it('should validate file type correctly', async () => {
    const { container } = render(
      <PaperFileUpload
        onUpload={mockOnUpload}
        onValidateError={mockOnValidateError}
        accept="image/jpeg,image/png"
      />
    );

    // 创建一个不允许的文件类型
    const invalidFile = new File(['test-text'], 'test-file.txt', { type: 'text/plain' });
    
    // 点击上传按钮并选择文件
    fireEvent.click(screen.getByRole('button', { name: '点击上传' }));
    const fileInput = container.querySelector('input[type="file"]');
    fireEvent.change(fileInput!, { target: { files: [invalidFile] } });
    
    // 检查是否触发了验证错误
    await waitFor(() => {
      expect(mockOnValidateError).toHaveBeenCalled();
      expect(mockOnUpload).not.toHaveBeenCalled();
    });
  });

  it('should display upload progress correctly', async () => {
    const { container } = render(
      <PaperFileUpload
        onUpload={mockOnUpload}
        onUploadProgress={mockOnUploadProgress}
        accept="image/*"
      />
    );

    // 模拟文件
    const file = new File(['test-image'], 'test-image.jpg', { type: 'image/jpeg' });
    
    // 点击上传按钮并选择文件
    fireEvent.click(screen.getByRole('button', { name: '点击上传' }));
    const fileInput = container.querySelector('input[type="file"]');
    fireEvent.change(fileInput!, { target: { files: [file] } });
    
    // 检查上传进度是否显示
    await waitFor(() => {
      expect(screen.getByText('上传进度')).toBeInTheDocument();
    });
  });

  it('should handle uploading state correctly', async () => {
    const { container } = render(
      <PaperFileUpload
        onUpload={mockOnUpload}
        accept="image/*"
      />
    );

    // 模拟文件
    const file = new File(['test-image'], 'test-image.jpg', { type: 'image/jpeg' });
    
    // 点击上传按钮并选择文件
    fireEvent.click(screen.getByRole('button', { name: '点击上传' }));
    const fileInput = container.querySelector('input[type="file"]');
    fireEvent.change(fileInput!, { target: { files: [file] } });
    
    // 检查按钮是否禁用
    expect(screen.getByRole('button', { name: '点击上传' })).toBeDisabled();
    
    // 等待上传完成
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '点击上传' })).not.toBeDisabled();
    }, { timeout: 2000 });
  });

  it('should support different attachment types', () => {
    render(
      <PaperFileUpload
        onUpload={mockOnUpload}
        attachmentType="image"
      />
    );

    // 检查文件类型提示
    expect(screen.getByText(/支持文件类型/i)).toBeInTheDocument();
  });

  it('should display error messages', () => {
    render(
      <PaperFileUpload
        onUpload={mockOnUpload}
        error="上传失败，请重试"
      />
    );

    // 检查错误信息
    expect(screen.getByText('上传失败，请重试')).toBeInTheDocument();
  });
});
