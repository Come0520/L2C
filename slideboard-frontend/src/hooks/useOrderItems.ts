import { useCallback } from 'react'

import { ProductCategory, CurtainItem, createEmptyItem } from '@/shared/types/order'

/**
 * 订单商品操作 Hook
 * 负责商品的增删改操作
 */
export function useOrderItems(
    _formData: any,
    setFormData: (updater: (prev: any) => any) => void
) {
    /**
     * 添加商品
     */
    const addItem = useCallback((category: ProductCategory, space: string) => {
        const newItem = createEmptyItem(category, space)
        const categoryKey = getCategoryKey(category)

        setFormData((prevData: any) => {
            const currentItems = prevData[categoryKey] as CurtainItem[]
            return {
                ...prevData,
                [categoryKey]: [...currentItems, newItem]
            }
        })
    }, [setFormData])

    /**
     * 更新商品
     */
    const updateItem = useCallback((
        category: ProductCategory,
        id: string,
        updates: Partial<CurtainItem>
    ) => {
        const categoryKey = getCategoryKey(category)

        setFormData((prevData: any) => {
            const items = prevData[categoryKey] as CurtainItem[]
            const newItems = items.map((item: CurtainItem) =>
                item.id === id ? { ...item, ...updates } : item
            )

            return {
                ...prevData,
                [categoryKey]: newItems
            }
        })
    }, [setFormData])

    /**
     * 删除商品
     */
    const deleteItem = useCallback((category: ProductCategory, id: string) => {
        const categoryKey = getCategoryKey(category)

        setFormData((prevData: any) => {
            const items = prevData[categoryKey] as CurtainItem[]
            const newItems = items.filter((item: CurtainItem) => item.id !== id)

            return {
                ...prevData,
                [categoryKey]: newItems
            }
        })
    }, [setFormData])

    return {
        addItem,
        updateItem,
        deleteItem
    }
}

// 辅助函数：获取类别对应的表单字段key
function getCategoryKey(category: ProductCategory): string {
    const keyMap: Record<ProductCategory, string> = {
        'curtain': 'curtains',
        'wallcovering': 'wallcoverings',
        'background-wall': 'backgroundWalls',
        'window-cushion': 'windowCushions',
        'standard-product': 'standardProducts'
    }
    return keyMap[category]
}
