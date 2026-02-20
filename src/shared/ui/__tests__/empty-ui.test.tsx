import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmptyUI } from '../empty-ui';
import React from 'react';

describe('EmptyUI', () => {
    it('应渲染默认提示文案', () => {
        render(<EmptyUI />);
        expect(screen.getByText('暂无数据')).toBeDefined();
    });

    it('应渲染自定义提示文案', () => {
        const message = '没有找到相关设置';
        render(<EmptyUI message={message} />);
        expect(screen.getByText(message)).toBeDefined();
    });

    it('应渲染自定义图标', () => {
        render(<EmptyUI icon={<span data-testid="custom-icon">Icon</span>} />);
        expect(screen.getByTestId('custom-icon')).toBeDefined();
    });
});
