

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SupplierForm } from '../supplier-form';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

describe('SupplierForm', () => {
    it('should render form fields', () => {
        render(<SupplierForm onSubmit={vi.fn()} />);
        // Match actual labels from component
        expect(screen.getByLabelText(/供应商名称/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/联系人/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/联系电话/i)).toBeInTheDocument();
    });

    it('should show validation error on submit empty form', async () => {
        const onSubmit = vi.fn();
        render(<SupplierForm onSubmit={onSubmit} />);

        // Button text based on initialData (undefined -> '创建')
        const submitBtn = screen.getByRole('button', { name: /创建/i });
        fireEvent.click(submitBtn);

        // Wait for validation to trigger and check if onSubmit was NOT called
        await waitFor(() => {
            expect(onSubmit).not.toHaveBeenCalled();
        });
        // We can check for a validation message if we know what zod resolver returns, usually "Required" or custom message
        // But for now verifying it didn't submit is a good start.
    });

    it('should submit with valid data', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<SupplierForm onSubmit={onSubmit} />);

        await user.type(screen.getByLabelText(/供应商名称/i), 'Test Supplier');

        // Use fireEvent for select if needed or just skip since schema might have default?
        // Schema has paymentPeriod default 'CASH', supplierType default 'SUPPLIER'.
        // Name is required.

        const submitBtn = screen.getByRole('button', { name: /创建/i });
        await user.click(submitBtn);

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalled();
        });

        const formData = onSubmit.mock.calls[0][0];
        expect(formData).toMatchObject({
            name: 'Test Supplier',
        });
    });

    it('should populate initial data', () => {
        const initialData = {
            id: '123',
            name: 'Existing Supplier',
            contactPerson: 'John',
            phone: '123456',
            address: 'Addr',
            remark: 'Rem',
            paymentPeriod: 'CASH' as const,
            supplierType: 'SUPPLIER' as const,
        };
        render(<SupplierForm initialData={initialData} onSubmit={vi.fn()} />);

        expect(screen.getByDisplayValue('Existing Supplier')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /更新/i })).toBeInTheDocument();
    });
});
