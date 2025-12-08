'use client'

import React, { useState, useCallback } from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { CurtainPackageSelector } from '@/features/orders/components/curtain-package-selector'
import { CurtainProductTable } from '@/features/orders/components/curtain-product-table'
import {
    CurtainItem,
    PackageDefinition,
    AVAILABLE_PACKAGES,
    createEmptyItem
} from '@/shared/types/order'

export default function CurtainModulePage() {
    // 选中的套餐
    const [selectedPackage, setSelectedPackage] = useState<PackageDefinition | undefined>()

    // 商品列表
    const [items, setItems] = useState<CurtainItem[]>([])

    // 处理套餐变更
    const handlePackageChange = useCallback((packageId: string) => {
        const pkg = AVAILABLE_PACKAGES.find(p => p.id === packageId)
        setSelectedPackage(pkg)

        // 更新所有商品的套餐状态
        setItems(prevItems => prevItems.map(item => {
            if (packageId && item.packageTag) {
                // 有套餐且商品有标签，标记为套餐品
                return {
                    ...item,
                    isPackageItem: true,
                    packageType: item.packageType || 'cloth'
                }
            } else {
                // 无套餐，取消套餐品标记
                return {
                    ...item,
                    isPackageItem: false
                }
            }
        }))
    }, [])

    // 添加商品
    const handleAddItem = useCallback(() => {
        const newItem = createEmptyItem('curtain', '')
        setItems(prev => [...prev, newItem])
    }, [])

    // 更新商品
    const handleUpdateItem = useCallback((id: string, updates: Partial<CurtainItem>) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, ...updates } : item
        ))
    }, [])

    // 删除商品
    const handleDeleteItem = useCallback((id: string) => {
        setItems(prev => prev.filter(item => item.id !== id))
    }, [])

    return (
        <DashboardLayout>
            <div className="p-6 max-w-[1600px] mx-auto space-y-6">
                {/* 页面标题 */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-ink-800">窗帘模块</h1>
                        <p className="text-ink-500 mt-1">窗帘商品管理与套餐配置</p>
                    </div>
                </div>

                {/* 套餐选择区域 */}
                <CurtainPackageSelector
                    selectedPackage={selectedPackage}
                    onPackageChange={handlePackageChange}
                />

                {/* 商品表格 */}
                <CurtainProductTable
                    items={items}
                    selectedPackage={selectedPackage}
                    onAddItem={handleAddItem}
                    onUpdateItem={handleUpdateItem}
                    onDeleteItem={handleDeleteItem}
                />
            </div>
        </DashboardLayout>
    )
}
