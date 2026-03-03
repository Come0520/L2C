import React from 'react'
import { View } from '@tarojs/components'
import './index.scss'

interface SkeletonProps {
    /** 是否显示骨架屏（true=显示骨架，false=显示 children） */
    loading: boolean
    /** 骨架行数（列表模式下使用） */
    rows?: number
    /** 是否显示头像占位 */
    avatar?: boolean
    /** 布局类型 */
    type?: 'list' | 'card' | 'detail'
    /** 子内容 */
    children?: React.ReactNode
}

/**
 * 骨架屏组件
 *
 * @description 数据加载时的占位动画，提升用户感知性能。
 * 支持列表、卡片、详情三种布局模式。
 */
export default function Skeleton({
    loading,
    rows = 3,
    avatar = false,
    type = 'list',
    children
}: SkeletonProps) {
    if (!loading) {
        return <>{children}</>
    }

    const renderListSkeleton = () => {
        return (
            <View className="skeleton skeleton--list">
                {Array.from({ length: rows }).map((_, index) => (
                    <View key={index} className="skeleton__list-item">
                        {avatar && <View className="skeleton__avatar" />}
                        <View className="skeleton__list-item-content">
                            <View className="skeleton__row skeleton__row--40" />
                            <View className="skeleton__row skeleton__row--80" />
                            <View className="skeleton__row skeleton__row--60" />
                        </View>
                    </View>
                ))}
            </View>
        )
    }

    // 针对卡片的骨架屏，模拟带标题和头像的内容卡片
    const renderCardSkeleton = () => {
        return (
            <View className="skeleton skeleton--card">
                <View className="skeleton__header">
                    <View className="skeleton__avatar" />
                    <View className="skeleton__header-content">
                        <View className="skeleton__row skeleton__row--40" />
                        <View className="skeleton__row skeleton__row--60" />
                    </View>
                </View>
                <View className="skeleton__body">
                    {Array.from({ length: rows }).map((_, index) => (
                        <View key={index} className={`skeleton__row ${index % 2 === 0 ? 'skeleton__row--100' : 'skeleton__row--60'}`} />
                    ))}
                </View>
            </View>
        )
    }

    // 针对详情页的骨架屏
    const renderDetailSkeleton = () => {
        return (
            <View className="skeleton skeleton--detail">
                <View className="skeleton__row skeleton__title-large" />
                <View className="skeleton__paragraph">
                    <View className="skeleton__row" />
                    <View className="skeleton__row" />
                    <View className="skeleton__row skeleton__row--60" />
                </View>
                <View className="skeleton__paragraph">
                    <View className="skeleton__row" />
                    <View className="skeleton__row" />
                    <View className="skeleton__row skeleton__row--60" />
                </View>
            </View>
        )
    }

    if (type === 'card') return renderCardSkeleton()
    if (type === 'detail') return renderDetailSkeleton()
    return renderListSkeleton()
}
