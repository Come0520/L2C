import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderTable } from '../order-table';

// mock next/link
vi.mock('next/link', () => {
    return {
        default: ({ children, href }: { children: React.ReactNode; href: string }) => (
            <a href={href}>{children}</a>
        ),
    };
});

describe('OrderTable 组件', () => {
    it('当没有数据时，渲染包含 "暂无订单。" 的 EmptyTableRow', () => {
        render(<OrderTable data={[]} />);
        expect(screen.getByText('暂无订单。')).toBeInTheDocument();
    });

    it('表格外层应该有 overflow-x-auto 和 w-full 样式以支持移动端横向滚动', () => {
        const { container } = render(<OrderTable data={[]} />);
        const wrapper = container.querySelector('.overflow-x-auto.w-full');
        expect(wrapper).toBeInTheDocument();
    });
});
