/**
 * 自定义 TabBar 组件
 *
 * @description 根据当前用户角色动态显示对应的 Tab 项。
 * 基于四大角色架构文档（2026-03-02），各角色可见 Tab 由 ROLE_TABS 控制。
 *
 * TabBar 槽位映射：
 * - 0: 工作台 (Manager, Sales)
 * - 1: 线索 (Sales)
 * - 2: 展厅 (Sales, Customer)
 * - 3: 任务 (Worker)
 * - 4: 我的 (全部角色)
 */
import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { useAuthStore, ROLE_TABS } from '@/stores/auth'
import './index.scss'

/** TabBar 单个项的配置 */
interface TabItem {
    /** 槽位索引 */
    index: number
    /** 页面路径 */
    pagePath: string
    /** 显示文字 */
    text: string
    /** 普通图标路径 */
    icon: string
    /** 选中图标路径 */
    iconSelected: string
}

/** 全部 5 个 Tab 的完整配置（按槽位顺序） */
const ALL_TABS: TabItem[] = [
    {
        index: 0,
        pagePath: '/pages/workbench/index',
        text: '工作台',
        icon: '/assets/icons/tab-workbench.png',
        iconSelected: '/assets/icons/tab-workbench-active.png',
    },
    {
        index: 1,
        pagePath: '/pages/leads/index',
        text: '线索',
        icon: '/assets/icons/tab-leads.png',
        iconSelected: '/assets/icons/tab-leads-active.png',
    },
    {
        index: 2,
        pagePath: '/pages/showroom/index',
        text: '展厅',
        icon: '/assets/icons/tab-showroom.png',
        iconSelected: '/assets/icons/tab-showroom-active.png',
    },
    {
        index: 3,
        pagePath: '/pages/tasks/index',
        text: '任务',
        icon: '/assets/icons/tab-tasks.png',
        iconSelected: '/assets/icons/tab-tasks-active.png',
    },
    {
        index: 4,
        pagePath: '/pages/users/profile/index',
        text: '我的',
        icon: '/assets/icons/tab-profile.png',
        iconSelected: '/assets/icons/tab-profile-active.png',
    },
]

/** TabBar 组件 Props */
interface TabBarProps {
    /** 当前选中页面路径 */
    selected?: string
}

/**
 * 自定义 TabBar 组件
 *
 * @example
 * ```tsx
 * // 在各 TabBar 页面底部使用
 * <TabBar selected='/pages/workbench/index' />
 * ```
 */
export default function TabBar({ selected }: TabBarProps) {
    const { currentRole } = useAuthStore()
    const [currentPath, setCurrentPath] = useState(selected || '')

    useDidShow(() => {
        // 通过 getCurrentPages 获取当前路径
        const pages = Taro.getCurrentPages()
        if (pages.length > 0) {
            const current = pages[pages.length - 1]
            setCurrentPath(`/${current.route}`)
        }
    })

    // 根据角色过滤可见 Tab
    const visibleIndexes = ROLE_TABS[currentRole] || []
    const visibleTabs = ALL_TABS.filter((tab) => visibleIndexes.includes(tab.index))

    /** 点击 Tab 跳转 */
    const handleTabClick = (tab: TabItem) => {
        if (tab.pagePath === currentPath) return
        Taro.switchTab({ url: tab.pagePath })
    }

    return (
        <View className='tab-bar safe-area-bottom'>
            {visibleTabs.map((tab) => {
                const isActive = currentPath === tab.pagePath
                return (
                    <View
                        key={tab.index}
                        className={`tab-bar__item ${isActive ? 'tab-bar__item--active' : ''}`}
                        onClick={() => handleTabClick(tab)}
                    >
                        <Image
                            className='tab-bar__icon'
                            src={isActive ? tab.iconSelected : tab.icon}
                            mode='aspectFit'
                        />
                        <Text className='tab-bar__text'>{tab.text}</Text>
                    </View>
                )
            })}
        </View>
    )
}
