'use client';

import { Box, Plus } from 'lucide-react'
import React from 'react'

import { PaperBadge, PaperStatus } from '@/components/ui/paper-badge'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table'

interface SpecialCraftsTabProps {
  // 可以根据需要添加属性
}

export const SpecialCraftsTab: React.FC<SpecialCraftsTabProps> = () => {
  return (
    <PaperCard>
      <PaperCardHeader>
        <div className="flex items-center justify-between">
          <PaperCardTitle>特殊工艺管理</PaperCardTitle>
          <PaperButton variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            新增工艺
          </PaperButton>
        </div>
      </PaperCardHeader>
      <PaperCardContent>
        <PaperTable>
          <PaperTableHeader>
            <PaperTableCell>工艺名称</PaperTableCell>
            <PaperTableCell>单价</PaperTableCell>
            <PaperTableCell>计价单位</PaperTableCell>
            <PaperTableCell>适用分类</PaperTableCell>
            <PaperTableCell>状态</PaperTableCell>
            <PaperTableCell>操作</PaperTableCell>
          </PaperTableHeader>
          <PaperTableBody>
            {/* 模拟数据 */}
            {
              [
                { id: '1', name: '打孔', price: 10, unit: '个', categories: ['窗帘'], status: 'active' },
                { id: '2', name: '绣花', price: 50, unit: '米', categories: ['窗帘', '墙布'], status: 'active' },
                { id: '3', name: '拼接', price: 30, unit: '米', categories: ['窗帘', '墙咔'], status: 'inactive' }
              ].map((craft) => (
                <PaperTableRow key={craft.id}>
                  <PaperTableCell>
                    <div className="flex items-center space-x-2">
                      <Box className="h-4 w-4" />
                      <span className="text-sm font-medium text-ink-800">{craft.name}</span>
                    </div>
                  </PaperTableCell>
                  <PaperTableCell>¥{craft.price.toLocaleString()}</PaperTableCell>
                  <PaperTableCell>{craft.unit}</PaperTableCell>
                  <PaperTableCell>
                    <div className="flex flex-wrap gap-2">
                      {craft.categories.map((category) => (
                        <PaperBadge key={category} variant="info">{category}</PaperBadge>
                      ))}
                    </div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <PaperStatus
                      status={craft.status === 'active' ? 'success' : 'warning'}
                      text={craft.status === 'active' ? '启用' : '停用'}
                    />
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className="flex space-x-2">
                      <PaperButton size="sm" variant="outline">编辑</PaperButton>
                      <PaperButton size="sm" variant="ghost">删除</PaperButton>
                    </div>
                  </PaperTableCell>
                </PaperTableRow>
              ))
            }
          </PaperTableBody>
        </PaperTable>
      </PaperCardContent>
    </PaperCard>
  )
}
