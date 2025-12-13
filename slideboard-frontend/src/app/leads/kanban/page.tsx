'use client'

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import type { DropResult, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import React, { useState, useEffect } from 'react'

import { PaperBadge } from '@/components/ui/paper-badge'
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card'
import { toast } from '@/components/ui/toast'
import { leadService } from '@/services/leads.client'
import { LeadItem } from '@/types/lead'


const columns = [
  { key: 'PENDING_ASSIGNMENT', title: '待分配' },
  { key: 'PENDING_FOLLOW_UP', title: '待跟踪' },
  { key: 'FOLLOWING_UP', title: '跟踪中' },
  { key: 'DRAFT_SIGNED', title: '草签' },
  { key: 'PENDING_MEASUREMENT', title: '待测量' },
  { key: 'MEASURING_PENDING_ASSIGNMENT', title: '测量中-待分配' },
  { key: 'MEASURING_ASSIGNING', title: '测量中-分配中' },
  { key: 'MEASURING_PENDING_VISIT', title: '测量中-待上门' },
  { key: 'MEASURING_PENDING_CONFIRMATION', title: '测量中-待确认' },
  { key: 'PLAN_PENDING_CONFIRMATION', title: '方案待确认' },
  { key: 'PENDING_PUSH', title: '待推单' },
  { key: 'PENDING_ORDER', title: '待下单' },
  { key: 'IN_PRODUCTION', title: '生产中' },
  { key: 'STOCK_PREPARED', title: '备货完成' },
  { key: 'PENDING_SHIPMENT', title: '待发货' },
  { key: 'EXPIRED', title: '已失效' },
  { key: 'CANCELLED', title: '已取消' },
]

export default function LeadsKanbanPage() {
  const queryClient = useQueryClient()
  const [localData, setLocalData] = useState<Record<string, LeadItem[]>>({})

  // 获取数据
  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads-kanban'],
    queryFn: leadService.getLeadsForKanban
  })

  useEffect(() => {
    if (leadsData) {
      // 初始化本地状态
      const grouped = columns.reduce((acc, col) => {
        acc[col.key] = leadsData.filter((l: LeadItem) => l.status === col.key)
        return acc
      }, {} as Record<string, LeadItem[]>)
      setLocalData(grouped)
    }
  }, [leadsData])

  // 更新状态 Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => leadService.updateLeadStatus(id, status),
    onMutate: async ({ id, status }) => {
      // 乐观更新
      await queryClient.cancelQueries({ queryKey: ['leads-kanban'] })
      const previousLeads = queryClient.getQueryData<LeadItem[]>(['leads-kanban'])

      if (previousLeads) {
        queryClient.setQueryData<LeadItem[]>(['leads-kanban'], old =>
          (old || []).map(l => l.id === id ? { ...l, status: status as LeadItem['status'] } : l)
        )
      }
      return { previousLeads }
    },
    onError: (_err, _newTodo, context) => {
      // 回滚
      if (context?.previousLeads) {
        queryClient.setQueryData(['leads-kanban'], context.previousLeads)
        // 重新计算本地状态
        const grouped = columns.reduce((acc, col) => {
          acc[col.key] = context.previousLeads!.filter(l => l.status === col.key)
          return acc
        }, {} as Record<string, LeadItem[]>)
        setLocalData(grouped)
      }
      toast.error('更新状态失败，请重试')
    },
    onSettled: () => {
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

  if (isLoading) {
    return <div>加载中...</div>
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
