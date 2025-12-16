'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Eye, FileText, MessageSquare, MoreHorizontal } from 'lucide-react';

import { PaperButton } from '@/components/ui/paper-button';
import { Lead } from '@/shared/types/lead';

interface QuickActionsBarProps {
    lead: Lead;
    onAction: (action: string) => void;
    visible: boolean;
}

/**
 * 快速操作栏组件
 * 在鼠标悬浮线索行时显示，提供常用操作的快捷入口
 */
export function QuickActionsBar({ lead, onAction, visible }: QuickActionsBarProps) {
    const actions = [
        {
            key: 'follow_up',
            label: '跟进',
            icon: MessageSquare,
            shortcut: 'F',
            variant: 'primary' as const,
            show: true,
        },
        {
            key: 'quote',
            label: '报价',
            icon: FileText,
            shortcut: 'Q',
            variant: 'outline' as const,
            show: ['FOLLOWING_UP', 'DRAFT_SIGNED'].includes(lead.status),
        },
        {
            key: 'schedule',
            label: '预约',
            icon: Calendar,
            shortcut: 'S',
            variant: 'outline' as const,
            show: true,
        },
        {
            key: 'view',
            label: '详情',
            icon: Eye,
            shortcut: 'V',
            variant: 'outline' as const,
            show: true,
        },
        {
            key: 'more',
            label: '更多',
            icon: MoreHorizontal,
            shortcut: '',
            variant: 'outline' as const,
            show: true,
        },
    ];

    const visibleActions = actions.filter(action => action.show);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 
                     flex items-center space-x-2 bg-white/95 backdrop-blur-sm
                     px-3 py-2 rounded-lg shadow-lg border border-gray-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {visibleActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <div key={action.key} className="relative group/tooltip">
                                <PaperButton
                                    variant={action.variant}
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAction(action.key);
                                    }}
                                    className="flex items-center space-x-1"
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="hidden sm:inline">{action.label}</span>
                                </PaperButton>

                                {/* 快捷键提示 */}
                                {action.shortcut && (
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2
                                opacity-0 group-hover/tooltip:opacity-100 transition-opacity
                                pointer-events-none whitespace-nowrap">
                                        <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">
                                            {action.label}
                                            <kbd className="ml-2 px-1 bg-gray-700 rounded text-[10px]">
                                                {action.shortcut}
                                            </kbd>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
