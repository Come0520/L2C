'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { Eye, Pencil, EyeOff } from 'lucide-react';

/**
 * 三态复选框状态
 * - VIEW: 可查看
 * - EDIT: 可编辑
 * - NONE: 不可见
 */
export type TriState = 'VIEW' | 'EDIT' | 'NONE';

interface TriStateCheckboxProps {
    value: TriState;
    onChange: (value: TriState) => void;
    disabled?: boolean;
    isModified?: boolean;  // 是否被修改过（用于颜色区分）
    className?: string;
}

/**
 * 三态复选框组件
 * 
 * 用于权限矩阵中展示和切换权限状态
 * 点击循环切换：NONE → VIEW → EDIT → NONE
 */
export function TriStateCheckbox({
    value,
    onChange,
    disabled = false,
    isModified = false,
    className,
}: TriStateCheckboxProps) {
    // 循环切换状态
    const handleClick = () => {
        if (disabled) return;

        const nextState: Record<TriState, TriState> = {
            NONE: 'VIEW',
            VIEW: 'EDIT',
            EDIT: 'NONE',
        };
        onChange(nextState[value]);
    };

    // 根据状态确定样式
    const getStateStyles = () => {
        const baseStyles = 'w-8 h-8 rounded-md flex items-center justify-center cursor-pointer transition-all duration-150';

        switch (value) {
            case 'EDIT':
                return cn(
                    baseStyles,
                    'bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30',
                    isModified && 'ring-2 ring-emerald-500 ring-offset-1'
                );
            case 'VIEW':
                return cn(
                    baseStyles,
                    'bg-sky-500/20 text-sky-600 hover:bg-sky-500/30',
                    isModified && 'ring-2 ring-sky-500 ring-offset-1'
                );
            case 'NONE':
            default:
                return cn(
                    baseStyles,
                    'bg-gray-100 text-gray-400 hover:bg-gray-200',
                    isModified && 'ring-2 ring-orange-400 ring-offset-1'
                );
        }
    };

    // 根据状态确定图标
    const getIcon = () => {
        switch (value) {
            case 'EDIT':
                return <Pencil className="w-4 h-4" />;
            case 'VIEW':
                return <Eye className="w-4 h-4" />;
            case 'NONE':
            default:
                return <EyeOff className="w-4 h-4" />;
        }
    };

    // 获取状态提示
    const getTitle = () => {
        const labels = {
            EDIT: '可编辑',
            VIEW: '可查看',
            NONE: '不可见',
        };
        const modified = isModified ? ' (已修改)' : '';
        return labels[value] + modified;
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={disabled}
            title={getTitle()}
            className={cn(
                getStateStyles(),
                disabled && 'opacity-50 cursor-not-allowed',
                className
            )}
        >
            {getIcon()}
        </button>
    );
}

/**
 * 状态标签组件（用于图例说明）
 */
export function TriStateLabel({ state }: { state: TriState }) {
    const labels = {
        EDIT: { text: '可编辑', icon: Pencil, color: 'text-emerald-600' },
        VIEW: { text: '可查看', icon: Eye, color: 'text-sky-600' },
        NONE: { text: '不可见', icon: EyeOff, color: 'text-gray-400' },
    };

    const { text, icon: Icon, color } = labels[state];

    return (
        <span className={cn('inline-flex items-center gap-1 text-sm', color)}>
            <Icon className="w-4 h-4" />
            {text}
        </span>
    );
}
