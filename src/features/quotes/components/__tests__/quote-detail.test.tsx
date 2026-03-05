import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuoteDetail } from '../quote-detail';
import React from 'react';

const mockUseQueryState = vi.fn();

// Mock nuqs
vi.mock('nuqs', () => ({
  useQueryState: (key: string) => mockUseQueryState(key),
  parseAsString: {},
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// !! Critical Auth Mock to prevent next/server errors in vitest !!
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

// Mock QuoteVersionCompare specifically as it usually requires heavy lazy loading
vi.mock('../quote-version-compare', () => ({
  QuoteVersionCompare: () => <div data-testid="version-compare-mock">Compare</div>,
}));

// Mock QuoteConfigDialog
vi.mock('../quote-config-dialog', () => ({
  QuoteConfigDialog: () => <div data-testid="quote-config-dialog">Config</div>,
}));

vi.mock('../quote-expiration-banner', () => ({
  QuoteExpirationBanner: () => <div data-testid="expiration-banner-mock">Expiration Banner</div>,
}));

// Mock Server Actions to bypass next-auth / next/server imports causing Vitest issues
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

vi.mock('../quote-to-order-button', () => ({
  QuoteToOrderButton: () => <div data-testid="quote-to-order-btn">QuoteToOrder</div>,
}));

vi.mock('../quote-export-menu', () => ({
  QuoteExportMenu: () => <div data-testid="quote-export-menu">Export</div>,
}));

vi.mock('@/shared/components/send-to-customer-dialog', () => ({
  SendToCustomerDialog: () => <div data-testid="send-to-customer">Send</div>,
}));

// Mock dialog sub-components to verify them easily
vi.mock('../reject-quote-dialog', () => ({
  RejectQuoteDialog: ({ open, onOpenChange }: any) =>
    open ? (
      <div data-testid="reject-dialog-mock">
        <button onClick={() => onOpenChange(false)}>Close Reject</button>
      </div>
    ) : null,
}));

vi.mock('../save-as-template-dialog', () => ({
  SaveAsTemplateDialog: ({ open, onOpenChange }: any) =>
    open ? (
      <div data-testid="template-dialog-mock">
        <button onClick={() => onOpenChange(false)}>Close Template</button>
      </div>
    ) : null,
}));

vi.mock('../measure-data-import-dialog', () => ({
  MeasureDataImportDialog: ({ open, onOpenChange }: any) =>
    open ? (
      <div data-testid="measure-import-dialog-mock">
        <button onClick={() => onOpenChange(false)}>Close Measure Import</button>
      </div>
    ) : null,
}));

// Mock internal dependencies causing cascade render issues
vi.mock('../quote-items-table/index', () => ({
  QuoteItemsTable: () => <div data-testid="items-table-mock">Items Table</div>,
}));

vi.mock('../quote-bottom-summary-bar', () => ({
  QuoteBottomSummaryBar: () => <div data-testid="summary-bar-mock">Summary Bar</div>,
}));

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

describe('QuoteDetail - URL Driven Dialogs', () => {
  let setDialogMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    setDialogMock = vi.fn();
    // Default mock implementation: no dialog open
    mockUseQueryState.mockReturnValue([null, setDialogMock]);
  });

  describe('Dialog Trigger Actions', () => {
    it('sets the "reject" dialog param when Reject button is clicked', () => {
      // Setup draft status so buttons show up (Reject usually requires PENDING_APPROVAL)
      render(<QuoteDetail quote={{ ...MINIMAL_QUOTE_MOCK, status: 'PENDING_APPROVAL' } as any} />);

      const rejectBtn = screen.getByRole('button', { name: /驳回/i });
      fireEvent.click(rejectBtn);

      expect(setDialogMock).toHaveBeenCalledWith('reject');
    });

    it('sets the "saveTemplate" dialog param when Save as Template button is clicked', () => {
      render(<QuoteDetail quote={MINIMAL_QUOTE_MOCK as any} />);

      const templateBtn = screen.getByRole('button', { name: /保存为模板/i });
      fireEvent.click(templateBtn);

      expect(setDialogMock).toHaveBeenCalledWith('saveTemplate');
    });

    it('sets the "measureImport" dialog param when Import button is clicked', () => {
      render(<QuoteDetail quote={MINIMAL_QUOTE_MOCK as any} />);

      const importBtn = screen.getByRole('button', { name: /导入测量/i });
      fireEvent.click(importBtn);

      expect(setDialogMock).toHaveBeenCalledWith('measureImport');
    });
  });

  describe('Dialog Rendering and Closing based on URL state', () => {
    it('renders Reject Dialog when URL param is "reject"', async () => {
      mockUseQueryState.mockImplementation((key: string) => {
        if (key === 'dialog') return ['reject', setDialogMock];
        return [null, vi.fn()];
      });

      render(<QuoteDetail quote={{ ...MINIMAL_QUOTE_MOCK, status: 'PENDING_APPROVAL' } as any} />);

      await waitFor(() => {
        expect(screen.getByTestId('reject-dialog-mock')).toBeInTheDocument();
      });

      // Test closing clears the param
      fireEvent.click(screen.getByText('Close Reject'));
      expect(setDialogMock).toHaveBeenCalledWith(null);
    });

    it('does NOT render Reject Dialog when URL param is null', () => {
      mockUseQueryState.mockReturnValue([null, setDialogMock]);

      render(<QuoteDetail quote={{ ...MINIMAL_QUOTE_MOCK, status: 'PENDING_APPROVAL' } as any} />);

      expect(screen.queryByTestId('reject-dialog-mock')).not.toBeInTheDocument();
    });

    it('renders Save as Template Dialog when URL param is "saveTemplate"', async () => {
      mockUseQueryState.mockImplementation((key: string) => {
        if (key === 'dialog') return ['saveTemplate', setDialogMock];
        return [null, vi.fn()];
      });

      render(<QuoteDetail quote={MINIMAL_QUOTE_MOCK as any} />);

      await waitFor(() => {
        expect(screen.getByTestId('template-dialog-mock')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Close Template'));
      expect(setDialogMock).toHaveBeenCalledWith(null);
    });
  });
});
