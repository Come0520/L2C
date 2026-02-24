import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom'; // Import jest-dom matchers
import { PurchaseOrderPreviewDialog } from '../../components/purchase-order-preview-dialog';

 
const mockPO = {
    id: 'po-1',
    poNo: 'PO20231027001',
    status: 'PENDING_CONFIRMATION',
    supplierName: 'Test Supplier',
    createdAt: '2023-10-27T10:00:00Z',
    expectedDate: '2023-11-01T00:00:00Z',
    totalAmount: 1000,
    logisticsNo: 'LOG123456',
    logisticsCompany: 'FastShip',
    shippedAt: '2023-10-28T10:00:00Z',
    remark: 'Urgent order',
    creator: { name: 'Admin' },
    items: [
        {
            id: 'item-1',
            productName: 'Product A',
            quantity: 10,
            unitPrice: 50,
            subtotal: 500,
        },
        {
            id: 'item-2',
            productName: 'Product B',
            quantity: 5,
            unitPrice: 100,
            subtotal: 500,
        },
    ],
};

describe('PurchaseOrderPreviewDialog', () => {
    it('renders nothing when open is false or data is null', () => {
        const { container } = render(
            <PurchaseOrderPreviewDialog open={false} onOpenChange={() => { }} data={null} />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('renders PO details correctly when open', () => {
        render(
            <PurchaseOrderPreviewDialog open={true} onOpenChange={() => { }} data={mockPO} />
        );

        // Header info
        expect(screen.getByText('采购单详情')).toBeInTheDocument();
        expect(screen.getByText('待确认')).toBeInTheDocument(); // Expect localized label
        expect(screen.getByText(/PO20231027001/)).toBeInTheDocument();

        // Basic Info
        expect(screen.getByText('Test Supplier')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
        // 金额在 DOM 中被拆分为货币符号和数字两个文本节点
        expect(screen.getByText((_content, element) => {
            return element?.textContent === '¥1000';
        })).toBeInTheDocument();

        // Logistics
        expect(screen.getByText('FastShip')).toBeInTheDocument();
        expect(screen.getByText('LOG123456')).toBeInTheDocument();

        // Items
        expect(screen.getByText('Product A')).toBeInTheDocument();
        expect(screen.getByText('Product B')).toBeInTheDocument();
        // 小计金额也被拆分为 ¥ + 数字
        const subtotalCells = screen.getAllByText((_content, element) => {
            return element?.textContent === '¥500';
        });
        expect(subtotalCells.length).toBeGreaterThanOrEqual(2); // 两个产品各 ¥500

        // Remark
        expect(screen.getByText('Urgent order')).toBeInTheDocument();
    });
});
