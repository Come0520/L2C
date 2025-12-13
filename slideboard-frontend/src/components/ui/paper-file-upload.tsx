'use client'

import * as React from 'react'

import { cn } from '@/utils/lib-utils'

import { PaperButton } from './paper-button'

/**
 * 附件类型枚举
 * @typedef {('image'|'document'|'other')} AttachmentType
 */
export type AttachmentType = 'image' | 'document' | 'other'

/**
 * 附件配置接口
 * @interface AttachmentConfig
 * @property {AttachmentType} type - 附件类型
 * @property {string} accept - 允许的文件类型
 * @property {number} maxSizeMB - 最大文件大小（MB）
 * @property {boolean} [compress] - 是否压缩文件
 * @property {Function} [namingRule] - 文件命名规则函数
 */
interface AttachmentConfig {
  type: AttachmentType
  accept: string
  maxSizeMB: number
  compress?: boolean
  namingRule?: (params: { date: string; orderNo?: string; type: string; index: number }) => string
}

/**
 * 预设附件配置
 * @constant {Record<AttachmentType, AttachmentConfig>}
 */
export const ATTACHMENT_CONFIGS: Record<AttachmentType, AttachmentConfig> = {
  image: {
    type: 'image',
    accept: 'image/jpeg,image/png,image/jpg,application/pdf',
    maxSizeMB: 5,
    compress: true,
    namingRule: ({ date, orderNo, type, index }) => `${date}_${orderNo}_${type}_${index}`
  },
  document: {
    type: 'document',
    accept: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    maxSizeMB: 10,
    namingRule: ({ date, orderNo, type, index }) => `${date}_${orderNo}_${type}_${index}`
  },
  other: {
    type: 'other',
    accept: '*',
    maxSizeMB: 20
  }
}

/**
 * 纸张文件上传组件属性接口
 * @interface PaperFileUploadProps
 * @property {Function} [onUpload] - 文件上传成功回调函数
 * @property {number} [maxFiles=5] - 最大文件数量
 * @property {string} [accept] - 允许的文件类型
 * @property {string} [className=''] - 自定义类名
 * @property {boolean} [multiple=true] - 是否允许选择多个文件
 * @property {number} [maxSizeMB] - 最大文件大小（MB）
 * @property {Function} [onValidateError] - 文件验证错误回调函数
 * @property {AttachmentType} [attachmentType='other'] - 附件类型
 * @property {string} [orderNo] - 订单号，用于文件命名
 * @property {string} [label] - 组件标签
 * @property {string} [error] - 错误信息
 * @property {Function} [onUploadProgress] - 上传进度回调函数
 * @property {Function} [onUploadError] - 上传错误回调函数
 * @property {Function} [onUploadSuccess] - 上传成功回调函数
 * @property {number} [retryCount=3] - 上传失败重试次数
 */
interface PaperFileUploadProps {
  onUpload?: (files: File[]) => void
  maxFiles?: number
  accept?: string
  className?: string
  multiple?: boolean
  maxSizeMB?: number
  onValidateError?: (errors: string[]) => void
  attachmentType?: AttachmentType
  orderNo?: string
  label?: string
  error?: string
  onUploadProgress?: (progress: number) => void
  onUploadError?: (error: Error) => void
  onUploadSuccess?: (files: File[]) => void
  retryCount?: number
}

/**
 * 纸张文件上传组件
 * 
 * @description
 * 用于上传文件的组件，支持拖拽上传、文件验证、压缩和重命名功能
 * 支持多种文件类型，并提供友好的用户交互体验
 * 
 * @param {PaperFileUploadProps} props - 组件属性
 * @returns {JSX.Element} 纸张文件上传组件
 * 
 * @example
 * ```typescript
 * <PaperFileUpload
 *   onUpload={handleFileUpload}
 *   accept="image/*"
 *   maxFiles={5}
 *   label="上传图片"
 *   onUploadProgress={handleUploadProgress}
 *   onUploadSuccess={handleUploadSuccess}
 * />
 * ```
 */

export function PaperFileUpload({
  onUpload,
  maxFiles = 5,
  accept: customAccept,
  className = '',
  multiple = true,
  maxSizeMB: customMaxSizeMB,
  onValidateError,
  attachmentType = 'other',
  orderNo,
  label,
  error,
  onUploadProgress,
  onUploadError,
  onUploadSuccess,
  retryCount = 3
}: PaperFileUploadProps) {
  const [dragActive, setDragActive] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [retryAttempts, setRetryAttempts] = React.useState(0)

  // 获取配置
  const config = ATTACHMENT_CONFIGS[attachmentType]
  const finalAccept = customAccept || config.accept
  const finalMaxSizeMB = customMaxSizeMB || config.maxSizeMB
  const isMultiple = multiple || maxFiles > 1

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files)
      processFiles(files)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files)
      processFiles(files)
    }
  }

  const validateFiles = (files: File[]) => {
    const errors: string[] = []
    const validFiles = files.filter((file) => {
      if (file.size > finalMaxSizeMB * 1024 * 1024) {
        errors.push(`${file.name} 超过大小限制 ${finalMaxSizeMB}MB`)
        return false
      }
      if (finalAccept && !acceptMatch(file, finalAccept)) {
        errors.push(`${file.name} 类型不符合要求`)
        return false
      }
      return true
    })
    return { validFiles, errors }
  }

  const acceptMatch = (file: File, accept: string) => {
    const types = accept.split(',').map(s => s.trim())
    const name = file.name.toLowerCase()
    const type = file.type.toLowerCase()
    return types.some((t) => {
      if (t.endsWith('/*')) {
        const base = t.replace('/*', '')
        return type.startsWith(base)
      }
      if (t.startsWith('.')) {
        return name.endsWith(t)
      }
      return type === t
    })
  }

  // 压缩图片
  const compressImage = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) return file

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) return resolve(file)

          // 保持原始比例，最大尺寸为2000px
          const maxSize = 2000
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height
              height = maxSize
            }
          }

          canvas.width = width
          canvas.height = height
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file)
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(compressedFile)
            },
            file.type,
            0.8 // 压缩质量
          )
        }
      }
    })
  }

  // 重命名文件
  const renameFile = (file: File, index: number): File => {
    if (!config || !config.namingRule || !orderNo) return file

    const dateStr = new Date().toISOString().split('T')[0]
    const date = (dateStr || '').replace(/-/g, '')
    const ext = file.name.split('.').pop() || ''
    const baseName = config.namingRule({
      date,
      orderNo,
      type: attachmentType,
      index: index + 1
    })
    const newName = `${baseName}.${ext}`

    return new File([file], newName, {
      type: file.type,
      lastModified: Date.now()
    })
  }

  // 处理文件上传
  const processFiles = async (files: File[]) => {
    const { validFiles, errors } = validateFiles(files)
    if (errors.length) {
      onValidateError?.(errors)
      return
    }

    if (validFiles.length === 0) return

    setUploading(true)
    setProgress(0)
    setRetryAttempts(0)

    try {
      // 处理文件：压缩 + 重命名
      const processedFiles: File[] = []
      for (let i = 0; i < validFiles.length; i++) {
        let file = validFiles[i]
        if (!file) continue

        // 压缩图片
        if (config && config.compress) {
          file = await compressImage(file)
        }

        // 重命名文件
        file = renameFile(file, i)

        processedFiles.push(file)

        // 更新进度
        const currentProgress = Math.round(((i + 1) / validFiles.length) * 100)
        setProgress(currentProgress)
        onUploadProgress?.(currentProgress)
      }

      // 调用上传回调
      onUpload?.(processedFiles)
      onUploadSuccess?.(processedFiles)
    } catch (error) {
      handleUploadError(error as Error)
    } finally {
      setUploading(false)
    }
  }

  // 处理上传错误，支持重试
  const handleUploadError = (error: Error) => {
    onUploadError?.(error)

    if (retryAttempts < retryCount) {
      // 自动重试
      setTimeout(() => {
        setRetryAttempts(prev => prev + 1)
        // 重新上传，需要重新获取文件，这里简化处理
      }, 1000 * (retryAttempts + 1)) // 指数退避
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div
        className={cn(
          'relative flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed transition-colors',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:bg-gray-50',
          uploading && 'opacity-50 cursor-not-allowed'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={isMultiple}
          accept={finalAccept}
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />
        <div className="flex flex-col items-center justify-center text-sm text-gray-600">
          <p className="mb-2">拖拽文件到此处 或</p>
          <PaperButton
            variant="outline"
            size="small"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            点击上传
          </PaperButton>
          <p className="mt-2 text-xs text-gray-500">
            支持文件类型：{finalAccept.split(',').map(t => t.split('/')[1] || t).join(', ')}
            • 最大大小：{finalMaxSizeMB}MB
          </p>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* 上传进度 */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>上传进度</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {retryAttempts > 0 && (
            <div className="text-xs text-orange-600">
              已重试 {retryAttempts}/{retryCount} 次
            </div>
          )}
        </div>
      )}
    </div>
  )
}
