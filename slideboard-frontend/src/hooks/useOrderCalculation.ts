import { useMemo } from 'react'

import {
    OrderFormData,
    calculateCategorySubtotal,
    calculatePackageUsage,
    calculatePackageAmount,
    calculateTotalUpgradeAmount,
    calculateTotalAmount,
    AVAILABLE_PACKAGES
} from '@/shared/types/order'

/**
 * 订单金额计算 Hook
 * 负责所有金额相关的计算逻辑
 */
export function useOrderCalculation(formData: OrderFormData) {
    return useMemo(() => {
        // 1. 计算非套餐商品的小计
        const subtotals = {
            curtain: calculateCategorySubtotal(formData.curtains),
            wallcovering: calculateCategorySubtotal(formData.wallcoverings),
            'background-wall': calculateCategorySubtotal(formData.backgroundWalls),
            'window-cushion': calculateCategorySubtotal(formData.windowCushions),
            'standard-product': calculateCategorySubtotal(formData.standardProducts)
        }

        // 2. 计算套餐相关金额
        let totalPackageAmount = 0
        let totalExcessAmount = 0
        let totalUpgradeAmount = 0

        // 获取所有涉及的空间 (目前仅窗帘支持套餐)
        const spaces = Array.from(new Set(formData.curtains.map(item => item.space || 'unassigned')))

        spaces.forEach(space => {
            const packageId = formData.spacePackages[space]
            if (packageId) {
                const packageDef = AVAILABLE_PACKAGES.find(p => p.id === packageId)
                if (packageDef) {
                    const spaceItems = formData.curtains.filter(item => (item.space || 'unassigned') === space)
                    const usage = calculatePackageUsage(spaceItems)
                    const { packageAmount, excessAmount } = calculatePackageAmount(packageDef, usage)
                    const upgradeAmount = calculateTotalUpgradeAmount(spaceItems, packageDef)

                    totalPackageAmount += packageAmount
                    totalExcessAmount += excessAmount
                    totalUpgradeAmount += upgradeAmount
                }
            }
        })

        // 3. 计算总金额
        const updatedData = {
            ...formData,
            subtotals,
            packageAmount: totalPackageAmount,
            packageExcessAmount: totalExcessAmount,
            upgradeAmount: totalUpgradeAmount,
            totalAmount: 0 // 临时值
        }
        const totalAmount = calculateTotalAmount(updatedData)

        return {
            subtotals,
            packageAmount: totalPackageAmount,
            packageExcessAmount: totalExcessAmount,
            upgradeAmount: totalUpgradeAmount,
            totalAmount
        }
    }, [formData])
}
