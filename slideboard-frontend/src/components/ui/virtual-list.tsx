'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import React, { useRef } from 'react'

export function VirtualList<T extends { id: string }>({
  items,
  renderItem,
  itemHeight = 80,
  containerHeight = 400,
  overscan = 2,
  className = ''
}: {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  itemHeight?: number
  containerHeight?: number
  overscan?: number
  className?: string
}) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
  })

  return (
    <div
      ref={parentRef}
      className={`overflow-y-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {items[virtualRow.index] !== undefined && renderItem(items[virtualRow.index] as T, virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  )
}
