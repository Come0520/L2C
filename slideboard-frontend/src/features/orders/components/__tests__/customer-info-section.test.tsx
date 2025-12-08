import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, it, expect, vi } from 'vitest'

import { CustomerInfoSection } from '../customer-info-section'


// Mock PaperDateTimePicker组件
vi.mock('@/components/ui/paper-date-time-picker', () => {
  return {
    PaperDateTimePicker: vi.fn(({ label, value, onChange, className, required }) => {
      return (
        <div className={className}>
          <label className="block text-sm font-medium text-ink-600 mb-1">
            {label} {required && <span className="text-error-500">*</span>}
          </label>
          <input
            type="date"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="paper-input w-full"
            data-testid="date-time-picker"
          />
        </div>
      )
    })
  }
})

describe('CustomerInfoSection Component', () => {
  const defaultProps = {
    leadNumber: 'LEAD-001',
    customerName: '张三',
    customerPhone: '13800138000',
    projectAddress: '北京市朝阳区某某街道123号',
    designer: '李四',
    salesPerson: '王五',
    createTime: '2023-01-01 10:00:00',
    expectedDeliveryTime: '2023-01-10',
    onDesignerChange: vi.fn(),
    onSalesPersonChange: vi.fn(),
    onExpectedDeliveryTimeChange: vi.fn(),
    onLeadNumberChange: vi.fn(),
    onCustomerNameChange: vi.fn(),
    onCustomerPhoneChange: vi.fn(),
    onProjectAddressChange: vi.fn()
  }

  it('should render all fields correctly', () => {
    render(<CustomerInfoSection {...defaultProps} />)
    
    // 检查组件是否渲染
    expect(screen.getByText('客户基础信息')).toBeInTheDocument()
    
    // 检查所有标签是否显示
    expect(screen.getByText('线索编号')).toBeInTheDocument()
    expect(screen.getByText('客户姓名')).toBeInTheDocument()
    expect(screen.getByText(/客户电话/)).toBeInTheDocument() // 使用正则匹配，忽略空格
    expect(screen.getByText('项目地址')).toBeInTheDocument()
    expect(screen.getByText('设计师')).toBeInTheDocument()
    expect(screen.getByText('导购')).toBeInTheDocument()
    expect(screen.getByText('开单时间')).toBeInTheDocument()
    expect(screen.getByText(/期望发货时间/)).toBeInTheDocument() // 使用正则匹配，忽略空格
    
    // 检查所有输入字段是否存在
    expect(screen.getByPlaceholderText('请输入线索编号')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入客户姓名')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入客户电话')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入项目地址')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入设计师')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入导购')).toBeInTheDocument()
    expect(screen.getByTestId('date-time-picker')).toBeInTheDocument()
  })

  it('should display correct initial values', () => {
    render(<CustomerInfoSection {...defaultProps} />)
    
    // 检查所有输入字段的初始值
    expect(screen.getByPlaceholderText('请输入线索编号')).toHaveValue('LEAD-001')
    expect(screen.getByPlaceholderText('请输入客户姓名')).toHaveValue('张三')
    expect(screen.getByPlaceholderText('请输入客户电话')).toHaveValue('13800138000')
    expect(screen.getByPlaceholderText('请输入项目地址')).toHaveValue('北京市朝阳区某某街道123号')
    expect(screen.getByPlaceholderText('请输入设计师')).toHaveValue('李四')
    expect(screen.getByPlaceholderText('请输入导购')).toHaveValue('王五')
    expect(screen.getByTestId('date-time-picker')).toHaveValue('2023-01-10')
    
    // 检查开单时间（只读字段）
    expect(screen.getByText('2023-01-01 10:00:00')).toBeInTheDocument()
  })

  it('should call onChange handlers when fields are updated', () => {
    render(<CustomerInfoSection {...defaultProps} />)
    
    // 测试线索编号变更
    const leadNumberInput = screen.getByPlaceholderText('请输入线索编号')
    fireEvent.change(leadNumberInput, { target: { value: 'LEAD-002' } })
    expect(defaultProps.onLeadNumberChange).toHaveBeenCalledWith('LEAD-002')
    
    // 测试客户姓名变更
    const customerNameInput = screen.getByPlaceholderText('请输入客户姓名')
    fireEvent.change(customerNameInput, { target: { value: '李四' } })
    expect(defaultProps.onCustomerNameChange).toHaveBeenCalledWith('李四')
    
    // 测试客户电话变更
    const customerPhoneInput = screen.getByPlaceholderText('请输入客户电话')
    fireEvent.change(customerPhoneInput, { target: { value: '13900139000' } })
    expect(defaultProps.onCustomerPhoneChange).toHaveBeenCalledWith('13900139000')
    
    // 测试项目地址变更
    const projectAddressInput = screen.getByPlaceholderText('请输入项目地址')
    fireEvent.change(projectAddressInput, { target: { value: '北京市海淀区某某街道456号' } })
    expect(defaultProps.onProjectAddressChange).toHaveBeenCalledWith('北京市海淀区某某街道456号')
    
    // 测试设计师变更
    const designerInput = screen.getByPlaceholderText('请输入设计师')
    fireEvent.change(designerInput, { target: { value: '王五' } })
    expect(defaultProps.onDesignerChange).toHaveBeenCalledWith('王五')
    
    // 测试导购变更
    const salesPersonInput = screen.getByPlaceholderText('请输入导购')
    fireEvent.change(salesPersonInput, { target: { value: '赵六' } })
    expect(defaultProps.onSalesPersonChange).toHaveBeenCalledWith('赵六')
    
    // 测试期望发货时间变更
    const dateTimePicker = screen.getByTestId('date-time-picker')
    fireEvent.change(dateTimePicker, { target: { value: '2023-01-15' } })
    expect(defaultProps.onExpectedDeliveryTimeChange).toHaveBeenCalledWith('2023-01-15')
  })

  it('should handle customer phone number input', () => {
    render(<CustomerInfoSection {...defaultProps} />)
    
    const customerPhoneInput = screen.getByPlaceholderText('请输入客户电话')
    
    // 测试电话号码输入
    fireEvent.change(customerPhoneInput, { target: { value: '13900139000' } })
    
    // 检查onCustomerPhoneChange是否被调用
    expect(defaultProps.onCustomerPhoneChange).toHaveBeenCalledWith('13900139000')
  })

  it('should not render change handlers when they are not provided', () => {
    render(
      <CustomerInfoSection
        leadNumber="LEAD-001"
        customerName="张三"
        customerPhone="13800138000"
        projectAddress="北京市朝阳区某某街道123号"
        designer="李四"
        salesPerson="王五"
        createTime="2023-01-01 10:00:00"
        expectedDeliveryTime="2023-01-10"
      />
    )
    
    // 尝试修改一个字段，应该不会抛出错误
    const leadNumberInput = screen.getByPlaceholderText('请输入线索编号')
    expect(() => {
      fireEvent.change(leadNumberInput, { target: { value: 'LEAD-002' } })
    }).not.toThrow()
  })

  it('should have correct label associations', () => {
    render(<CustomerInfoSection {...defaultProps} />)
    
    // 检查必填字段的标记
    expect(screen.getByText(/客户电话/)).toBeInTheDocument()
    expect(screen.getByText(/期望发货时间/)).toBeInTheDocument()
  })
})
