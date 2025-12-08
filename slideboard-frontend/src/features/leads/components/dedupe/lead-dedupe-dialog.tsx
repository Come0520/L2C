import React, { useEffect, useState } from 'react'

import { leadService } from '@/services/leads.client'
import type { LeadDuplicateRecord } from '@/types/lead'

interface LeadDedupeDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const LeadDedupeDialog: React.FC<LeadDedupeDialogProps> = ({ isOpen, onClose }) => {
  const [duplicateGroups, setDuplicateGroups] = useState<LeadDuplicateRecord[][]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchDuplicateGroups()
    }
  }, [isOpen])

  const fetchDuplicateGroups = async () => {
    setLoading(true)
    try {
      const groups = await leadService.findDuplicateGroups()
      setDuplicateGroups(groups)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const handleMerge = async (groupIndex: number) => {
    const group = duplicateGroups[groupIndex]
    if (!group) return

    const radios = document.getElementsByName(`primary-${groupIndex}`)
    let primaryId = group[0]?.id
    for (const r of Array.from(radios)) {
      const el = r as HTMLInputElement
      if (el.checked) primaryId = el.value
    }
    const dupIds = group.map((g: LeadDuplicateRecord) => g.id).filter((id: string) => id !== primaryId)
    if (!primaryId) return

    try {
      await leadService.mergeLeads(primaryId, dupIds)
      // 重新获取去重分组
      fetchDuplicateGroups()
    } catch (error) {
      console.error('合并失败:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="text-lg font-semibold mb-4">去重与合并</div>
        <div className="text-ink-600 mb-4">按电话与客户名检测可能重复的线索，选择保留项并合并。</div>
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {loading ? (
            <div className="text-ink-400">加载中...</div>
          ) : duplicateGroups.length === 0 ? (
            <div className="text-ink-400">暂无重复项</div>
          ) : (
            duplicateGroups.map((group, idx) => (
              <div key={idx} className="border border-paper-300 rounded p-3">
                <div className="font-medium mb-2">{group[0]?.customer_name} / {group[0]?.phone}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {group.map((g: LeadDuplicateRecord) => (
                    <label key={g.id} className="flex items-center gap-2 p-2 border rounded">
                      <input type="radio" name={`primary-${idx}`} value={g.id} defaultChecked={group[0]?.id === g.id} />
                      <span className="text-sm">{g.lead_number} · {new Date(g.created_at).toLocaleString('zh-CN')}</span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end mt-3">
                  <button
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleMerge(idx)}
                  >合并到选中项</button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  )
}
