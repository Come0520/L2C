'use client'

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import type { DropResult, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import React, { useState, useEffect } from 'react'

import { PaperBadge } from '@/components/ui/paper-badge'
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card'
import { toast } from '@/components/ui/toast'
import { LeadItem } from '@/types/lead'

// 看板列配置
import { columns } from '../constants'

export interface KanbanContentProps {
  initialData: LeadItem[]
}

// 客户端看板内容组件
export default function KanbanContent({ initialData }: KanbanContentProps) {
  const queryClient = useQueryClient()
  const [localData, setLocalData] = useState<Record<string, LeadItem[]>>({})

  // 初始化本地状态
  useEffect(() => {
    if (initialData) {
      const grouped = columns.reduce((acc, col) => {
        acc[col.key] = initialData.filter((l: LeadItem) => l.status === col.key)
        return acc
      }, {} as Record<string, LeadItem[]>)
      setLocalData(grouped)
    }
  }, [initialData])

  // 更新状态 Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => {
      // 在真实应用中，这里应该调用API更新状态
      console.log('Update lead status:', id, status)
      return Promise.resolve()
    },
    onMutate: async ({ id, status }) => {
      // 乐观更新
      console.log('Mutate lead status:', id, status)
    },
    onError: (_err, _newTodo, _context) => {
      // 回滚逻辑
      toast.error('更新状态失败，请重试')
    },
    onSettled: () => {
      // 刷新数据
      queryClient.invalidateQueries({ queryKey: ['leads-kanban'] })
    }
  })

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result

    // 拖拽到无效位置
    if (!destination) return

    // 拖拽到原地
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return
    }

    // 更新本地状态
    const sourceCol = source.droppableId
    const destCol = destination.droppableId

    // 找到被拖拽的项
    const sourceItems = [...(localData[sourceCol] || [])]
    const destItems = sourceCol === destCol ? sourceItems : [...(localData[destCol] || [])]

    const [movedItem] = sourceItems.splice(source.index, 1)

    if (!movedItem) return

    // 更新项的状态
    const updatedItem = { ...movedItem, status: destCol as LeadItem['status'] }

    if (sourceCol === destCol) {
      sourceItems.splice(destination.index, 0, updatedItem)
      setLocalData({
        ...localData,
        [sourceCol]: sourceItems
      })
    } else {
      destItems.splice(destination.index, 0, updatedItem)
      setLocalData({
        ...localData,
        [sourceCol]: sourceItems,
        [destCol]: destItems
      })
    }

    // 发送请求
    updateStatusMutation.mutate({ id: draggableId, status: destCol })
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto">
          <div className="flex h-full p-4 space-x-4 min-w-max">
            {columns.map(col => (
              <div key={col.key} className="w-80 flex flex-col bg-paper-100 rounded-lg border border-paper-300">
                <div className="p-3 font-medium text-ink-700 border-b border-paper-200 flex justify-between items-center bg-white rounded-t-lg">
                  <span>{col.title}</span>
                  <PaperBadge variant="default">
                    {localData[col.key]?.length || 0}
                  </PaperBadge>
                </div>
                <Droppable droppableId={col.key}>
                  {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 overflow-y-auto space-y-2 transition-colors ${snapshot.isDraggingOver ? 'bg-primary-50' : ''
                        }`}
                    >
                      {localData[col.key]?.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={provided.draggableProps.style}
                            >
                              <PaperCard className={`hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary-500 rotate-2' : ''
                                }`}>
                                <PaperCardContent className="p-3 space-y-2">
                                  <div className="font-medium text-ink-900">{item.customerName}</div>
                                  <div className="text-sm text-ink-500 flex justify-between">
                                    <span>{item.phone}</span>
                                    <span>{item.currentOwner?.name || ''}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {item.customerLevel && (
                                      <PaperBadge variant="outline" size="sm">{item.customerLevel}级</PaperBadge>
                                    )}
                                    {item.businessTags && item.businessTags.map((tag, i) => (
                                      <PaperBadge key={i} variant="outline" size="sm">{tag}</PaperBadge>
                                    ))}
                                  </div>
                                </PaperCardContent>
                              </PaperCard>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  )
}