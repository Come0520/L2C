'use client'

import React, { useState, useEffect } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'
import { cn } from '@/lib/utils'
import { AppointmentCalendarItem } from '@/types/lead'

interface AppointmentCalendarProps {
  className?: string
  onAppointmentClick?: (date: string, appointments: AppointmentCalendarItem['appointments']) => void
  appointments?: AppointmentCalendarItem[]
}

export default function AppointmentCalendar({ className, onAppointmentClick, appointments: externalAppointments }: AppointmentCalendarProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<AppointmentCalendarItem[]>([])

  // 生成未来14天的日期
  const generateCalendarDays = () => {
    const days: { date: string; display: string; isToday: boolean; dayOfWeek: string }[] = []
    const today = new Date()

    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      days.push({
        date: date.toISOString().split('T')[0] || '',
        display: formatDateDisplay(date, i),
        isToday: i === 0,
        dayOfWeek: getDayOfWeek(date) || ''
      })
    }
    return days
  }

  const formatDateDisplay = (date: Date, offset: number) => {
    if (offset === 0) return '今天'
    if (offset === 1) return '明天'
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  const getDayOfWeek = (date: Date) => {
    const days = ['日', '一', '二', '三', '四', '五', '六']
    return days[date.getDay()]
  }

  // 模拟预约数据
  useEffect(() => {
    if (externalAppointments) {
      setAppointments(externalAppointments)
    } else {
      const mockAppointments: AppointmentCalendarItem[] = [
        {
          date: new Date().toISOString().split('T')[0] || '',
          count: 2,
          appointments: [
            { time: '14:00', customerName: '张三', requirement: '整体橱柜', level: 'A' },
            { time: '16:30', customerName: '李四', requirement: '全屋定制', level: 'B' }
          ]
        },
        {
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '',
          count: 1,
          appointments: [
            { time: '15:00', customerName: '王五', requirement: '衣柜', level: 'A' }
          ]
        },
        {
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '',
          count: 3,
          appointments: [
            { time: '10:00', customerName: '赵六', requirement: '瓷砖', level: 'C' },
            { time: '14:00', customerName: '钱七', requirement: '地板', level: 'B' },
            { time: '16:00', customerName: '孙八', requirement: '门窗', level: 'A' }
          ]
        }
      ]
      setAppointments(mockAppointments)
    }
  }, [externalAppointments])

  const calendarDays = generateCalendarDays()

  const getAppointmentCount = (date: string) => {
    const appointment = appointments.find(a => a.date === date)
    return appointment ? appointment.count : 0
  }

  const getAppointmentIndicator = (date: string) => {
    const count = getAppointmentCount(date)
    if (count === 0) return null
    if (count >= 3) return { color: 'red', symbol: '🔴' }
    return { color: 'blue', symbol: '🔵' }
  }

  const handleDateClick = (date: string) => {
    const appointmentData = appointments.find(a => a.date === date)
    setSelectedDate(date)
    if (onAppointmentClick) {
      onAppointmentClick(date, appointmentData?.appointments || [])
    }
  }

  return (
    <PaperCard className={cn('mb-6', className)}>
      <PaperCardHeader className="flex flex-row items-center justify-between">
        <PaperCardTitle className="flex items-center gap-2">
          <span>📅</span>
          客户预约日历
        </PaperCardTitle>
        <PaperButton
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '收起' : '展开'}
        </PaperButton>
      </PaperCardHeader>

      {isExpanded && (
        <PaperCardContent>
          <div className="text-sm text-gray-600 mb-4">
            今天: {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })} 星期{getDayOfWeek(new Date())}
          </div>

          <div className="grid grid-cols-7 gap-2 mb-4">
            {['一', '二', '三', '四', '五', '六', '日'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {/* 第一周 */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.slice(0, 7).map((day) => {
                const indicator = getAppointmentIndicator(day.date)
                return (
                  <div
                    key={day.date}
                    className={cn(
                      'relative p-3 text-center rounded-lg border cursor-pointer transition-all',
                      day.isToday ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white',
                      selectedDate === day.date ? 'ring-2 ring-blue-500' : '',
                      'hover:bg-gray-50 hover:border-gray-300'
                    )}
                    onClick={() => handleDateClick(day.date)}
                  >
                    <div className="text-sm font-medium text-gray-900">{day.display}</div>
                    <div className="text-xs text-gray-500">{day.dayOfWeek}</div>
                    {indicator && (
                      <div className="mt-1">
                        <span className="text-sm">{indicator.symbol}</span>
                        <div className="text-xs text-gray-600">{getAppointmentCount(day.date)}个</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 第二周 */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.slice(7, 14).map((day) => {
                const indicator = getAppointmentIndicator(day.date)
                return (
                  <div
                    key={day.date}
                    className={cn(
                      'relative p-3 text-center rounded-lg border cursor-pointer transition-all',
                      day.isToday ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white',
                      selectedDate === day.date ? 'ring-2 ring-blue-500' : '',
                      'hover:bg-gray-50 hover:border-gray-300'
                    )}
                    onClick={() => handleDateClick(day.date)}
                  >
                    <div className="text-sm font-medium text-gray-900">{day.display}</div>
                    <div className="text-xs text-gray-500">{day.dayOfWeek}</div>
                    {indicator && (
                      <div className="mt-1">
                        <span className="text-sm">{indicator.symbol}</span>
                        <div className="text-xs text-gray-600">{getAppointmentCount(day.date)}个</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {selectedDate && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-blue-900">
                  {new Date(selectedDate).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} 预约详情
                </h4>
                <PaperButton
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(null)}
                >
                  关闭
                </PaperButton>
              </div>

              {(() => {
                const appointmentData = appointments.find(a => a.date === selectedDate)
                if (!appointmentData || appointmentData.appointments.length === 0) {
                  return <p className="text-blue-700">暂无预约</p>
                }

                return (
                  <div className="space-y-2">
                    <p className="text-sm text-blue-700">共{appointmentData.count}个预约客户</p>
                    {appointmentData.appointments.map((apt, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900">{apt.time}</span>
                          <span className="text-sm text-gray-700">{apt.customerName}</span>
                          <span className="text-xs text-gray-500">{apt.requirement}</span>
                          <span className={cn(
                            'px-2 py-1 text-xs rounded-full',
                            apt.level === 'A' ? 'bg-red-100 text-red-700' :
                              apt.level === 'B' ? 'bg-orange-100 text-orange-700' :
                                'bg-yellow-100 text-yellow-700'
                          )}>
                            {apt.level}级
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <PaperButton variant="ghost" size="sm">查看</PaperButton>
                          <PaperButton variant="outline" size="sm">跟进</PaperButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}
        </PaperCardContent>
      )}
    </PaperCard>
  )
}
