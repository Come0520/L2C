import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { CurtainItem } from '@/shared/types/order'

import { ProductItemRow } from '../product-item-row'

// Mock next/image
vi.mock('next/image', () => {
  return {
    default: vi.fn(({ src, alt, className }) => {
      return <img src={src} alt={alt} className={className} data-testid="product-image" />
    })
  }
})

// Mock constants
vi.mock('@/constants/products', () => {
  return {
    MOCK_PRODUCTS: [
      { id: 'prod-1', name: '测试产品1', price: 100, unit: 'm', type: 'cloth', packageTag: 'curtain-1', imageUrl: 'https://example.com/prod1.jpg' },
      { id: 'prod-2', name: '测试产品2', price: 200, unit: 'm', type: 'cloth', packageTag: 'curtain-2', imageUrl: 'https://example.com/prod2.jpg' },
      { id: 'prod-3', name: '轨道产品', price: 50, unit: 'm', type: 'track', packageTag: 'track-1', imageUrl: 'https://example.com/prod3.jpg' }
    ],
    ProductDefinition: vi.fn()
  }
})

// Mock types
vi.mock('@/types/order', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/types/order')>()
  return {
    ...actual,
    calculateItemAmount: vi.fn((item) => (item.unitPrice || 0) * (item.quantity || 0)),
    calculateUsage: vi.fn(() => 1),
    calculateUpgradeAmount: vi.fn(() => ({ priceDifference: 0, differenceAmount: 0 }))
  }
})

describe('ProductItemRow Component', () => {
  const mockItem: CurtainItem = {
    id: 'item-1',
    space: 'living-room',
    product: '测试产品1',
    imageUrl: 'https://example.com/prod1.jpg',
    width: 2,
    height: 2.8,
    quantity: 4,
    unit: 'm',
    unitPrice: 100,
    amount: 400,
    isPackageItem: false,
    packageType: undefined,
    packageTag: undefined,
    usageAmount: 0,
    priceDifference: 0,
    differenceAmount: 0,
    remark: ''
  }

  const defaultProps: React.ComponentProps<typeof ProductItemRow> = {
    item: mockItem,
    onUpdate: vi.fn(),
    onDelete: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render product item with correct information', () => {
    render(<ProductItemRow {...defaultProps} />)

    // 检查基本信息是否显示
    expect(screen.getByDisplayValue('测试产品1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2')).toBeInTheDocument() // 宽度
    expect(screen.getByDisplayValue('2.8')).toBeInTheDocument() // 高度
    expect(screen.getByDisplayValue('4')).toBeInTheDocument() // 数量
    expect(screen.getByText('m')).toBeInTheDocument() // 单位
    expect(screen.getByText('100')).toBeInTheDocument() // 单价
    expect(screen.getByText('¥400')).toBeInTheDocument() // 金额

    // 检查删除按钮是否存在
    expect(screen.getByLabelText('删除')).toBeInTheDocument()
  })

  it('should handle width change and auto-calculate quantity', () => {
    render(<ProductItemRow {...defaultProps} />)

    const widthInput = screen.getByDisplayValue('2')

    // 更改宽度
    fireEvent.change(widthInput, { target: { value: '3' } })

    // 检查onUpdate是否被调用，并且数量应该被自动计算为3 * 2 = 6
    expect(defaultProps.onUpdate).toHaveBeenCalledWith('item-1', expect.objectContaining({
      width: 3,
      quantity: 6
    }))
  })

  it('should handle track item width change and auto-calculate quantity', () => {
    render(
      <ProductItemRow
        {...defaultProps}
        item={{ ...mockItem, packageType: 'track' }}
      />
    )

    const widthInput = screen.getByDisplayValue('2')

    // 更改宽度
    fireEvent.change(widthInput, { target: { value: '3' } })

    // 检查onUpdate是否被调用，轨道产品数量应该等于宽度，即3
    expect(defaultProps.onUpdate).toHaveBeenCalledWith('item-1', expect.objectContaining({
      width: 3,
      quantity: 3
    }))
  })

  it('should handle quantity change', () => {
    render(<ProductItemRow {...defaultProps} />)

    const quantityInput = screen.getByDisplayValue('4')

    // 更改数量
    fireEvent.change(quantityInput, { target: { value: '5' } })

    // 检查onUpdate是否被调用
    expect(defaultProps.onUpdate).toHaveBeenCalledWith('item-1', expect.objectContaining({
      quantity: 5
    }))
  })

  it('should handle height change', () => {
    render(<ProductItemRow {...defaultProps} />)

    const heightInput = screen.getByDisplayValue('2.8')

    // 更改高度
    fireEvent.change(heightInput, { target: { value: '3' } })

    // 检查onUpdate是否被调用
    expect(defaultProps.onUpdate).toHaveBeenCalledWith('item-1', expect.objectContaining({
      height: 3
    }))
  })

  it('should show product suggestions when typing in search field', async () => {
    render(<ProductItemRow {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText('搜索产品...')

    // 输入搜索关键词
    fireEvent.change(searchInput, { target: { value: '测试' } })
    fireEvent.focus(searchInput)

    // 等待建议显示
    await waitFor(() => {
      expect(screen.getByText('测试产品1')).toBeInTheDocument()
      expect(screen.getByText('测试产品2')).toBeInTheDocument()
    })

    // 检查轨道产品是否不显示（因为搜索关键词是"测试"）
    expect(screen.queryByText('轨道产品')).not.toBeInTheDocument()
  })

  it('should handle product selection from suggestions', async () => {
    render(<ProductItemRow {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText('搜索产品...')

    // 输入搜索关键词
    fireEvent.change(searchInput, { target: { value: '测试' } })
    fireEvent.focus(searchInput)

    // 等待建议显示
    await waitFor(() => {
      expect(screen.getByText('测试产品2')).toBeInTheDocument()
    })

    // 选择第二个产品
    fireEvent.mouseDown(screen.getByText('测试产品2'))

    // 检查onUpdate是否被调用
    expect(defaultProps.onUpdate).toHaveBeenCalledWith('item-1', expect.objectContaining({
      product: '测试产品2',
      unit: 'm',
      unitPrice: 200
    }))
  })

  it('should handle delete action', () => {
    render(<ProductItemRow {...defaultProps} />)

    // 悬停显示删除按钮
    const row = screen.getByText('¥400').closest('.grid')
    fireEvent.mouseEnter(row!)

    // 点击删除按钮
    const deleteButton = screen.getByLabelText('删除')
    fireEvent.click(deleteButton)

    // 检查onDelete是否被调用
    expect(defaultProps.onDelete).toHaveBeenCalledWith('item-1')
  })

  it('should render package item correctly', () => {
    render(
      <ProductItemRow
        {...defaultProps}
        item={{
          ...mockItem,
          isPackageItem: true,
          packageType: 'cloth',
          packageTag: 'curtain-1',
          amount: 0
        }}
      />
    )

    // 检查套餐品标识
    expect(screen.getByText('套餐品')).toBeInTheDocument()
    expect(screen.getByText('布料')).toBeInTheDocument() // 套餐类型
    expect(screen.queryByText('¥400')).not.toBeInTheDocument() // 非套餐品金额不显示
  })

  it('should render track item correctly', () => {
    render(
      <ProductItemRow
        {...defaultProps}
        item={{
          ...mockItem,
          product: '轨道产品',
          packageType: 'track'
        }}
      />
    )

    // 检查轨道类型是否显示
    expect(screen.getByText('轨道')).toBeInTheDocument()
  })

  it('should handle package item with upgrade amount', () => {
    render(
      <ProductItemRow
        {...defaultProps}
        item={{
          ...mockItem,
          isPackageItem: true,
          packageType: 'cloth',
          priceDifference: 50,
          differenceAmount: 100
        }}
        selectedPackage={{} as any}
      />
    )

    // 检查升级金额是否显示
    expect(screen.getByText('+¥100')).toBeInTheDocument()
  })

  it('should pass accessibility test', async () => {
    const { container } = render(<ProductItemRow {...defaultProps} />)
    const results = await axe(container)

    expect(results).toHaveNoViolations()
  })
})
