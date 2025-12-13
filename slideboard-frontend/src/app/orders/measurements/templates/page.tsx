'use client'

import Link from 'next/link'
import React, { useState } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table'
import { toast } from '@/components/ui/toast'
import { useMeasurementTemplates } from '@/hooks/useMeasurementTemplates'

/**
 * 测量模板列表页面
 */
export default function MeasurementTemplatesPage() {
  const { templates, isLoadingTemplates, deleteTemplate, isDeletingTemplate } = useMeasurementTemplates()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  /**
   * 处理删除模板
   */
  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个模板吗？')) {
      setDeletingId(id)
      try {
        await deleteTemplate(id)
        toast.success('模板删除成功')
      } catch (error) {
        toast.error((error as Error).message || '模板删除失败')
      } finally {
        setDeletingId(null)
      }
    }
  }

  return (
      <div className="p-6 max-w-7xl mx-auto">
        {/* 页面头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">测量模板管理</h1>
            <p className="text-ink-500 mt-1">管理和维护测量模板，提高测量单创建效率</p>
          </div>
          <Link href="/orders/measurements/templates/create">
            <PaperButton variant="primary">创建模板</PaperButton>
          </Link>
        </div>

        {/* 模板列表 */}
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>测量模板列表</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            {isLoadingTemplates ? (
              <div className="text-center py-10">加载中...</div>
            ) : templates && templates.length > 0 ? (
              <PaperTable>
                <PaperTableHeader>
                  <PaperTableRow>
                    <PaperTableCell>模板名称</PaperTableCell>
                    <PaperTableCell>描述</PaperTableCell>
                    <PaperTableCell>房间数量</PaperTableCell>
                    <PaperTableCell>总面积</PaperTableCell>
                    <PaperTableCell>默认模板</PaperTableCell>
                    <PaperTableCell>创建时间</PaperTableCell>
                    <PaperTableCell>操作</PaperTableCell>
                  </PaperTableRow>
                </PaperTableHeader>
                <PaperTableBody>
                  {templates.map((template) => (
                    <PaperTableRow key={template.id}>
                      <PaperTableCell className="font-medium">{template.name}</PaperTableCell>
                      <PaperTableCell>{template.description}</PaperTableCell>
                      <PaperTableCell>{template.rooms.length}</PaperTableCell>
                      <PaperTableCell>{template.totalArea.toFixed(2)} m²</PaperTableCell>
                      <PaperTableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${template.isDefault ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {template.isDefault ? '是' : '否'}
                        </span>
                      </PaperTableCell>
                      <PaperTableCell>{new Date(template.createdAt).toLocaleString('zh-CN')}</PaperTableCell>
                      <PaperTableCell>
                        <div className="flex space-x-2">
                          <Link href={`/orders/measurements/templates/${template.id}/edit`}>
                            <PaperButton variant="outline" size="small">编辑</PaperButton>
                          </Link>
                          <PaperButton 
                            variant="outline"
                            size="small"
                            onClick={() => handleDelete(template.id)}
                            disabled={isDeletingTemplate && deletingId === template.id}
                          >
                            {isDeletingTemplate && deletingId === template.id ? '删除中...' : '删除'}
                          </PaperButton>
                        </div>
                      </PaperTableCell>
                    </PaperTableRow>
                  ))}
                </PaperTableBody>
              </PaperTable>
            ) : (
              <div className="text-center py-10 text-ink-500">
                <p>暂无测量模板</p>
                <Link href="/orders/measurements/templates/create" className="text-blue-600 hover:underline mt-2 inline-block">
                  立即创建第一个模板
                </Link>
              </div>
            )}
          </PaperCardContent>
        </PaperCard>
      </div>
  )
}
