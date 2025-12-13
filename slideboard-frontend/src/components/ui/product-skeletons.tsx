'use client'

import React from 'react'

import { cn } from '@/lib/utils'

import { Skeleton } from './skeleton'

/**
 * 产品图片网格骨架屏
 * 用于展示产品图片网格加载状态
 */
interface ProductImageGridSkeletonProps {
  columns?: number
  rows?: number
  className?: string
}

export function ProductImageGridSkeleton({
  columns = 3,
  rows = 1,
  className,
}: ProductImageGridSkeletonProps) {
  const totalItems = columns * rows
  
  return (
    <div className={cn(
      `grid grid-cols-1 md:grid-cols-${columns} gap-4`,
      className
    )}>
      {Array.from({ length: totalItems }).map((_, index) => (
        <ProductImageItemSkeleton key={index} />
      ))}
    </div>
  )
}

/**
 * 产品图片项骨架屏
 * 用于展示单个产品图片加载状态
 */
interface ProductImageItemSkeletonProps {
  className?: string
}

export function ProductImageItemSkeleton({
  className,
}: ProductImageItemSkeletonProps) {
  return (
    <div className={cn(
      'relative group aspect-square bg-paper-200 rounded-lg overflow-hidden',
      className
    )}>
      <Skeleton className="w-full h-full" />
      {/* 删除按钮占位 */}
      <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-paper-300" />
    </div>
  )
}

/**
 * 产品图片上传区域骨架屏
 * 用于展示产品图片上传区域加载状态
 */
interface ProductImagesUploadSkeletonProps {
  className?: string
}

export function ProductImagesUploadSkeleton({
  className,
}: ProductImagesUploadSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* 标题 */}
      <Skeleton width="150px" height="24px" className="mb-2" />
      
      {/* 上传区域 */}
      <div className="w-full h-32 rounded-lg border-2 border-dashed border-paper-300">
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <Skeleton width="120px" height="16px" />
          <div className="flex space-x-4">
            <Skeleton width="80px" height="32px" className="rounded-md" />
          </div>
          <Skeleton width="200px" height="12px" />
        </div>
      </div>
    </div>
  )
}

/**
 * 产品图片骨架屏
 * 用于产品图片整体加载状态
 */
interface ProductImagesSkeletonProps {
  className?: string
  typesCount?: number
}

export function ProductImagesSkeleton({
  className,
  typesCount = 3,
}: ProductImagesSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* 主标题 */}
      <Skeleton width="200px" height="32px" className="mb-4" />
      
      {/* 每种图片类型的骨架屏 */}
      {Array.from({ length: typesCount }).map((_, index) => (
        <div key={index} className="space-y-4">
          <ProductImagesUploadSkeleton />
          <ProductImageGridSkeleton columns={3} rows={1} />
        </div>
      ))}
    </div>
  )
}

/**
 * 产品表单骨架屏
 * 用于产品创建/编辑表单加载状态
 */
export function ProductFormSkeleton({
  className,
}: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* 基本信息 */}
      <div className="space-y-4">
        <Skeleton width="200px" height="32px" className="mb-2" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton width="80px" height="16px" />
            <Skeleton width="100%" height="40px" className="rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton width="80px" height="16px" />
            <Skeleton width="100%" height="40px" className="rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton width="80px" height="16px" />
            <Skeleton width="100%" height="40px" className="rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton width="80px" height="16px" />
            <Skeleton width="100%" height="40px" className="rounded-md" />
          </div>
        </div>
      </div>
      
      {/* 产品描述 */}
      <div className="space-y-2">
        <Skeleton width="120px" height="24px" />
        <Skeleton width="100%" height="120px" className="rounded-md" />
      </div>
      
      {/* 产品图片 */}
      <ProductImagesSkeleton />
      
      {/* 操作按钮 */}
      <div className="flex justify-end space-x-4 pt-4">
        <Skeleton width="100px" height="40px" className="rounded-md" />
        <Skeleton width="120px" height="40px" className="rounded-md" />
      </div>
    </div>
  )
}
