import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, it, expect, vi } from 'vitest'

import { OrderTabs } from '../order-tabs'


describe('OrderTabs Component', () => {
  const defaultProps = {
    activeTab: 'summary',
    onTabChange: vi.fn()
  }

  it('should render all tabs correctly', () => {
    render(<OrderTabs {...defaultProps} />)
    
    // 检查所有标签是否渲染
    expect(screen.getByText('合计')).toBeInTheDocument()
    expect(screen.getByText('窗帘')).toBeInTheDocument()
    expect(screen.getByText('墙布')).toBeInTheDocument()
    expect(screen.getByText('墙咔')).toBeInTheDocument()
    expect(screen.getByText('飘窗垫')).toBeInTheDocument()
  })

  it('should highlight the active tab correctly', () => {
    render(<OrderTabs {...defaultProps} />)
    
    // 检查活跃标签的样式
    const activeTab = screen.getByText('合计')
    expect(activeTab).toHaveClass('bg-paper-500', 'text-ink-900', 'shadow-sm')
    
    // 检查非活跃标签的样式
    const inactiveTab = screen.getByText('窗帘')
    expect(inactiveTab).toHaveClass('text-ink-500')
    expect(inactiveTab).not.toHaveClass('bg-paper-500', 'text-ink-900', 'shadow-sm')
  })

  it('should update active tab when onTabChange is called', () => {
    render(<OrderTabs {...defaultProps} />)
    
    // 点击不同的标签
    const curtainTab = screen.getByText('窗帘')
    fireEvent.click(curtainTab)
    
    // 检查onTabChange是否被调用，并且传入了正确的标签id
    expect(defaultProps.onTabChange).toHaveBeenCalledTimes(1)
    expect(defaultProps.onTabChange).toHaveBeenCalledWith('curtain')
    
    // 测试另一个标签
    const wallcoveringTab = screen.getByText('墙布')
    fireEvent.click(wallcoveringTab)
    
    expect(defaultProps.onTabChange).toHaveBeenCalledTimes(2)
    expect(defaultProps.onTabChange).toHaveBeenCalledWith('wallcovering')
  })

  it('should handle different initial active tabs', () => {
    // 初始活跃标签为'curtain'
    render(
      <OrderTabs
        activeTab="curtain"
        onTabChange={vi.fn()}
      />
    )
    
    // 检查活跃标签
    const curtainTab = screen.getByText('窗帘')
    expect(curtainTab).toHaveClass('bg-paper-500', 'text-ink-900', 'shadow-sm')
    
    // 检查其他标签是否为非活跃状态
    const summaryTab = screen.getByText('合计')
    expect(summaryTab).not.toHaveClass('bg-paper-500')
  })

  it('should pass accessibility test', async () => {
    const { container } = render(<OrderTabs {...defaultProps} />)
    const results = await axe(container)
    
    expect(results).toHaveNoViolations()
  })

  it('should have correct tab order and keyboard navigation', () => {
    render(<OrderTabs {...defaultProps} />)
    
    // 检查标签的顺序
    const tabs = screen.getAllByRole('button')
    expect(tabs).toHaveLength(5)
    expect(tabs[0]).toHaveTextContent('合计')
    expect(tabs[1]).toHaveTextContent('窗帘')
    expect(tabs[2]).toHaveTextContent('墙布')
    expect(tabs[3]).toHaveTextContent('墙咔')
    expect(tabs[4]).toHaveTextContent('飘窗垫')
    
    // 测试Enter键触发点击事件
    fireEvent.keyDown(tabs[1], { key: 'Enter' })
    expect(defaultProps.onTabChange).toHaveBeenCalledWith('curtain')
    
    // 测试Space键触发点击事件
    fireEvent.keyDown(tabs[2], { key: ' ' })
    expect(defaultProps.onTabChange).toHaveBeenCalledWith('wallcovering')
  })
})
