import React, { useState } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { MEASUREMENT_STATUS, MEASUREMENT_STATUS_CONFIG } from '@/constants/measurement-status'

interface MeasurementStatusModalProps {
  isOpen: boolean
  onClose: () => void
  currentStatus: string
  onUpdate: (status: string) => Promise<void>
}

export function MeasurementStatusModal({ isOpen, onClose, currentStatus, onUpdate }: MeasurementStatusModalProps) {
  const [newStatus, setNewStatus] = useState(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)

  if (!isOpen) return null

  const handleUpdate = async () => {
    if (!newStatus) return
    setIsUpdating(true)
    try {
      await onUpdate(newStatus)
      onClose()
    } catch (error) {
      console.error('Failed to update status', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold text-ink-800 mb-4">更新测量单状态</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">新状态</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(MEASUREMENT_STATUS).map((status) => (
                  <option key={status} value={status}>
                    {MEASUREMENT_STATUS_CONFIG[status].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <PaperButton variant="outline" onClick={onClose} disabled={isUpdating}>
                取消
              </PaperButton>
              <PaperButton variant="primary" onClick={handleUpdate} disabled={isUpdating || !newStatus}>
                {isUpdating ? '更新中...' : '确认更新'}
              </PaperButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
