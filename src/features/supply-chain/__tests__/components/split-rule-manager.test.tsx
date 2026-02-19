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
        render(<SplitRuleManager initialRules={mockRules} suppliers={mockSuppliers} />);

        expect(screen.getByText('拆单规则配置')).toBeInTheDocument();
        expect(screen.getByText('Test Rule 1')).toBeInTheDocument();
        expect(screen.getByText('Test Rule 2')).toBeInTheDocument();
        expect(screen.getByText('Supplier A')).toBeInTheDocument(); // Supplier name resolution
        expect(screen.getByText('启用')).toBeInTheDocument();
        expect(screen.getByText('禁用')).toBeInTheDocument();
    });

    it('opens add dialog when "添加规则" is clicked', () => {
        render(<SplitRuleManager initialRules={mockRules} suppliers={mockSuppliers} />);

        const addButton = screen.getByRole('button', { name: /添加规则/ });
        fireEvent.click(addButton);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: '添加规则' })).toBeInTheDocument();
        expect(screen.getByLabelText('规则名称')).toBeInTheDocument();
    });

    it('calls deleteSplitRule when delete button is clicked', async () => {
        render(<SplitRuleManager initialRules={mockRules} suppliers={mockSuppliers} />);

        // Find delete buttons (trash icon usually in a button)
        // Since we use Lucide icons, we might not see text. We can look for buttons.
        const deleteButtons = screen.getAllByRole('button', { name: '' });
        // The last column has 2 buttons per row. 
        // Let's assume the component renders standard buttons.
        // Or we can find by verify if we can select by row.

        // Simpler: Just find the delete button for the first rule if possible, or all of them.
        // We can just click the first delete button found.
        // The table row contains "Test Rule 1".

        const row1 = screen.getByText('Test Rule 1').closest('tr');
        const deleteBtn = row1?.querySelector('button:last-child'); // Assuming delete is the second button

        if (deleteBtn) {
            fireEvent.click(deleteBtn);
        }

        expect(global.confirm).toHaveBeenCalled();
        await waitFor(() => {
            expect(rulesActions.deleteSplitRule).toHaveBeenCalledWith('rule-1');
        });
    });

    it('renders empty state when no rules', () => {
        render(<SplitRuleManager initialRules={[]} suppliers={mockSuppliers} />);
        expect(screen.getByText('暂无规则')).toBeInTheDocument();
    });
});
