'use client';

import { X, Keyboard } from 'lucide-react';
import { useState } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card';
import { GLOBAL_SHORTCUTS, formatShortcut } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * 快捷键帮助弹窗
 * 按 '?' 键显示，展示所有可用的键盘快捷键
 */
export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen) return null;

    // 按类别分组快捷键
    const groupedShortcuts = GLOBAL_SHORTCUTS.reduce((acc, shortcut) => {
        const category = shortcut.category || '其他';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(shortcut);
        return acc;
    }, {} as Record<string, typeof GLOBAL_SHORTCUTS>);

    // 搜索过滤
    const filteredCategories = Object.entries(groupedShortcuts).reduce((acc, [category, shortcuts]) => {
        const filtered = shortcuts.filter(
            s =>
                s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.key.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filtered.length > 0) {
            acc[category] = filtered;
        }
        return acc;
    }, {} as Record<string, typeof GLOBAL_SHORTCUTS>);

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <PaperCard
                className="w-full max-w-2xl max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <PaperCardHeader className="flex items-center justify-between border-b">
                    <div className="flex items-center space-x-2">
                        <Keyboard className="h-5 w-5" />
                        <PaperCardTitle>键盘快捷键</PaperCardTitle>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                        aria-label="关闭"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </PaperCardHeader>

                <PaperCardContent className="p-6">
                    {/* 搜索框 */}
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="搜索快捷键..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                        />
                    </div>

                    {/* 快捷键列表 */}
                    <div className="space-y-6 overflow-y-auto max-h-[50vh]">
                        {Object.entries(filteredCategories).map(([category, shortcuts]) => (
                            <div key={category}>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                    {category}
                                </h3>
                                <div className="space-y-2">
                                    {shortcuts.map((shortcut) => (
                                        <div
                                            key={shortcut.key}
                                            className="flex items-center justify-between py-2 px-3 
                               rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <span className="text-gray-700">{shortcut.description}</span>
                                            <kbd className="inline-flex items-center px-3 py-1.5 
                                    bg-gray-100 border border-gray-300 rounded-md
                                    text-sm font-mono text-gray-800">
                                                {formatShortcut(shortcut.key)}
                                            </kbd>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {Object.keys(filteredCategories).length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                未找到匹配的快捷键
                            </div>
                        )}
                    </div>

                    {/* 底部提示 */}
                    <div className="mt-6 pt-4 border-t text-center text-sm text-gray-500">
                        再次按 <kbd className="px-2 py-1 bg-gray-100 rounded">?</kbd> 或{' '}
                        <kbd className="px-2 py-1 bg-gray-100 rounded">Esc</kbd> 关闭此窗口
                    </div>
                </PaperCardContent>
            </PaperCard>
        </div>
    );
}
