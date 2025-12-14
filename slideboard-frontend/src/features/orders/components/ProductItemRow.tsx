'use client'

import { Trash2, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import React, { useState, useEffect } from 'react'

import { MOCK_PRODUCTS, ProductDefinition } from '@/constants/products'
import {
    CurtainItem,
    PackageDefinition,
    PackageItemType,
    PACKAGE_ITEM_TYPE_LABELS,
    calculateItemAmount,
    calculateUsage,
    calculateUpgradeAmount
} from '@/shared/types/order'

interface ProductItemRowProps {
    item: CurtainItem
    selectedPackage?: PackageDefinition
    onUpdate: (id: string, updates: Partial<CurtainItem>) => void
    onDelete: (id: string) => void
}

export const ProductItemRow: React.FC<ProductItemRowProps> = ({
    item,
    selectedPackage,
    onUpdate,
    onDelete
}) => {
    // 简单的搜索状态
    const [searchTerm, setSearchTerm] = useState(item.product)
    const [showSuggestions, setShowSuggestions] = useState(false)

    // 当外部更新 item.product 时同步搜索词
    useEffect(() => {
        setSearchTerm(item.product)
    }, [item.product])

    // 处理字段变化
    const handleFieldChange = (field: 'width' | 'height' | 'quantity', value: number) => {
        const updates: Partial<CurtainItem> = { [field]: value }
        let newItem = { ...item, ...updates }

        // 自动计算数量逻辑
        if (field === 'width' || field === 'height') {
            const width = field === 'width' ? value : item.width
            // const height = field === 'height' ? value : item.height

            // 默认计算规则：
            // 布/纱: 数量 = 宽 * 2 (2倍褶皱)
            // 轨道: 数量 = 宽
            // 只有当数量为0或者用户未手动修改过数量时才自动计算 (这里简化为总是自动计算，除非用户手动改了数量)
            // 为了简单，我们假设只要改了宽，就重置数量计算
            if (item.packageType === 'track') {
                updates.quantity = width
            } else {
                updates.quantity = width * 2
            }
            newItem = { ...newItem, ...updates }
        }

        // 计算用量（仅套餐品需要）
        if (newItem.isPackageItem) {
            updates.usageAmount = calculateUsage(newItem)
        }

        // 如果是套餐品且有套餐，计算升级补差价
        if (newItem.isPackageItem && selectedPackage) {
            const { priceDifference, differenceAmount } = calculateUpgradeAmount(newItem, selectedPackage)
            updates.priceDifference = priceDifference
            updates.differenceAmount = differenceAmount
        }

        // 如果不是套餐品，计算常规金额
        if (!newItem.isPackageItem) {
            updates.amount = calculateItemAmount(newItem)
        }

        onUpdate(item.id, updates)
    }

    // 处理产品选择
    const handleSelectProduct = (product: ProductDefinition) => {
        setSearchTerm(product.name)
        setShowSuggestions(false)

        const updates: Partial<CurtainItem> = {
            product: product.name,
            imageUrl: product.imageUrl,
            unit: product.unit,
            unitPrice: product.price,
            packageTag: product.packageTag
        }

        // 自动判断是否为套餐品
        if (product.packageTag && selectedPackage) {
            updates.isPackageItem = true
            // 映射类型
            if (product.type !== 'accessory') {
                updates.packageType = product.type as PackageItemType
            }
        } else {
            updates.isPackageItem = false
            updates.packageTag = undefined
        }

        // 触发更新
        const newItem = { ...item, ...updates }

        // 重新计算金额等
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

    // 过滤建议列表
    const suggestions = MOCK_PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="grid grid-cols-12 gap-2 items-center py-2 border-b border-paper-200 text-sm relative group">
            {/* 产品搜索 (3列) */}
            <div className="col-span-3 relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="paper-input w-full h-8 text-sm"
                    placeholder="搜索产品..."
                />
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-paper-300 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                        {suggestions.map(p => (
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

            {/* 图片 (1列) */}
            <div className="col-span-1 flex justify-center">
                <div className="w-8 h-8 bg-paper-200 rounded flex items-center justify-center text-ink-400 overflow-hidden">
                    {item.imageUrl ? (
                        <Image
                            src={item.imageUrl}
                            alt="商品"
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <ImageIcon className="h-4 w-4" />
                    )}
                </div>
            </div>

            {/* 类型 (1列) */}
            <div className="col-span-1 text-center text-ink-600">
                {item.packageType ? PACKAGE_ITEM_TYPE_LABELS[item.packageType] : '-'}
            </div>

            {/* 宽度 (1列) */}
            <div className="col-span-1">
                <input
                    type="number"
                    value={item.width || ''}
                    onChange={(e) => handleFieldChange('width', parseFloat(e.target.value) || 0)}
                    className="paper-input w-full h-8 text-right px-1"
                    placeholder="0"
                />
            </div>

            {/* 高度 (1列) */}
            <div className="col-span-1">
                <input
                    type="number"
                    value={item.height || ''}
                    onChange={(e) => handleFieldChange('height', parseFloat(e.target.value) || 0)}
                    className="paper-input w-full h-8 text-right px-1"
                    placeholder="0"
                />
            </div>

            {/* 数量 (1列) */}
            <div className="col-span-1">
                <input
                    type="number"
                    value={item.quantity || ''}
                    onChange={(e) => handleFieldChange('quantity', parseFloat(e.target.value) || 0)}
                    className="paper-input w-full h-8 text-right px-1 font-medium bg-paper-50"
                    placeholder="0"
                />
            </div>

            {/* 单位 (0.5列 -> 1列) */}
            <div className="col-span-1 text-center text-ink-500">
                {item.unit}
            </div>

            {/* 单价 (1列) */}
            <div className="col-span-1 text-right text-ink-600">
                {item.unitPrice}
            </div>

            {/* 金额 (2列) */}
            <div className="col-span-2 text-right font-medium">
                {item.isPackageItem ? (
                    <div className="flex flex-col items-end leading-none">
                        <span className="text-success-600 text-xs">套餐品</span>
                        {item.priceDifference && item.priceDifference > 0 ? (
                            <span className="text-[10px] text-warning-600 mt-0.5">
                                +¥{item.differenceAmount?.toFixed(0)}
                            </span>
                        ) : null}
                    </div>
                ) : (
                    <span>¥{item.amount.toFixed(0)}</span>
                )}
            </div>

            {/* 删除操作 */}
            <button
                type="button"
                aria-label="删除"
                onClick={() => onDelete(item.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-error-600 hover:text-error-700"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    )
}
