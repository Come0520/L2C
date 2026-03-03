import React from 'react';
import { View } from '@tarojs/components';
import './index.scss';

export interface SkeletonProps {
    /** 是否显示骨架屏（true=显示骨架，false=显示 children） */
    loading: boolean;
    /** 骨架行数（列表模式下使用） */
    rows?: number;
    /** 是否显示头像占位 */
    avatar?: boolean;
    /** 布局类型 */
    type?: 'list' | 'card' | 'detail';
    /** 子内容 */
    children?: React.ReactNode;
}

/**
 * 骨架屏组件
 *
 * @description 数据加载时的占位动画，提升用户感知性能。
 * 支持列表、卡片、详情三种布局模式。
 */
export const Skeleton: React.FC<SkeletonProps> = ({
    loading,
    rows = 3,
    avatar = false,
    type = 'list',
    children,
}) => {
    if (!loading) {
        return <>{children}</>;
    }

    const renderRows = (count: number, widths: string[] = []) => {
        return Array.from({ length: count }).map((_, index) => {
            const width = widths[index] || (index === count - 1 ? '60%' : '100%');
            return (
                <View
                    key={index}
                    className="skeleton__row"
                    style={{ width }}
                />
            );
        });
    };

    const renderContent = () => {
        switch (type) {
            case 'card':
                return (
                    <View className="skeleton__card">
                        <View className="skeleton__header">
                            <View className="skeleton__avatar skeleton__avatar--square" />
                            <View className="skeleton__header-text">
                                <View className="skeleton__row" style={{ width: '40%' }} />
                                <View className="skeleton__row" style={{ width: '30%' }} />
                            </View>
                        </View>
                        <View className="skeleton__content">
                            {renderRows(rows, ['100%', '80%', '60%'])}
                        </View>
                    </View>
                );

            case 'detail':
                return (
                    <View className="skeleton__detail">
                        <View className="skeleton__row skeleton__row--title" style={{ width: '80%' }} />
                        <View className="skeleton__spacing" />
                        <View className="skeleton__content">
                            {renderRows(4, ['100%', '100%', '80%', '40%'])}
                        </View>
                        <View className="skeleton__spacing" />
                        <View className="skeleton__content">
                            {renderRows(3, ['100%', '100%', '70%'])}
                        </View>
                    </View>
                );

            case 'list':
            default:
                return (
                    <View className="skeleton__list">
                        {avatar && <View className="skeleton__avatar" />}
                        <View className="skeleton__content">
                            {renderRows(rows, ['40%', '80%', '60%'])}
                        </View>
                    </View>
                );
        }
    };

    return <View className={`skeleton skeleton--${type}`}>{renderContent()}</View>;
};
