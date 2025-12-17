import { useQueryClient } from '@tanstack/react-query'
import React, { useEffect, useState } from 'react'

import { toast } from '@/components/ui/toast'
import { leadService } from '@/services/leads.client'

import { LeadDuplicateGroup } from '@/shared/types/lead'

interface LeadDedupeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const LeadDedupeDialog: React.FC<LeadDedupeDialogProps> = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient()
  const [duplicateGroups, setDuplicateGroups] = useState<LeadDuplicateGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [merging, setMerging] = useState<number | null>(null)

  useEffect(() => {
    if (open) {
      fetchDuplicateGroups()
    }
  }, [open])

  const fetchDuplicateGroups = async () => {
    setLoading(true)
    try {
      const groups = await leadService.findDuplicateGroups(100)
      console.log('Duplicate groups:', groups)
      setDuplicateGroups(groups)
    } catch (error) {
      console.error('Failed to fetch duplicate groups:', error)
      toast.error('获取重复线索失败')
    } finally {
      setLoading(false)
    }
  }

  const handleMerge = async (groupIndex: number) => {
    const group = duplicateGroups[groupIndex]
    if (!group || !group.lead_details || group.lead_details.length < 2) return

    setMerging(groupIndex)

    try {
      // 获取选中的主线索ID
      const radios = document.getElementsByName(`primary-${groupIndex}`)
      let primaryId: number | null = null

      for (const r of Array.from(radios)) {
        const el = r as HTMLInputElement
        if (el.checked) {
          primaryId = parseInt(el.value)
          break
        }
      }

      if (!primaryId) {
        toast.error('请选择保留的主线索')
        return
      }

      // 获取要合并的重复线索ID
      const duplicateIds = group.lead_details
        .map(lead => lead.id)
        .filter(id => id !== primaryId)

      if (duplicateIds.length === 0) {
        toast.warning('没有需要合并的重复线索')
        return
      }

      // 执行合并
      await leadService.mergeLeads(primaryId, duplicateIds, `合并重复线索: ${group.phone}`)

      toast.success(`成功合并 ${duplicateIds.length} 条重复线索`)

      // 刷新数据
      await fetchDuplicateGroups()
      queryClient.invalidateQueries({ queryKey: ['leads'] })

    } catch (error: any) {
      console.error('合并失败:', error)
      toast.error(error.message || '合并失败，请重试')
    } finally {
      setMerging(null)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => onOpenChange(false)}>
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-semibold mb-2">线索去重与合并</div>
        <div className="text-sm text-ink-600 mb-4">
          系统已按手机号检测出可能重复的线索，请选择要保留的主线索，其他线索将被合并到主线索中。
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {loading ? (
            <div className="text-center text-ink-400 py-8">加载中...</div>
          ) : duplicateGroups.length === 0 ? (
            <div className="text-center text-ink-400 py-8">
              <div className="text-4xl mb-2">✓</div>
              <div>暂无重复线索</div>
            </div>
          ) : (
            duplicateGroups.map((group, idx) => (
              <div key={idx} className="border border-paper-300 rounded-lg p-4 bg-paper-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium text-ink-800">
                    📞 {group.phone}
                    <span className="ml-2 text-xs text-ink-500">
                      ({group.lead_count} 条重复)
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  {group.lead_details?.map((lead) => (
                    <label
                      key={lead.id}
                      className="flex items-start gap-3 p-3 border border-paper-200 rounded hover:bg-white cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name={`primary-${idx}`}
                        value={lead.id}
                        defaultChecked={lead.id === group.lead_details?.[0]?.id}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-ink-800">
                          {lead.customer_name || '(无名称)'}
                        </div>
                        <div className="text-xs text-ink-600 mt-1">
                          编号: {lead.lead_number} ·
                          状态: {lead.status} ·
                          创建: {new Date(lead.created_at).toLocaleString('zh-CN')}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={() => handleMerge(idx)}
                    disabled={merging === idx}
                  >
                    {merging === idx ? '合并中...' : '合并到选中项'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <button
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            onClick={() => onOpenChange(false)}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
