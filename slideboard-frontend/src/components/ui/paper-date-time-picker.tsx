'use client'

import React, { useState, useEffect } from 'react'

import { PaperButton } from './paper-button'

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
  disabled?: boolean
  required?: boolean
  format?: 'date' | 'time' | 'datetime' // 默认datetime
  minDate?: Date
  maxDate?: Date
  className?: string
  error?: string
}

/**
 * 标准化的日期时间选择组件
 * 支持日期、时间和日期时间三种模式
 * 提供格式验证和一致性保证
 */
export function PaperDateTimePicker({
  value,
  onChange,
  label,
  disabled = false,
  required = false,
  format = 'datetime',
  minDate,
  maxDate,
  className = '',
  error: propError
}: DateTimePickerProps) {
  const [inputValue, setInputValue] = useState(value)
  const [internalError, setInternalError] = useState('')

  const error = propError || internalError

  // 初始化输入值
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // 验证日期时间格式
  const validateDateTime = (val: string): boolean => {
    if (!val) {
      if (required) {
        setInternalError('该字段为必填项')
        return false
      }
      setInternalError('')
      return true
    }

    let isValid = false
    let newError = ''

    try {
      const date = new Date(val)
      if (isNaN(date.getTime())) {
        newError = '日期时间格式无效'
        isValid = false
      } else {
        // 检查是否在有效范围内
        if (minDate && date < minDate) {
          newError = '日期不能早于最小日期'
          isValid = false
        } else if (maxDate && date > maxDate) {
          newError = '日期不能晚于最大日期'
          isValid = false
        } else {
          isValid = true
        }
      }
    } catch (_e) {
      newError = '日期时间格式无效'
      isValid = false
    }

    setInternalError(newError)
    return isValid
  }

  // 处理日期选择器变化
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)
    if (validateDateTime(val)) {
      onChange(val)
    }
  }

  // 处理时间选择器变化
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    // 如果当前值包含日期，只替换时间部分
    if (inputValue && inputValue.includes('T')) {
      const datePart = inputValue.split('T')[0]
      const newVal = `${datePart}T${val}`
      setInputValue(newVal)
      if (validateDateTime(newVal)) {
        onChange(newVal)
      }
    } else {
      // 否则直接设置时间
      setInputValue(val)
      if (validateDateTime(val)) {
        onChange(val)
      }
    }
  }

  // 根据格式渲染不同的输入类型
  const renderInput = () => {
    if (format === 'date') {
      return (
        <input
          type="date"
          value={inputValue}
          onChange={handleDateChange}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
          min={minDate ? minDate.toISOString().split('T')[0] : undefined}
          max={maxDate ? maxDate.toISOString().split('T')[0] : undefined}
        />
      )
    } else if (format === 'time') {
      return (
        <input
          type="time"
          value={inputValue}
          onChange={handleTimeChange}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
        />
      )
    } else {
      return (
        <input
          type="datetime-local"
          value={inputValue}
          onChange={handleDateChange}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
          min={minDate ? minDate.toISOString().slice(0, 16) : undefined}
          max={maxDate ? maxDate.toISOString().slice(0, 16) : undefined}
        />
      )
    }
  }

  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        {renderInput()}
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  )
}

/**
 * 简化的时间选择组件，用于显示和编辑时间
 * 支持中文时间格式显示
 */
export function PaperTimeEditComponent({
  value,
  onChange,
  label,
  className = ''
}: {
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)

  // 格式化中文显示
  const formatChineseTime = (timeStr: string): string => {
    if (!timeStr) return ''

    // 处理相对时间（如："明日 14:00"）
    if (timeStr.includes('明日') || timeStr.includes('后天')) {
      return timeStr
    }

    try {
      const date = new Date(timeStr)
      if (isNaN(date.getTime())) return timeStr

      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(now.getDate() + 1)
      const dayAfterTomorrow = new Date(now)
      dayAfterTomorrow.setDate(now.getDate() + 2)

      if (date.toDateString() === tomorrow.toDateString()) {
        return `明日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      } else if (date.toDateString() === dayAfterTomorrow.toDateString()) {
        return `后天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      } else {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      }
    } catch (_e) {
      return timeStr
    }
  }

  const handleSave = () => {
    onChange(editValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  return (
    <div className={`${className}`}>
      {label && <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>}
      <div className="flex items-center justify-between">
        {isEditing ? (
          <div className="flex items-center gap-2 w-full">
            <PaperDateTimePicker
              value={editValue}
              onChange={setEditValue}
              format="datetime"
              className="flex-1"
            />
            <PaperButton size="sm" variant="primary" onClick={handleSave} className="h-8 px-2">保存</PaperButton>
            <PaperButton size="sm" variant="outline" onClick={handleCancel} className="h-8 px-2">取消</PaperButton>
          </div>
        ) : (
          <>
            <div className="text-sm">{formatChineseTime(value)}</div>
            <PaperButton size="sm" variant="outline" onClick={() => setIsEditing(true)} className="h-8 px-2 text-blue-600">编辑</PaperButton>
          </>
        )}
      </div>
    </div>
  )
}
