import React from 'react'

import { PaperStatus } from '@/components/ui/paper-badge'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table'

interface ApprovalsTabProps {
  // 可以根据需要添加属性
}

export const ApprovalsTab: React.FC<ApprovalsTabProps> = () => {
  return (
    <PaperCard>
      <PaperCardHeader>
        <PaperCardTitle>审批管理</PaperCardTitle>
      </PaperCardHeader>
      <PaperCardContent>
        <PaperTable>
          <PaperTableHeader>
            <PaperTableCell>产品信息</PaperTableCell>
            <PaperTableCell>提交人</PaperTableCell>
            <PaperTableCell>提交时间</PaperTableCell>
            <PaperTableCell>状态</PaperTableCell>
            <PaperTableCell>操作</PaperTableCell>
          </PaperTableHeader>
          <PaperTableBody>
            {/* 模拟数据 */}
            {
              [
                {
                  id: '1',
                  productCode: 'CL-GD-001',
                  productName: '静音轨道',
                  submitter: '张三',
                  submitTime: '2024-01-17 14:30',
                  status: 'pending'
                },
                {
                  id: '2',
                  productCode: 'QB-BD-002',
                  productName: '提花墙布',
                  submitter: '李四',
                  submitTime: '2024-01-16 09:15',
                  status: 'approved'
                },
                {
                  id: '3',
                  productCode: 'QKD-XB-001',
                  productName: '小板墙咔',
                  submitter: '王五',
                  submitTime: '2024-01-15 16:45',
                  status: 'rejected'
                }
              ].map((record) => (
                <PaperTableRow key={record.id}>
                  <PaperTableCell>
                    <div>
                      <p className="font-medium text-ink-800">{record.productName}</p>
                      <p className="text-sm text-ink-500">编码: {record.productCode}</p>
                    </div>
                  </PaperTableCell>
                  <PaperTableCell>{record.submitter}</PaperTableCell>
                  <PaperTableCell>{record.submitTime}</PaperTableCell>
                  <PaperTableCell>
                    <PaperStatus
                      status={
                        record.status === 'pending' ? 'warning' :
                          record.status === 'approved' ? 'success' : 'error'
                      }
                      text={
                        record.status === 'pending' ? '待审核' :
                          record.status === 'approved' ? '已通过' : '已驳回'
                      }
                    />
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className="flex space-x-2">
                      <PaperButton size="sm" variant="outline">查看详情</PaperButton>
                      {record.status === 'pending' && (
                        <>
                          <PaperButton size="sm" variant="success">通过</PaperButton>
                          <PaperButton size="sm" variant="error">驳回</PaperButton>
                        </>
                      )}
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
