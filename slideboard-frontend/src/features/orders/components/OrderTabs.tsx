'use client'

import React from 'react'

interface OrderTabsProps {
    activeTab: string
    onTabChange: (tab: string) => void
}

export const OrderTabs: React.FC<OrderTabsProps> = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: 'summary', label: '合计' },
        { id: 'curtain', label: '窗帘' },
        { id: 'wallcovering', label: '墙布' },
        { id: 'background-wall', label: '墙咔' }, // 用户特定称呼
        { id: 'window-cushion', label: '飘窗垫' },
        // { id: 'standard-product', label: '标品' } // 暂时隐藏或根据需求添加
    ]

    return (
        <div className="mb-6">
            <nav className="flex space-x-2 bg-paper-200 p-1 rounded-lg inline-flex">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
                            whitespace-nowrap py-2 px-4 rounded-md font-medium text-sm transition-all
                            ${activeTab === tab.id
                                ? 'bg-paper-500 text-ink-900 shadow-sm'
                                : 'text-ink-500 hover:text-ink-900 hover:bg-paper-300'
                            }
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    )
}
