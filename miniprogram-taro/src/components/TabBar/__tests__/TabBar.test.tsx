/**
 * TabBar 组件单元测试
 *
 * @description 测试自定义 TabBar 根据角色动态显示正确的 Tab 项。
 */
import { render } from '@testing-library/react'
import TabBar from '../index'
import { useAuthStore } from '@/stores/auth'

describe('TabBar 组件', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    /** 辅助函数：设置当前角色 */
    const setRole = (role: string) => {
        useAuthStore.setState({
            currentRole: role as any,
            isLoggedIn: role !== 'guest',
        })
    }

    test('Manager 角色应显示工作台和我的两个 Tab', () => {
        setRole('manager')
        const { container } = render(<TabBar selected="/pages/workbench/index" />)
        const tabs = container.querySelectorAll('.tab-bar__item')
        expect(tabs).toHaveLength(2)
        expect(container.textContent).toContain('工作台')
        expect(container.textContent).toContain('我的')
    })

    test('Sales 角色应显示工作台、线索、展厅、我的四个 Tab', () => {
        setRole('sales')
        const { container } = render(<TabBar selected="/pages/workbench/index" />)
        const tabs = container.querySelectorAll('.tab-bar__item')
        expect(tabs).toHaveLength(4)
        expect(container.textContent).toContain('工作台')
        expect(container.textContent).toContain('线索')
        expect(container.textContent).toContain('展厅')
        expect(container.textContent).toContain('我的')
    })

    test('Worker 角色应显示任务和我的两个 Tab', () => {
        setRole('worker')
        const { container } = render(<TabBar selected="/pages/tasks/index" />)
        const tabs = container.querySelectorAll('.tab-bar__item')
        expect(tabs).toHaveLength(2)
        expect(container.textContent).toContain('任务')
        expect(container.textContent).toContain('我的')
    })

    test('Customer 角色应显示展厅和我的两个 Tab', () => {
        setRole('customer')
        const { container } = render(<TabBar selected="/pages/showroom/index" />)
        const tabs = container.querySelectorAll('.tab-bar__item')
        expect(tabs).toHaveLength(2)
        expect(container.textContent).toContain('展厅')
        expect(container.textContent).toContain('我的')
    })

    test('Guest 角色不应显示任何 Tab', () => {
        setRole('guest')
        const { container } = render(<TabBar selected="/pages/login/index" />)
        const tabs = container.querySelectorAll('.tab-bar__item')
        expect(tabs).toHaveLength(0)
    })
})
