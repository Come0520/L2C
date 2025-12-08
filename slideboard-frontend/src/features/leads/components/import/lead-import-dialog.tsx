import React, { useState } from 'react'

import { toast } from '@/components/ui/toast'
import type { LeadImportRow } from '@/services/leads.client'
import { leadService } from '@/services/leads.client'

interface LeadImportPreviewRow extends LeadImportRow {
  referrer_name?: string
}

interface LeadImportDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const LeadImportDialog: React.FC<LeadImportDialogProps> = ({ isOpen, onClose }) => {
  const [importPreview, setImportPreview] = useState<LeadImportPreviewRow[]>([])
  const [importing, setImporting] = useState(false)
  const [importSummary, setImportSummary] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 })

  if (!isOpen) return null

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (!file) {
      setImportPreview([])
      return
    }
    try {
      // 内联动态导入XLSX库
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer)
      const firstSheet = wb.SheetNames[0]
      if (!firstSheet) return
      const sheet = wb.Sheets[firstSheet]
      if (!sheet) return
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)
      const getString = (obj: Record<string, unknown>, keys: string[]): string => {
        for (const k of keys) {
          const v = obj[k]
          if (typeof v === 'string') {
            const t = v.trim()
            if (t) return t
          }
          if (typeof v === 'number') return String(v)
        }
        return ''
      }
      const normalized: LeadImportPreviewRow[] = rows.map(r => ({
        customer_name: getString(r, ['customer_name', '客户姓名', 'customerName']),
        phone: getString(r, ['phone', '联系电话', 'customerPhone']),
        project_address: getString(r, ['project_address', '项目地址', 'projectAddress']),
        source: getString(r, ['source', '来源渠道', 'sourceChannel']),
        referrer_name: getString(r, ['referrer_name', '推荐人', 'referrerName'])
      })).filter(r => r.customer_name && r.phone)
      setImportPreview(normalized)
    } catch (error) {
      console.error('文件导入失败:', error)
      toast.error('文件导入失败，请检查文件格式')
    }
  }

  const startImport = async () => {
    if (importPreview.length === 0) return
    setImporting(true)
    try {
      const rowsForImport: LeadImportRow[] = importPreview.map(({ customer_name: customerName, phone, project_address: projectAddress, source }) => ({
        customer_name: customerName,
        phone,
        project_address: projectAddress,
        source
      }))
      const result = await leadService.importLeads(rowsForImport)
      setImportSummary(result)
    } finally {
      setImporting(false)
    }
  }

  const closeDialog = () => {
    setImportPreview([])
    setImportSummary({ success: 0, failed: 0 })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="text-lg font-semibold mb-4">导入线索</div>
        <input type="file" accept=".xlsx,.xls,.csv" className="mb-4" onChange={handleImportFileChange} />
        <div className="max-h-64 overflow-auto border rounded">
          {importPreview.length === 0 ? (
            <div className="p-4 text-ink-500">请选择文件以预览</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-paper-100">
                  <th className="p-2 text-left">客户姓名</th>
                  <th className="p-2 text-left">电话</th>
                  <th className="p-2 text-left">项目地址</th>
                  <th className="p-2 text-left">来源渠道</th>
                  <th className="p-2 text-left">推荐人</th>
                </tr>
              </thead>
              <tbody>
                {importPreview.slice(0, 20).map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{r.customer_name}</td>
                    <td className="p-2">{r.phone}</td>
                    <td className="p-2">{r.project_address}</td>
                    <td className="p-2">{r.source}</td>
                    <td className="p-2">{r.referrer_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-ink-600">预览条目：{importPreview.length}</div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50" onClick={closeDialog}>取消</button>
            <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50" onClick={startImport} disabled={importing || importPreview.length === 0}>{importing ? '导入中...' : '开始导入'}</button>
          </div>
        </div>
        {(importSummary.success > 0 || importSummary.failed > 0) && (
          <div className="mt-3 text-sm">成功：{importSummary.success}，失败：{importSummary.failed}</div>
        )}
      </div>
    </div>
  )
}
