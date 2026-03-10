import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuoteTable } from '../quote-table';

describe('QuoteTable 组件', () => {
    it('当没有数据时，渲染包含 "暂无报价单" 的 EmptyTableRow', () => {
        render(<QuoteTable data={[]} />);

        // 断言能找到文本
        expect(screen.getByText('暂无报价单。')).toBeInTheDocument();
    });

    it('表格外层应该有 overflow-x-auto 和 w-full 样式以支持移动端横向滚动', () => {
        const { container } = render(<QuoteTable data={[]} />);

        // 找到包含 Table 的容器，必须包含所需的两个类
        const wrapper = container.querySelector('.overflow-x-auto.w-full');
        expect(wrapper).toBeInTheDocument();
    });
});
