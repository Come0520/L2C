'use client'

import React, { useState } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'
import { PaperDateTimePicker } from '@/components/ui/paper-date-time-picker'
import { PaperTextarea } from '@/components/ui/paper-input'
import { toast } from '@/components/ui/toast'
import { FollowUpRecord } from '@/types/lead'

interface FollowUpDialogProps {
  isOpen: boolean
  onClose: () => void
  lead: {
    id: string
    customerName: string
    phone: string
    requirements: string[]
    leadNumber: string
    projectAddress: string
    customerLevel: string
    status: string
    source: string
    createdAt: string
    lastFollowUpAt: string
  }
  onSave: (record: Omit<FollowUpRecord, 'id' | 'createdAt' | 'createdBy'>) => void
}

export default function FollowUpDialog({ isOpen, onClose, lead, onSave }: FollowUpDialogProps) {
  const [content, setContent] = useState('')
  const [note, setNote] = useState('')
  const [result, setResult] = useState<'interested' | 'follow-up'>('follow-up')
  const [nextFollowUpTime, setNextFollowUpTime] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  
  // 模拟历史跟进记录
  const [historyRecords] = useState<FollowUpRecord[]>([
    {
      id: '1',
      leadId: lead.id,
      type: 'text',
      content: '首次联系客户，客户表示对厨房改造感兴趣，需要进一步沟通细节。',
      result: 'follow-up',
      note: '客户希望了解北欧风格的厨房改造方案和报价。',
      nextFollowUpTime: '2024-01-14T10:00:00',
      appointmentTime: '',
      createdAt: '2024-01-10T14:30:00',
      createdBy: '销售员B'
    },
    {
      id: '2',
      leadId: lead.id,
      type: 'voice',
      content: '与客户沟通了厨房改造的具体需求，客户希望使用环保材料，预算在10-15万之间。',
      result: 'interested',
      note: '已发送北欧风格厨房改造方案给客户，客户表示需要考虑一下。',
      nextFollowUpTime: '2024-01-16T15:00:00',
      appointmentTime: '',
      createdAt: '2024-01-14T10:00:00',
      createdBy: '销售员B'
    },
    {
      id: '3',
      leadId: lead.id,
      type: 'text',
      content: '客户反馈方案基本满意，希望调整橱柜的设计和材质。',
      result: 'follow-up',
      note: '已安排设计师重新调整方案，预计明天完成。',
      nextFollowUpTime: '2024-01-17T14:00:00',
      appointmentTime: '',
      createdAt: '2024-01-16T15:30:00',
      createdBy: '销售员B'
    },
    {
      id: '4',
      leadId: lead.id,
      type: 'voice',
      content: '向客户介绍了调整后的方案，客户对新方案非常满意，希望安排到店详谈。',
      result: 'interested',
      note: '已预约客户1月18日下午2点到店，将由设计师和销售共同接待。',
      nextFollowUpTime: '2024-01-18T14:00:00',
      appointmentTime: '2024-01-18T14:00:00',
      createdAt: '2024-01-17T16:00:00',
      createdBy: '销售员B'
    },
    {
      id: '5',
      leadId: lead.id,
      type: 'text',
      content: '客户已到店，与设计师深入沟通了细节，对报价也基本认可。',
      result: 'interested',
      note: '客户需要回家与家人商量，预计下周给出最终答复。',
      nextFollowUpTime: '2024-01-22T10:00:00',
      appointmentTime: '',
      createdAt: '2024-01-18T15:30:00',
      createdBy: '销售员B'
    }
  ])

  const handleSave = () => {
    if (!content.trim()) {
      toast.error('请填写跟踪内容')
      return
    }

    onSave({
      leadId: lead.id,
      type: 'text', // 默认使用文字类型
      content: content.trim(),
      result,
      note: note.trim(),
      nextFollowUpTime: nextFollowUpTime || undefined,
      appointmentTime: appointmentTime || undefined
    })

    // 重置表单
    setContent('')
    setNote('')
    setNextFollowUpTime('')
    setAppointmentTime('')
    setResult('follow-up')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <PaperCardHeader className="flex flex-row items-center justify-between">
          <PaperCardTitle>跟踪记录录入</PaperCardTitle>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </PaperCardHeader>
        
        <PaperCardContent className="space-y-6">
          {/* 客户基本信息 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">客户基本信息</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">姓名：</span>
                <span className="font-medium">{lead.customerName}</span>
              </div>
              <div>
                <span className="text-gray-600">电话：</span>
                <span className="font-medium">{lead.phone}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">线索编号：</span>
                <span className="font-medium font-mono">{lead.leadNumber}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">项目地址：</span>
                <span className="font-medium">{lead.projectAddress || '-'}</span>
              </div>
              <div>
                <span className="text-gray-600">客户等级：</span>
                <span className="font-medium">{lead.customerLevel}</span>
              </div>
              <div>
                <span className="text-gray-600">当前状态：</span>
                <span className="font-medium">{lead.status}</span>
              </div>
              <div>
                <span className="text-gray-600">来源：</span>
                <span className="font-medium">{lead.source}</span>
              </div>
              <div>
                <span className="text-gray-600">创建时间：</span>
                <span className="font-medium">{new Date(lead.createdAt).toLocaleString()}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">需求：</span>
                <span className="font-medium">{lead.requirements.join(', ')}</span>
              </div>
              <div>
                <span className="text-gray-600">最后跟进：</span>
                <span className="font-medium">{new Date(lead.lastFollowUpAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 历史跟进记录 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">历史跟进记录</h4>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {historyRecords.map((record) => (
                <div key={record.id} className="p-3 bg-white border rounded-lg">
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="font-medium text-gray-900">{record.createdBy}</span>
                    <span className="text-gray-500">{new Date(record.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{record.content}</p>
                  {record.note && (
                    <p className="text-xs text-gray-600">备注：{record.note}</p>
                  )}
                </div>
              ))}
              {historyRecords.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">暂无历史跟进记录</p>
              )}
            </div>
          </div>

          {/* 跟踪内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              跟踪内容
            </label>
            <PaperTextarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入跟踪内容..."
              rows={6}
            />
            <div className="text-xs text-gray-500 mt-1">
              {content.length}/500字
            </div>
          </div>

          {/* 本次备注 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">本次备注（可选）</label>
            <PaperTextarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="请输入本次跟踪备注（不覆盖历史备注）..."
              rows={3}
            />
            <div className="text-xs text-gray-500 mt-1">
              {note.length}/200字
            </div>
          </div>

          {/* 跟踪结果 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">跟踪结果</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="result"
                  value="interested"
                  checked={result === 'interested'}
                  onChange={(e) => setResult(e.target.value as 'interested')}
                  className="mr-2"
                />
                有意向
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="result"
                  value="follow-up"
                  checked={result === 'follow-up'}
                  onChange={(e) => setResult(e.target.value as 'follow-up')}
                  className="mr-2"
                />
                需跟进
              </label>
            </div>
          </div>

          {/* 下次跟进时间 */}
          {(result === 'interested' || result === 'follow-up') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <PaperDateTimePicker
                  label={result === 'interested' ? '下次跟进时间（可选）' : '下次跟进时间 *'}
                  value={nextFollowUpTime}
                  onChange={setNextFollowUpTime}
                  format="datetime"
                  minDate={new Date()}
                  required={result === 'follow-up'}
                />
              </div>
              <div>
                <PaperDateTimePicker
                  label="预约到店时间（可选）"
                  value={appointmentTime}
                  onChange={setAppointmentTime}
                  format="datetime"
                  minDate={new Date()}
                />
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <PaperButton variant="outline" onClick={onClose}>
              取消
            </PaperButton>
            <PaperButton variant="primary" onClick={handleSave}>
              保存
            </PaperButton>
          </div>
        </PaperCardContent>
      </div>
    </div>
  )
}
