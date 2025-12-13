import React from 'react'

import { LeadItem } from '@/types/lead'

interface AppointmentRemindersProps {
  leads: LeadItem[]
  onFollowUp: (lead: LeadItem) => void
}

export const AppointmentReminders: React.FC<AppointmentRemindersProps> = ({ leads, onFollowUp }) => {
  return (
    <div className="bg-white shadow rounded-lg border border-gray-200">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-medium text-orange-800 mb-2">48小时内预约</h3>
            <div className="space-y-2">
              {leads.filter(lead => lead.appointmentReminder === '48h').map(lead => (
                <div key={lead.id} className="flex justify-between items-center">
                  <span className="text-sm">{lead.customerName} - {new Date(lead.appointmentTime!).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                  <button className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded" onClick={() => onFollowUp(lead)}>跟进</button>
                </div>
              ))}
              {leads.filter(lead => lead.appointmentReminder === '48h').length === 0 && (
                <p className="text-sm text-orange-600">暂无48小时内预约</p>
              )}
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-medium text-red-800 mb-2">24小时内预约</h3>
            <div className="space-y-2">
              {leads.filter(lead => lead.appointmentReminder === '24h').map(lead => (
                <div key={lead.id} className="flex justify-between items-center">
                  <span className="text-sm">{lead.customerName} - {new Date(lead.appointmentTime!).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                  <button className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded" onClick={() => onFollowUp(lead)}>跟进</button>
                </div>
              ))}
              {leads.filter(lead => lead.appointmentReminder === '24h').length === 0 && (
                <p className="text-sm text-red-600">暂无24小时内预约</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
