import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuoteDetail } from '../quote-detail';
import React from 'react';

// ─── 核心设计 ───────────────────────────────────────────────────────────────────────
// QuoteDetail 使用原生 next/navigation 的 useSearchParams 管理 URL 状态:
// - 对话框状态读取：searchParams.get('dialog')
// - 对话框打开写入：router.replace(url?dialog=xxx)
// 因此测试中：
//   - 通过 mockSearchParams 控制当前 dialog 参数值（只读）
//   - 通过 mockReplace() 断言按鈕点击时是否触发了正确的 URL 跳转（写）
// ─────────────────────────────────────────────────────────────────────────────

const mockReplace = vi.fn();
// 用对象包装，确保 vi.mock 闭包通过属性访问动态读取最新值，
// 避免直接重赋值变量后闭包内仍持有旧引用
const searchParamsState = { current: new URLSearchParams() };

// Mock Next.js router 和 searchParams
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    refresh: vi.fn(),
  }),
  // 每次调用时从 searchParamsState.current 取最新值
  useSearchParams: () => searchParamsState.current,
  usePathname: () => '/quotes/q-1',
}));

// !! 防止 next-auth / next/server 导入错误
vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    auth: vi.fn(() => Promise.resolve({ user: { id: 'u-1' } })),
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));
vi.mock('@/shared/auth/auth', () => ({
  auth: vi.fn(() => Promise.resolve({ user: { id: 'u-1' } })),
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock 重量级子组件
vi.mock('../quote-version-compare', () => ({
  QuoteVersionCompare: () => <div data-testid="version-compare-mock">Compare</div>,
}));
vi.mock('../quote-config-dialog', () => ({
  QuoteConfigDialog: () => <div data-testid="quote-config-dialog">Config</div>,
}));
vi.mock('../quote-expiration-banner', () => ({
  QuoteExpirationBanner: () => <div data-testid="expiration-banner-mock">Expiration Banner</div>,
}));
vi.mock('@/shared/components/send-to-customer-dialog', () => ({
  SendToCustomerDialog: () => <div data-testid="send-to-customer">Send</div>,
}));
vi.mock('../quote-to-order-button', () => ({
  QuoteToOrderButton: () => <div data-testid="quote-to-order-btn">QuoteToOrder</div>,
}));
vi.mock('../quote-export-menu', () => ({
  QuoteExportMenu: () => <div data-testid="quote-export-menu">Export</div>,
}));
vi.mock('../quote-items-table/index', () => ({
  QuoteItemsTable: () => <div data-testid="items-table-mock">Items Table</div>,
}));
vi.mock('../quote-bottom-summary-bar', () => ({
  QuoteBottomSummaryBar: () => <div data-testid="summary-bar-mock">Summary Bar</div>,
}));

// Mock Server Actions
vi.mock('@/features/quotes/actions/mutations', () => ({
  updateQuote: vi.fn(),
  submitQuote: vi.fn(),
  approveQuote: vi.fn(),
  rejectQuote: vi.fn(),
  createRoom: vi.fn(),
  copyQuote: vi.fn(),
}));
vi.mock('@/features/quotes/actions/queries', () => ({
  getQuote: vi.fn(),
  getQuoteVersions: vi.fn(),
}));
vi.mock('@/shared/lib/server-action', () => ({
  authenticatedAction: vi.fn(),
  serverAction: vi.fn(),
}));
vi.mock('@/features/quotes/logic/risk-control', () => ({
  checkDiscountRisk: vi.fn(() => ({ isRisk: false, reason: [], hardStop: false })),
}));

// Mock QuoteDetailDialogs 整体（因内部使用 next/dynamic 懒加载，vi.mock 无法拦截单个子对话框）
// 直接根据 activeDialog prop 渲染对应 testid，模拟真实的条件渲染行为
vi.mock('../quote-detail-sections/QuoteDetailDialogs', () => ({
  QuoteDetailDialogs: ({
    activeDialog,
    onClose,
  }: {
    activeDialog: string | null;
    onClose: () => void;
  }) => (
    <div data-testid="dialogs-container">
      {activeDialog === 'reject' && (
        <div data-testid="reject-dialog-mock">
          <button onClick={onClose}>Close Reject</button>
        </div>
      )}
      {activeDialog === 'saveTemplate' && (
        <div data-testid="template-dialog-mock">
          <button onClick={onClose}>Close Template</button>
        </div>
      )}
      {activeDialog === 'measureImport' && (
        <div data-testid="measure-import-dialog-mock">
          <button onClick={onClose}>Close Measure Import</button>
        </div>
      )}
    </div>
  ),
}));

// ─── 测试基础数据 ──────────────────────────────────────────────────────────────

const MINIMAL_QUOTE_MOCK = {
  id: 'q-1',
  quoteNo: 'Q-2023-001',
  status: 'DRAFT',
  customerId: 'c-1',
  totalAmount: 1000,
  discountAmount: 0,
  finalAmount: 1000,
  items: [],
  rooms: [],
  customer: { id: 'c-1', name: 'Test Customer' },
};

// ─── 测试套件 ──────────────────────────────────────────────────────────────────

describe('QuoteDetail - URL Driven Dialogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 默认：无 dialog 参数，通过对象属性更新确保闭包引用不断开
    searchParamsState.current = new URLSearchParams();
    mockReplace.mockReset();
  });

  describe('Dialog Trigger Actions（按钮点击写入 URL）', () => {
    it('点击"驳回"按钮时，应调用 router.replace 并含 dialog=reject 参数', () => {
      render(<QuoteDetail quote={{ ...MINIMAL_QUOTE_MOCK, status: 'PENDING_APPROVAL' } as any} />);

      const rejectBtn = screen.getByRole('button', { name: /驳回/i });
      fireEvent.click(rejectBtn);

      // router.replace 应被调用，URL 中应含有 dialog=reject
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('dialog=reject'),
        expect.any(Object)
      );
    });

    it('点击"保存为模板"按钮时，应调用 router.replace 并含 dialog=saveTemplate 参数', () => {
      render(<QuoteDetail quote={MINIMAL_QUOTE_MOCK as any} />);

      const templateBtn = screen.getByRole('button', { name: /保存为模板/i });
      fireEvent.click(templateBtn);

      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('dialog=saveTemplate'),
        expect.any(Object)
      );
    });

    it('点击"导入测量"按钮时，应调用 router.replace 并含 dialog=measureImport 参数', () => {
      render(<QuoteDetail quote={MINIMAL_QUOTE_MOCK as any} />);

      const importBtn = screen.getByRole('button', { name: /导入测量/i });
      fireEvent.click(importBtn);

      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('dialog=measureImport'),
        expect.any(Object)
      );
    });
  });

  describe('Dialog Rendering（URL 参数决定对话框是否渲染）', () => {
    it('当 URL 含 dialog=reject 时，应渲染 RejectQuoteDialog', () => {
      // 模拟 URL 中已有 dialog=reject（由 searchParamsState 控制）
      searchParamsState.current = new URLSearchParams('dialog=reject');

      render(<QuoteDetail quote={{ ...MINIMAL_QUOTE_MOCK, status: 'PENDING_APPROVAL' } as any} />);

      expect(screen.getByTestId('reject-dialog-mock')).toBeInTheDocument();
    });

    it('当 URL 无 dialog 参数时，不应渲染 RejectQuoteDialog', () => {
      searchParamsState.current = new URLSearchParams();

      render(<QuoteDetail quote={{ ...MINIMAL_QUOTE_MOCK, status: 'PENDING_APPROVAL' } as any} />);

      expect(screen.queryByTestId('reject-dialog-mock')).not.toBeInTheDocument();
    });

    it('当 URL 含 dialog=saveTemplate 时，应渲染 SaveAsTemplateDialog', () => {
      searchParamsState.current = new URLSearchParams('dialog=saveTemplate');

      render(<QuoteDetail quote={MINIMAL_QUOTE_MOCK as any} />);

      expect(screen.getByTestId('template-dialog-mock')).toBeInTheDocument();
    });
  });
});
