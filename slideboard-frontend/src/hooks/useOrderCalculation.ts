import { useMemo } from 'react'

import { CurtainItem, OrderFormData, calculateCategorySubtotal, calculatePackageAmount, calculatePackageUsage, calculateTotalAmount, calculateTotalUpgradeAmount, AVAILABLE_PACKAGES } from '@/shared/types/order'

/**
 * 订单金额计算 Hook
 * 负责所有金额相关的计算逻辑
 */
export function useOrderCalculation(formData: OrderFormData) {
    const {
        curtains,
        wallcoverings,
        backgroundWalls,
        windowCushions,
        standardProducts,
        spacePackages
    } = formData

    return useMemo(() => {
        // 1. 计算非套餐商品的小计
        const subtotals = {
            curtain: calculateCategorySubtotal((curtains || []) as CurtainItem[]),
            wallcovering: calculateCategorySubtotal((wallcoverings || []) as CurtainItem[]),
            'background-wall': calculateCategorySubtotal((backgroundWalls || []) as CurtainItem[]),
            'window-cushion': calculateCategorySubtotal((windowCushions || []) as CurtainItem[]),
            'standard-product': calculateCategorySubtotal((standardProducts || []) as CurtainItem[])
        }

        // 2. 计算套餐相关金额
        let totalPackageAmount = 0
        let totalExcessAmount = 0
        let totalUpgradeAmount = 0

        // 获取所有涉及的空间 (目前仅窗帘支持套餐)
        const spaces = Array.from(new Set((curtains || []).map(item => item.space || 'unassigned')))

        spaces.forEach(space => {
            const packageId = spacePackages[space]
            if (packageId) {
                const packageDef = AVAILABLE_PACKAGES.find(p => p.id === packageId)
                if (packageDef) {
                    const spaceItems = (curtains || []).filter(item => (item.space || 'unassigned') === space) as CurtainItem[]
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
        // 构造一个包含必要计算字段的对象传给 calculateTotalAmount
        // 我们不需要完整的 formData，只需要 calculateTotalAmount 用到的字段
        const calculationContext = {
            subtotals,
            packageAmount: totalPackageAmount,
            packageExcessAmount: totalExcessAmount,
            upgradeAmount: totalUpgradeAmount,
        } as OrderFormData

        const totalAmount = calculateTotalAmount(calculationContext)

        return {
            subtotals,
            packageAmount: totalPackageAmount,
            packageExcessAmount: totalExcessAmount,
            upgradeAmount: totalUpgradeAmount,
            totalAmount
        }
    }, [
        curtains,
        wallcoverings,
        backgroundWalls,
        windowCushions,
        standardProducts,
        spacePackages
    ])
}
