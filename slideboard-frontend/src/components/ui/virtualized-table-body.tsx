'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import React, { useRef } from 'react'

interface VirtualizedTableBodyProps<T> {
    items: T[]
    renderRow: (item: T, index: number) => React.ReactNode
    estimatedRowHeight?: number
    overscan?: number
    containerHeight?: number
}

/**
 * 虚拟化表格 Body 组件
 * 用于优化大量数据的表格渲染性能
 */
export function VirtualizedTableBody<T extends { id: string }>({
    items,
    renderRow,
    estimatedRowHeight = 60,
    overscan = 5,
    containerHeight = 600
}: VirtualizedTableBodyProps<T>) {
    const parentRef = useRef<HTMLTableSectionElement>(null)

    const rowVirtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => estimatedRowHeight,
        overscan,
    })

    return (
        <tbody ref={parentRef} style={{ display: 'block', height: containerHeight, overflow: 'auto' }}>
            <tr style={{ display: 'block', height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
                <td style={{ display: 'block' }}>
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const item = items[virtualRow.index]
                        if (!item) return null

                        return (
                            <div
                                key={item.id}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                            >
                                <table style={{ width: '100%', tableLayout: 'fixed' }}>
                                    <tbody>
                                        {renderRow(item, virtualRow.index)}
                                    </tbody>
                                </table>
                            </div>
                        )
                    })}
                </td>
            </tr>
        </tbody>
    )
}
