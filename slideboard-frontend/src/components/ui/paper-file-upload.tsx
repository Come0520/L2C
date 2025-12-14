'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File as FileIcon, X, Check } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/utils/lib-utils'

import { GridPattern } from './grid-pattern'
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
  showFileList?: boolean
}

/**
 * 纸张文件上传组件
 * 
 * @description
 * Aceternity UI 风格的文件上传组件，完全主题化
 * 支持拖拽上传、文件验证、压缩和重命名功能
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
  retryCount = 3,
  showFileList = false
}: PaperFileUploadProps) {
  const [dragActive, setDragActive] = React.useState(false)
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([])
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
      if (t === '*') return true
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
            0.8
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

    setSelectedFiles(validFiles)
    setUploading(true)
    setProgress(0)
    setRetryAttempts(0)

    try {
      const processedFiles: File[] = []
      for (let i = 0; i < validFiles.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 0))

        let file = validFiles[i]
        if (!file) continue

        if (config && config.compress) {
          file = await compressImage(file)
        }

        file = renameFile(file, i)
        processedFiles.push(file)

        const currentProgress = Math.round(((i + 1) / validFiles.length) * 100)
        setProgress(currentProgress)
        onUploadProgress?.(currentProgress)
      }

      onUpload?.(processedFiles)
      onUploadSuccess?.(processedFiles)
    } catch (error) {
      handleUploadError(error as Error)
    } finally {
      setUploading(false)
    }
  }

  const handleUploadError = (error: Error) => {
    onUploadError?.(error)

    if (retryAttempts < retryCount) {
      setTimeout(() => {
        setRetryAttempts(prev => prev + 1)
      }, 1000 * (retryAttempts + 1))
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <label className="text-sm font-medium text-theme-text-primary">
          {label}
        </label>
      )}

      <motion.div
        animate={{
          scale: dragActive ? 1.02 : 1,
        }}
        whileHover={{ scale: uploading ? 1 : 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          'relative flex flex-col items-center justify-center w-full h-40 rounded-lg border-2 border-dashed transition-all duration-300 overflow-hidden',
          dragActive
            ? 'border-primary-500 bg-primary-500/10'
            : 'border-theme-border hover:bg-theme-bg-secondary',
          uploading && 'opacity-50 cursor-not-allowed'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* 背景网格 */}
        <GridPattern className="opacity-50" />

        <input
          ref={inputRef}
          type="file"
          multiple={isMultiple}
          accept={finalAccept}
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />

        <div className="relative z-10 flex flex-col items-center justify-center text-sm">
          {/* 上传图标 */}
          <motion.div
            animate={{
              y: dragActive ? -8 : 0,
              scale: dragActive ? 1.1 : 1
            }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <Upload className="h-10 w-10 text-theme-text-secondary mb-4" />
          </motion.div>

          <p className="mb-2 text-theme-text-primary font-medium">
            拖拽文件到此处 或
          </p>

          <PaperButton
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            点击上传
          </PaperButton>

          <p className="mt-3 text-xs text-theme-text-secondary text-center px-4">
            支持: {finalAccept.split(',').map(t => t.split('/')[1] || t).join(', ')}
            {' • '}
            最大: {finalMaxSizeMB}MB
          </p>
        </div>
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-error-600"
        >
          {error}
        </motion.p>
      )}

      {/* 文件列表 */}
      {showFileList && selectedFiles.length > 0 && !uploading && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {selectedFiles.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-theme-bg-secondary rounded-lg border border-theme-border"
              >
                <div className="flex items-center gap-3">
                  <FileIcon className="h-5 w-5 text-theme-text-secondary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-theme-text-primary truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-theme-text-secondary">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeFile(index)}
                  className="p-1.5 hover:bg-theme-bg-tertiary rounded transition-colors"
                  aria-label="移除文件"
                >
                  <X className="h-4 w-4 text-theme-text-secondary" />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* 上传进度 */}
      {uploading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex justify-between text-sm text-theme-text-primary">
            <span className="font-medium">上传进度</span>
            <span>{progress}%</span>
          </div>
          <div className="relative w-full bg-theme-bg-secondary rounded-full h-2.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 relative"
            >
              {/* 光泽效果 */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                style={{ width: '50%' }}
              />
            </motion.div>
          </div>
          {retryAttempts > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-warning-600"
            >
              已重试 {retryAttempts}/{retryCount} 次
            </motion.div>
          )}
          {progress === 100 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-sm text-success-600"
            >
              <Check className="h-4 w-4" />
              <span>上传完成</span>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}
