import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom'; // Import jest-dom matchers
import { SplitRuleManager } from '../../components/split-rule-manager';
import * as rulesActions from '../../actions/rules';
import { SplitRule } from '../../types';

// Mock dependencies
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        refresh: vi.fn(),
    }),
}));

vi.mock('../../actions/rules', () => ({
    createSplitRule: vi.fn(),
    updateSplitRule: vi.fn(),
    deleteSplitRule: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('@/shared/ui/dropdown-menu', () => ({
    DropdownMenu: ({ children }: any) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
    DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
    DropdownMenuItem: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
    DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
    DropdownMenuSeparator: () => <hr />,
}));

const mockSuppliers = [
    { id: 'sup-1', name: 'Supplier A', supplierNo: 'SUP001' },
    { id: 'sup-2', name: 'Supplier B', supplierNo: 'SUP002' },
];

const mockRules: SplitRule[] = [
    {
        id: 'rule-1',
        tenantId: 'tenant-1',
        name: 'Test Rule 1',
        priority: 10,
        conditions: [],
        targetType: 'PURCHASE_ORDER',
        targetSupplierId: 'sup-1',
        supplier: {
            id: 'sup-1',
            name: 'Supplier A',
            supplierNo: 'SUP001',
        } as any,
        isActive: true,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 'rule-2',
        tenantId: 'tenant-1',
        name: 'Test Rule 2',
        priority: 5,
        conditions: [],
        targetType: 'SERVICE_TASK',
        targetSupplierId: null,
        isActive: false,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

describe('SplitRuleManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock window.confirm
        global.confirm = vi.fn(() => true);
    });

    it('renders the rule list correctly', () => {
        render(<SplitRuleManager rules={mockRules as any} suppliers={mockSuppliers} />);

        expect(screen.getByText('智能拆单规则')).toBeInTheDocument();
        expect(screen.getByText('Test Rule 1')).toBeInTheDocument();
        expect(screen.getByText('Test Rule 2')).toBeInTheDocument();
        expect(screen.getByText('Supplier A')).toBeInTheDocument();
        expect(screen.getByText('启用中')).toBeInTheDocument();
        expect(screen.getByText('已禁用')).toBeInTheDocument();
    });

    it('opens add dialog when "新建规则" is clicked', () => {
        render(<SplitRuleManager rules={mockRules as any} suppliers={mockSuppliers} />);

        const addButton = screen.getByRole('button', { name: /新建规则/ });
        fireEvent.click(addButton);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: '新建规则' })).toBeInTheDocument();
        expect(screen.getByLabelText('规则名称')).toBeInTheDocument();
    });

    it('calls deleteSplitRule when delete button is clicked', async () => {
        render(<SplitRuleManager rules={mockRules as any} suppliers={mockSuppliers} />);

        // The DropdownMenuItem for Delete is mocked as a <button> containing the text '删除'
        const deleteButtons = screen.getAllByRole('button', { name: /删除/i });

        // click the first delete button (for rule-1)
        fireEvent.click(deleteButtons[0]);

        expect(global.confirm).toHaveBeenCalled();
        await waitFor(() => {
            expect(rulesActions.deleteSplitRule).toHaveBeenCalledWith('rule-1');
        });
    });

    it('renders empty state when no rules', () => {
        render(<SplitRuleManager rules={[]} suppliers={mockSuppliers} />);
        expect(screen.getByText(/暂无拆单规则，创建一个规则来开始自动分配订单/i)).toBeInTheDocument();
    });
});
