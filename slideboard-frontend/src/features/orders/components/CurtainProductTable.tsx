'use client'

import { Plus, Trash2, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import React, { useState } from 'react'

import { MOCK_PRODUCTS, ProductDefinition } from '@/constants/products'
import {
    CurtainItem,
    PackageDefinition,
    PackageItemType,
    SPACE_OPTIONS,
    PACKAGE_ITEM_TYPE_LABELS,
    calculateUsage,
    calculateItemAmount,
    calculateUpgradeAmount
} from '@/shared/types/order'

interface CurtainProductTableProps {
    items: CurtainItem[]
    selectedPackage?: PackageDefinition
    onAddItem: () => void
    onUpdateItem: (id: string, updates: Partial<CurtainItem>) => void
    onDeleteItem: (id: string) => void
    hideSpaceColumn?: boolean
}

export const CurtainProductTable: React.FC<CurtainProductTableProps> = ({
    items,
    selectedPackage,
    onAddItem,
    onUpdateItem,
    onDeleteItem,
    hideSpaceColumn = false
}) => {
    // 计算总小计
    const subtotal = items.reduce((sum, item) => {
        if (item.isPackageItem && item.differenceAmount) {
            return sum + item.differenceAmount
        }
        return sum + (item.amount || 0)
    }, 0)

    return (
        <div className="bg-white rounded-lg border border-paper-300 shadow-sm overflow-hidden border-0 shadow-none rounded-none">
            {/* 表头 */}
            <div className="bg-paper-50 border-b border-paper-200">
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-ink-500">
                    {!hideSpaceColumn && <div className="col-span-1">空间</div>}
                    <div className={hideSpaceColumn ? "col-span-3" : "col-span-2"}>商品</div>
                    <div className="col-span-1 text-center">图片</div>
                    <div className="col-span-1 text-center">类型</div>
                    <div className="col-span-1 text-center">宽度</div>
                    <div className="col-span-1 text-center">高度</div>
                    <div className="col-span-1 text-center">数量</div>
                    <div className="col-span-1 text-center">单位</div>
                    <div className="col-span-1 text-right">单价</div>
                    <div className="col-span-2 text-right">金额</div>
                </div>
            </div>

            {/* 商品列表 */}
            <div className="divide-y divide-paper-200">
                {items.map(item => (
                    <ProductRow
                        key={item.id}
                        item={item}
                        selectedPackage={selectedPackage}
                        onUpdate={onUpdateItem}
                        onDelete={onDeleteItem}
                        hideSpaceColumn={hideSpaceColumn}
                    />
                ))}
            </div>

            {/* 添加按钮和小计 */}
            <div className="border-t border-paper-200 bg-paper-50">
                <div className="px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={onAddItem}
                        className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        增加商品
                    </button>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-ink-600">小计:</span>
                        <span className="text-xl font-bold text-ink-900">
                            ¥{subtotal.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// 商品行组件
interface ProductRowProps {
    item: CurtainItem
    selectedPackage?: PackageDefinition
    onUpdate: (id: string, updates: Partial<CurtainItem>) => void
    onDelete: (id: string) => void
    hideSpaceColumn?: boolean
}

const ProductRow: React.FC<ProductRowProps> = ({
    item,
    selectedPackage,
    onUpdate,
    onDelete,
    hideSpaceColumn = false
}) => {
    const [searchTerm, setSearchTerm] = useState(item.product)
    const [showProductSuggestions, setShowProductSuggestions] = useState(false)

    // 处理字段变化
    const handleFieldChange = <K extends keyof CurtainItem>(field: K, value: CurtainItem[K]) => {
        const updates: Partial<CurtainItem> = { [field]: value }
        let newItem = { ...item, ...updates }

        // 宽度或高度变化时，自动计算数量
        if (field === 'width' || field === 'height') {
            const width = field === 'width' ? Number((value as number) || 0) : (item.width || 0)

            // 根据类型自动计算数量
            if (newItem.packageType === 'track') {
                updates.quantity = width
            } else if (newItem.packageType === 'cloth' || newItem.packageType === 'gauze') {
                updates.quantity = width * 2 // 2倍褶皱
            } else {
                // 非套餐品，默认也使用2倍计算
                updates.quantity = width * 2
            }
            newItem = { ...newItem, ...updates }
        }

        // 计算用量
        if (newItem.isPackageItem) {
            updates.usageAmount = calculateUsage(newItem)
            // 计算升级补差价
            if (selectedPackage) {
                const { priceDifference, differenceAmount } = calculateUpgradeAmount(newItem, selectedPackage)
                updates.priceDifference = priceDifference
                updates.differenceAmount = differenceAmount
            }
        } else {
            // 非套餐品，计算常规金额
            updates.amount = calculateItemAmount(newItem)
        }

        onUpdate(item.id, updates)
    }

    // 处理产品选择
    const handleSelectProduct = (product: ProductDefinition) => {
        setSearchTerm(product.name)
        setShowProductSuggestions(false)

        const updates: Partial<CurtainItem> = {
            product: product.name,
            imageUrl: product.imageUrl,
            unit: product.unit,
            unitPrice: product.price,
            packageTag: product.packageTag
        }

        // 判断是否为套餐品
        if (product.packageTag && selectedPackage) {
            updates.isPackageItem = true
            if (product.type !== 'accessory') {
                updates.packageType = product.type as unknown as PackageItemType
            }
        } else {
            updates.isPackageItem = false
        }

        const newItem = { ...item, ...updates }

        // 重新计算
        if (newItem.isPackageItem) {
            updates.usageAmount = calculateUsage(newItem)
            if (selectedPackage) {
                const { priceDifference, differenceAmount } = calculateUpgradeAmount(newItem, selectedPackage)
                updates.priceDifference = priceDifference
                updates.differenceAmount = differenceAmount
            }
        } else {
            updates.amount = calculateItemAmount(newItem)
        }

        onUpdate(item.id, updates)
    }

    // 过滤产品建议
    const productSuggestions = MOCK_PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-sm hover:bg-paper-50 transition-colors group relative items-center">
            {/* 空间 */}
            {!hideSpaceColumn && (
                <div className="col-span-1">
                    <select
                        value={item.space || ''}
                        onChange={(e) => handleFieldChange('space', e.target.value)}
                        className="paper-input w-full h-9 text-sm"
                    >
                        <option value="">选择空间</option>
                        {SPACE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* 商品搜索 */}
            <div className={hideSpaceColumn ? "col-span-3 relative" : "col-span-2 relative"}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setShowProductSuggestions(true)
                    }}
                    onFocus={() => setShowProductSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
                    className="paper-input w-full h-9 text-sm"
                    placeholder="搜索商品..."
                />
                {showProductSuggestions && productSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-paper-300 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                        {productSuggestions.map(p => (
                            <div
                                key={p.id}
                                className="px-3 py-2 hover:bg-paper-100 cursor-pointer flex justify-between items-center"
                                onMouseDown={() => handleSelectProduct(p)}
                            >
                                <span>{p.name}</span>
                                <span className="text-xs text-ink-400">¥{p.price}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 图片 */}
            <div className="col-span-1 flex justify-center items-center">
                <div className="w-9 h-9 bg-paper-200 rounded flex items-center justify-center text-ink-400 overflow-hidden">
                    {item.imageUrl ? (
                        <Image
                            src={item.imageUrl}
                            alt="商品"
                            width={36}
                            height={36}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <ImageIcon className="h-4 w-4" />
                    )}
                </div>
            </div>

            {/* 类型 */}
            <div className="col-span-1 flex items-center justify-center text-ink-600">
                {item.packageType ? PACKAGE_ITEM_TYPE_LABELS[item.packageType] : '-'}
            </div>

            {/* 宽度 */}
            <div className="col-span-1">
                <input
                    type="number"
                    value={item.width || ''}
                    onChange={(e) => handleFieldChange('width', parseFloat(e.target.value) || 0)}
                    className="paper-input w-full h-9 text-right text-sm"
                    placeholder="0"
                    step="0.1"
                />
            </div>

            {/* 高度 */}
            <div className="col-span-1">
                <input
                    type="number"
                    value={item.height || ''}
                    onChange={(e) => handleFieldChange('height', parseFloat(e.target.value) || 0)}
                    className="paper-input w-full h-9 text-right text-sm"
                    placeholder="0"
                    step="0.1"
                />
            </div>

            {/* 数量 */}
            <div className="col-span-1">
                <input
                    type="number"
                    value={item.quantity || ''}
                    onChange={(e) => handleFieldChange('quantity', parseFloat(e.target.value) || 0)}
                    className="paper-input w-full h-9 text-right text-sm bg-primary-50 font-medium"
                    placeholder="0"
                    step="0.1"
                />
            </div>

            {/* 单位 */}
            <div className="col-span-1 flex items-center justify-center text-ink-500">
                {item.unit || '米'}
            </div>

            {/* 单价 */}
            <div className="col-span-1 flex items-center justify-end text-ink-600">
                ¥{item.unitPrice || 0}
            </div>

            {/* 金额 */}
            <div className="col-span-2 flex items-center justify-end font-medium">
                {item.isPackageItem ? (
                    <div className="flex flex-col items-end leading-tight">
                        <span className="text-success-600 text-xs">套餐品</span>
                        {item.priceDifference && item.priceDifference > 0 ? (
                            <span className="text-warning-600 text-sm">
                                +¥{item.differenceAmount?.toFixed(2)}
                            </span>
                        ) : (
                            <span className="text-ink-400 text-xs">无补差</span>
                        )}
                    </div>
                ) : (
                    <span className="text-ink-900">¥{(item.amount || 0).toFixed(2)}</span>
                )}
            </div>

            {/* 删除按钮 */}
            <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-error-600 hover:text-error-700"
                aria-label="删除"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    )
}
