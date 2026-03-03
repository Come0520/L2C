import React from 'react';
import { View, Text } from '@tarojs/components';
import './index.scss';

export interface ErrorStateProps {
    /** 错误标题，默认"出错了" */
    title?: string;
    /** 错误描述信息 */
    message?: string;
    /** 重试按钮文字，默认"重新加载" */
    retryText?: string;
    /** 重试回调 */
    onRetry?: () => void;
}

/**
 * 错误状态组件
 *
 * @description 统一的页面级错误展示，替代简单的 Toast 提示。
 * 显示错误图标、标题、描述和重试按钮。
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
    title = '出错了',
    message,
    retryText = '重新加载',
    onRetry,
}) => {
    return (
        <View className="error-state">
            <View className="error-state__icon">😕</View>
            <View className="error-state__title">{title}</View>
            {message && <View className="error-state__message">{message}</View>}
            {onRetry && (
                <View className="error-state__retry-btn" onClick={onRetry}>
                    <Text className="error-state__retry-text">{retryText}</Text>
                </View>
            )}
        </View>
    );
};
