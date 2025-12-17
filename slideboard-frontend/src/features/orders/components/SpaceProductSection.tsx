'use client'

import { Plus, Trash2, X } from 'lucide-react'
import React, { useState } from 'react'

import {
    CurtainItem,
    ProductCategory,
    SPACE_OPTIONS,
    PackageDefinition
} from '@/shared/types/order'

import { CurtainProductTable } from './CurtainProductTable' // 复用表格组件，但可能需要调整以隐藏空间列

interface SpaceProductSectionProps {
    category: ProductCategory
    items: CurtainItem[]
    selectedPackage?: PackageDefinition
    onAddItem: (space: string) => void
    onUpdateItem: (id: string, updates: Partial<CurtainItem>) => void
    onDeleteItem: (id: string) => void
}

export const SpaceProductSection: React.FC<SpaceProductSectionProps> = ({
    items,
    selectedPackage,
    onAddItem,
    onUpdateItem,
    onDeleteItem
}) => {
    // 管理已添加的空间列表
    // 初始化时，从 items 中提取已有的空间
    const existingSpaces = Array.from(new Set(items.map(i => i.space).filter(Boolean)))
    const [activeSpaces, setActiveSpaces] = useState<string[]>(existingSpaces.length > 0 ? existingSpaces : [])

    // 空间选择下拉框状态
    const [isAddingSpace, setIsAddingSpace] = useState(false)

    // 自定义空间弹窗状态
    const [showCustomSpaceDialog, setShowCustomSpaceDialog] = useState(false)
    const [customSpaceName, setCustomSpaceName] = useState('')

    // 存储自定义空间名称的映射（value -> label）
    const [customSpaceLabels, setCustomSpaceLabels] = useState<Record<string, string>>({})

    // 处理空间选择
    const handleSpaceSelect = (spaceValue: string) => {
        if (spaceValue === 'other') {
            // 选择"其他"时，弹出自定义输入框
            setShowCustomSpaceDialog(true)
            setIsAddingSpace(false)
        } else {
            handleAddSpace(spaceValue)
        }
    }

    // 添加空间
    const handleAddSpace = (spaceValue: string) => {
        if (!activeSpaces.includes(spaceValue)) {
            setActiveSpaces([...activeSpaces, spaceValue])
        }
        setIsAddingSpace(false)
    }

    // 确认添加自定义空间
    const handleConfirmCustomSpace = () => {
        if (customSpaceName.trim()) {
            // 生成唯一的空间标识
            const customSpaceValue = `custom-${Date.now()}`
            // 保存自定义空间名称映射
            setCustomSpaceLabels(prev => ({
                ...prev,
                [customSpaceValue]: customSpaceName.trim()
            }))
            // 添加到活跃空间列表
            handleAddSpace(customSpaceValue)
            // 重置状态
            setCustomSpaceName('')
            setShowCustomSpaceDialog(false)
        }
    }

    // 取消自定义空间输入
    const handleCancelCustomSpace = () => {
        setCustomSpaceName('')
        setShowCustomSpaceDialog(false)
    }

    // 获取空间显示名称
    const getSpaceLabel = (spaceValue: string): string => {
        // 先检查是否是自定义空间
        if (customSpaceLabels[spaceValue]) {
            return customSpaceLabels[spaceValue]
        }
        // 再从预定义选项中查找
        return SPACE_OPTIONS.find(s => s.value === spaceValue)?.label || spaceValue
    }

    // 删除空间 (同时删除该空间下的所有商品)
    const handleDeleteSpace = (spaceValue: string) => {
        if (confirm(`确定要删除${getSpaceLabel(spaceValue)}及其所有商品吗？`)) {
            // 找出该空间下的所有商品ID并删除
            const spaceItems = items.filter(i => i.space === spaceValue)
            spaceItems.forEach(item => onDeleteItem(item.id))

            // 从活跃空间列表中移除
            setActiveSpaces(prev => prev.filter(s => s !== spaceValue))

            // 如果是自定义空间，也从映射中移除
            if (customSpaceLabels[spaceValue]) {
                setCustomSpaceLabels(prev => {
                    const newLabels = { ...prev }
                    delete newLabels[spaceValue]
                    return newLabels
                })
            }
        }
    }

    // 获取未添加的空间选项
    const availableSpaceOptions = SPACE_OPTIONS.filter(opt => !activeSpaces.includes(opt.value))

    return (
        <div className="space-y-8">
            {/* 自定义空间名称输入弹窗 */}
            {showCustomSpaceDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-ink-900">输入自定义空间名称</h3>
                            <button
                                onClick={handleCancelCustomSpace}
                                className="text-ink-400 hover:text-ink-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <p className="text-sm text-ink-500 mb-4">
                            请输入空间名称，例如：保姆房、衣帽间、儿童房等
                        </p>
                        <input
                            type="text"
                            value={customSpaceName}
                            onChange={(e) => setCustomSpaceName(e.target.value)}
                            placeholder="请输入空间名称"
                            className="w-full px-3 py-2 border border-paper-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleConfirmCustomSpace()
                                } else if (e.key === 'Escape') {
                                    handleCancelCustomSpace()
                                }
                            }}
                        />
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={handleCancelCustomSpace}
                                className="px-4 py-2 text-sm font-medium text-ink-700 bg-paper-100 hover:bg-paper-200 rounded-md transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleConfirmCustomSpace}
                                disabled={!customSpaceName.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                确认添加
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeSpaces.length === 0 ? (
                <div className="text-center py-12 bg-paper-50 rounded-lg border border-dashed border-paper-300">
                    <p className="text-ink-500 mb-4">暂无空间数据</p>
                    <button
                        onClick={() => setIsAddingSpace(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        添加空间
                    </button>

                    {isAddingSpace && (
                        <div className="mt-4 max-w-xs mx-auto relative">
                            <select
                                className="block w-full pl-3 pr-10 py-2 text-base border-paper-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                                onChange={(e) => {
                                    if (e.target.value) handleSpaceSelect(e.target.value)
                                }}
                                defaultValue=""
                                autoFocus
                                onBlur={() => setIsAddingSpace(false)}
                            >
                                <option value="" disabled>选择空间...</option>
                                {availableSpaceOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {activeSpaces.map(space => {
                        const spaceLabel = getSpaceLabel(space)
                        const spaceItems = items.filter(i => i.space === space)

                        return (
                            <div key={space} className="bg-white rounded-lg border border-paper-300 shadow-sm overflow-hidden">
                                {/* 空间标题栏 */}
                                <div className="bg-paper-100 px-4 py-3 border-b border-paper-300 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-ink-800 flex items-center">
                                        <span className="w-1 h-6 bg-primary-500 rounded-full mr-3"></span>
                                        {spaceLabel}
                                    </h3>
                                    <button
                                        onClick={() => handleDeleteSpace(space)}
                                        className="text-ink-400 hover:text-error-600 transition-colors p-1"
                                        title="删除空间"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* 商品表格 */}
                                <div className="p-0">
                                    <CurtainProductTable
                                        items={spaceItems}
                                        selectedPackage={selectedPackage}
                                        onAddItem={() => onAddItem(space)}
                                        onUpdateItem={onUpdateItem}
                                        onDeleteItem={onDeleteItem}
                                        hideSpaceColumn={true} // 需要修改 CurtainProductTable 支持此属性
                                    />
                                </div>
                            </div>
                        )
                    })}

                    {/* 底部继续添加空间按钮 */}
                    <div className="pt-4 border-t border-paper-200 flex items-center gap-4">
                        <button
                            onClick={() => setIsAddingSpace(true)}
                            className={`flex items-center font-medium transition-colors ${isAddingSpace ? 'text-ink-400 cursor-default' : 'text-primary-600 hover:text-primary-700'
                                }`}
                            disabled={isAddingSpace}
                        >
                            <Plus className="h-5 w-5 mr-1" />
                            增加空间
                        </button>

                        {isAddingSpace && (
                            <div className="w-48 animate-in fade-in slide-in-from-left-2 duration-200">
                                <select
                                    className="block w-full pl-3 pr-8 py-1.5 text-sm border-paper-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md"
                                    onChange={(e) => {
                                        if (e.target.value) handleSpaceSelect(e.target.value)
                                    }}
                                    defaultValue=""
                                    autoFocus
                                    onBlur={() => setIsAddingSpace(false)}
                                >
                                    <option value="" disabled>选择空间...</option>
                                    {availableSpaceOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
