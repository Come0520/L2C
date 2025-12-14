'use client';

import { useEffect, useCallback } from 'react';

export type KeyboardShortcut = {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    handler: () => void;
    description: string;
    category?: string;
};

export type ShortcutHandlers = Record<string, () => void>;

/**
 * 键盘快捷键 Hook
 * 支持 Ctrl/Cmd + 组合键，自动处理 Mac/Windows 平台差异
 * 
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   'cmd+f': () => focusSearch(),
 *   'cmd+n': () => createLead(),
 *   'escape': () => closeDialog(),
 * });
 * ```
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // 忽略在输入框中的快捷键（除了 Escape）
            const isInputField =
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement ||
                (event.target as HTMLElement).isContentEditable;

            if (isInputField && event.key !== 'Escape') {
                return;
            }

            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

            // 构建快捷键字符串
            const parts: string[] = [];
            if (cmdOrCtrl) parts.push('cmd');
            if (event.shiftKey) parts.push('shift');
            if (event.altKey) parts.push('alt');
            parts.push(event.key.toLowerCase());

            const shortcut = parts.join('+');

            // 检查是否有对应的处理器
            if (handlers[shortcut]) {
                event.preventDefault();
                event.stopPropagation();
                handlers[shortcut]();
            }

            // 同时支持不带修饰符的单键快捷键
            if (handlers && handlers[event.key.toLowerCase()] && !cmdOrCtrl && !event.shiftKey && !event.altKey) {
                // 只在非输入场景下触发单键快捷键
                if (!isInputField) {
                    event.preventDefault();
                    handlers[event.key.toLowerCase()]?.();
                }
            }
        },
        [handlers]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
}

/**
 * 全局快捷键配置
 * 用于显示快捷键帮助面板
 */
export const GLOBAL_SHORTCUTS: KeyboardShortcut[] = [
    {
        key: 'cmd+f',
        handler: () => { },
        description: '聚焦搜索框',
        category: '导航',
    },
    {
        key: 'cmd+n',
        handler: () => { },
        description: '新建线索',
        category: '创建',
    },
    {
        key: 'cmd+q',
        handler: () => { },
        description: '快速报价（需选中行）',
        category: '操作',
    },
    {
        key: 'cmd+e',
        handler: () => { },
        description: '导出选中项',
        category: '操作',
    },
    {
        key: 'escape',
        handler: () => { },
        description: '关闭弹窗/取消选择',
        category: '通用',
    },
    {
        key: '?',
        handler: () => { },
        description: '显示快捷键帮助',
        category: '帮助',
    },
];

/**
 * 格式化快捷键显示
 * 将 'cmd+f' 转换为 '⌘F' (Mac) 或 'Ctrl+F' (Windows)
 */
export function formatShortcut(shortcut: string): string {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    return shortcut
        .split('+')
        .map(key => {
            switch (key) {
                case 'cmd':
                    return isMac ? '⌘' : 'Ctrl';
                case 'shift':
                    return isMac ? '⇧' : 'Shift';
                case 'alt':
                    return isMac ? '⌥' : 'Alt';
                default:
                    return key.toUpperCase();
            }
        })
        .join(isMac ? '' : '+');
}
