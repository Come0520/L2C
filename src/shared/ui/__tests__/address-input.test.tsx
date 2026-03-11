import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddressInput } from '../address-input';

// 因为我们需要测组件，我们通过 vi.mock 劫持 chunk 文件导入以测试它是否做了懒加载
// 但是组件如果是用的 import() 动态导入，它可能内部会有 loading 状态
describe('AddressInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('syncs internal state when external value object changes', async () => {
    const { rerender } = render(
      <AddressInput
        value={{ province: '上海市', city: '市辖区', district: '徐汇区', detail: '某某路1号' }}
      />
    );

    // 断言初始渲染时 Input 框有 "某某路1号"
    expect(screen.getByDisplayValue('某某路1号')).toBeInTheDocument();

    // 外部传入新 value 触发 rerender
    rerender(
      <AddressInput
        value={{ province: '广东省', city: '深圳市', district: '南山区', detail: '某某科技园' }}
      />
    );

    // 断言此时 input 框值已被同步为新值
    await waitFor(() => {
      expect(screen.getByDisplayValue('某某科技园')).toBeInTheDocument();
    });
  });

  it('select triggers have correct aria-labels', () => {
    render(<AddressInput />);

    // 省市区三个 Trigger 应当有确切的 aria-label 表明明意图
    const provinceTrigger = screen.getByRole('combobox', { name: /选择省份|省份/i });
    expect(provinceTrigger).toBeInTheDocument();

    // 在省份没选的时候，城市下拉框应该要有 disabled 及 title / aria-disabled
    const cityTrigger = screen.getByRole('combobox', { name: /选择城市|城市/i });
    expect(cityTrigger).toHaveAttribute('data-disabled'); // radix UI disabled attribute

    const districtTrigger = screen.getByRole('combobox', { name: /选择区县|区县/i });
    expect(districtTrigger).toHaveAttribute('data-disabled');
  });

  it('detail input has maxLength limit', () => {
    render(<AddressInput />);
    const detailInput = screen.getByPlaceholderText(/详细地址/);

    // 断言存在 maxLength=255
    expect(detailInput).toHaveAttribute('maxLength', '255');
  });
});
