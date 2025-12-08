import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, it, expect, vi } from 'vitest'

import { OrderSummary } from '../order-summary'


// 模拟 ProductCategory 枚举
const mockProductCategory = {
  CURTAIN: 'curtain',
  ROLLER_BLIND: 'roller_blind',
  ROMAN_BLIND: 'roman_blind',
  SHUTTER: 'shutter',
  PERGOLA: 'pergola',
  ACCESSORIES: 'accessories'
} as const

type MockProductCategory = typeof mockProductCategory[keyof typeof mockProductCategory]

describe('OrderSummary Component', () => {
  const mockSubtotals: Record<string, number> = {
    [mockProductCategory.CURTAIN]: 1000,
    [mockProductCategory.ROLLER_BLIND]: 500,
    [mockProductCategory.ROMAN_BLIND]: 0,
    [mockProductCategory.SHUTTER]: 0,
    [mockProductCategory.PERGOLA]: 0,
    [mockProductCategory.ACCESSORIES]: 200
  }

  const defaultProps = {
    subtotals: mockSubtotals,
    totalAmount: 1700,
    onSaveDraft: vi.fn(),
    onSubmit: vi.fn()
  }

  it('should render correctly with basic props', () => {
    render(<OrderSummary {...defaultProps} />)
    
    // 检查组件是否渲染
    expect(screen.getByText('订单汇总')).toBeInTheDocument()
    
    // 检查各类别小计是否显示（只显示金额大于0的类别）
    expect(screen.getByText(/窗帘/)).toBeInTheDocument()
    // 检查总计金额
    expect(screen.getByText('总计金额')).toBeInTheDocument()
    expect(screen.getByText('¥1700.00')).toBeInTheDocument()
    
    // 检查按钮
    expect(screen.getByText('保存草稿')).toBeInTheDocument()
    expect(screen.getByText('提交订单')).toBeInTheDocument()
  })

  it('should render package information when packageAmount is provided', () => {
    render(
      <OrderSummary
        {...defaultProps}
        packageAmount={1500}
        packageExcessAmount={200}
        upgradeAmount={100}
        totalAmount={1800}
      />
    )
    
    // 检查套餐相关信息是否显示
    expect(screen.getByText('套餐价格')).toBeInTheDocument()
    expect(screen.getByText('¥1500.00')).toBeInTheDocument()
    expect(screen.getByText('套餐超出部分')).toBeInTheDocument()
    expect(screen.getByText('+¥200.00')).toBeInTheDocument()
    expect(screen.getByText('升级补差价')).toBeInTheDocument()
    expect(screen.getByText('+¥100.00')).toBeInTheDocument()
    
    // 检查总金额是否更新
    expect(screen.getByText('¥1800.00')).toBeInTheDocument()
  })

  it('should not render package information when packageAmount is 0', () => {
    render(
      <OrderSummary
        {...defaultProps}
        packageAmount={0}
        totalAmount={1700}
      />
    )
    
    // 检查套餐相关信息是否不显示
    expect(screen.queryByText('套餐价格')).not.toBeInTheDocument()
    expect(screen.queryByText('套餐超出部分')).not.toBeInTheDocument()
    expect(screen.queryByText('升级补差价')).not.toBeInTheDocument()
  })

  it('should handle button clicks correctly', () => {
    render(<OrderSummary {...defaultProps} />)
    
    // 模拟点击保存草稿按钮
    const saveButton = screen.getByText('保存草稿')
    fireEvent.click(saveButton)
    expect(defaultProps.onSaveDraft).toHaveBeenCalledTimes(1)
    
    // 模拟点击提交订单按钮
    const submitButton = screen.getByText('提交订单')
    fireEvent.click(submitButton)
    expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1)
  })

  it('should update button states when isSaving or isSubmitting is true', () => {
    render(
      <OrderSummary
        {...defaultProps}
        isSaving={true}
        isSubmitting={false}
      />
    )
    
    // 检查保存草稿按钮状态
    expect(screen.getByText('保存中...')).toBeInTheDocument()
    expect(screen.getByText('保存中...').closest('button')).toBeDisabled()
    
    // 检查提交订单按钮是否禁用
    expect(screen.getByText('提交订单').closest('button')).toBeDisabled()
    
    // 测试提交中状态
    render(
      <OrderSummary
        {...defaultProps}
        isSaving={false}
        isSubmitting={true}
      />
    )
    
    // 检查提交订单按钮状态
    expect(screen.getByText('提交中...')).toBeInTheDocument()
    expect(screen.getByText('提交中...').closest('button')).toBeDisabled()
    
    // 检查保存草稿按钮是否禁用
    expect(screen.getByText('保存草稿').closest('button')).toBeDisabled()
  })

  it('should render buttons when onSaveDraft and onSubmit are provided', () => {
    render(<OrderSummary {...defaultProps} />)
    
    // 检查按钮是否显示
    expect(screen.getAllByRole('button')).toHaveLength(2)
    expect(screen.getByText('保存草稿')).toBeInTheDocument()
    expect(screen.getByText('提交订单')).toBeInTheDocument()
  })

  it('should pass accessibility test', async () => {
    const { container } = render(<OrderSummary {...defaultProps} />)
    const results = await axe(container)
    
    expect(results).toHaveNoViolations()
  })

  it('should pass accessibility test with package information', async () => {
    const { container } = render(
      <OrderSummary
        {...defaultProps}
        packageAmount={1500}
        packageExcessAmount={200}
        upgradeAmount={100}
        totalAmount={1800}
      />
    )
    const results = await axe(container)
    
    expect(results).toHaveNoViolations()
  })
})
