import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActionConfirmDialog } from '../action-confirm-dialog';

// Mock Sonner Toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';

describe('ActionConfirmDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trigger correctly', () => {
    render(
      <ActionConfirmDialog
        title="测试弹窗"
        description="这是一个测试描述"
        action={vi.fn().mockResolvedValue(undefined)}
        trigger={<button>删除</button>}
      />
    );
    expect(screen.getByRole('button', { name: '删除' })).toBeInTheDocument();
  });

  it('opens dialog with correct a11y relations', async () => {
    const user = userEvent.setup();
    render(
      <ActionConfirmDialog
        title="测试标题"
        description="测试描述内容"
        action={vi.fn().mockResolvedValue(undefined)}
        trigger={<button>触发</button>}
      />
    );

    await user.click(screen.getByRole('button', { name: '触发' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // a11y: DialogContent should be described by description text
    const desc = screen.getByText('测试描述内容');
    expect(dialog).toHaveAttribute('aria-describedby', desc.id || String(expect.any(String)));

    // a11y: Close button should have aria-label="取消"
    const closeBtn = screen.getByRole('button', { name: /X|取消/i, hidden: true });
    expect(closeBtn).toHaveAttribute('aria-label', '取消');
  });

  it('executes action and shows custom success message', async () => {
    const user = userEvent.setup();
    const actionSpy = vi.fn().mockResolvedValue(undefined);
    const onSuccessSpy = vi.fn();

    render(
      <ActionConfirmDialog
        title="确认删除"
        description="删除不可恢复"
        action={actionSpy}
        onSuccess={onSuccessSpy}
        successMessage="自定义成功提示"
        trigger={<button>删除</button>}
      />
    );

    await user.click(screen.getByRole('button', { name: '删除' }));
    await user.click(screen.getByRole('button', { name: '确认' }));

    expect(actionSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('自定义成功提示');
      expect(onSuccessSpy).toHaveBeenCalled();
    });
  });

  it('handles error and triggers onError callback', async () => {
    const user = userEvent.setup();
    const actionSpy = vi.fn().mockRejectedValue(new Error('操作由于某种原因失败'));
    const onErrorSpy = vi.fn();

    render(
      <ActionConfirmDialog
        title="确认重置"
        description="将丢失数据"
        action={actionSpy}
        onError={onErrorSpy}
        trigger={<button>重置</button>}
      />
    );

    await user.click(screen.getByRole('button', { name: '重置' }));
    await user.click(screen.getByRole('button', { name: '确认' }));

    expect(actionSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('操作由于某种原因失败');
      expect(onErrorSpy).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it('displays correct text when pending (no garbled text)', async () => {
    const user = userEvent.setup();
    // 延迟以让 isPending 状态保持可见
    const actionSpy = vi
      .fn()
      .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(
      <ActionConfirmDialog
        title="确认提交"
        description="描述"
        action={actionSpy}
        trigger={<button>提交</button>}
      />
    );

    await user.click(screen.getByRole('button', { name: '提交' }));
    await user.click(screen.getByRole('button', { name: '确认' }));

    // 此时应当渲染为正确的占位符文字："提交中..."，不要出现乱码 "?.."
    expect(screen.getByRole('button', { name: '提交中...' })).toBeInTheDocument();
  });
});
