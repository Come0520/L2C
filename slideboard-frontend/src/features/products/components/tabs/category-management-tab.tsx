'use client';

import { Layers, Edit, Plus } from 'lucide-react'
import React from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'

interface CategoryManagementTabProps {
  // 可以根据需要添加属性
}

export const CategoryManagementTab: React.FC<CategoryManagementTabProps> = () => {
  // 一级分类选项
  const categoryLevel1Options = [
    { value: 'all', label: '全部分类' },
    { value: '窗帘', label: '窗帘' },
    { value: '墙布', label: '墙布' },
    { value: '墙咔', label: '墙咔' },
    { value: '飘窗垫', label: '飘窗垫' },
    { value: '标品', label: '标品' },
    { value: '礼品', label: '礼品' },
    { value: '销售道具', label: '销售道具' }
  ]

  return (
    <PaperCard>
      <PaperCardHeader>
        <div className="flex items-center justify-between">
          <PaperCardTitle>分类管理</PaperCardTitle>
          <PaperButton variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            新增分类
          </PaperButton>
        </div>
      </PaperCardHeader>
      <PaperCardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 一级分类 */}
          <div>
            <h3 className="text-lg font-medium text-ink-800 mb-4">一级分类</h3>
            <div className="space-y-3">
              {categoryLevel1Options.filter(opt => opt.value !== 'all').map((category) => (
                <div key={category.value} className="p-4 bg-paper-300 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Layers className="h-5 w-5 text-ink-600" />
                    <span className="text-sm font-medium text-ink-800">{category.label}</span>
                  </div>
                  <div className="flex space-x-2">
                    <PaperButton size="sm" variant="ghost">编辑</PaperButton>
                    <PaperButton size="sm" variant="ghost">删除</PaperButton>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 二级分类 */}
          <div>
            <h3 className="text-lg font-medium text-ink-800 mb-4">二级分类</h3>
            <div className="space-y-3">
              {/* 窗帘二级分类 */}
              <div>
                <h4 className="text-sm font-medium text-ink-700 mb-2">窗帘</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['布', '纱', '轨道', '电机', '功能帘', '绑带'].map((subcategory) => (
                    <div key={subcategory} className="p-3 bg-paper-200 rounded-lg flex items-center justify-between">
                      <span className="text-xs text-ink-700">{subcategory}</span>
                      <div className="flex space-x-1">
                        <PaperButton size="sm" variant="ghost" className="h-6">
                          <Edit className="h-3 w-3" />
                        </PaperButton>
                        <PaperButton size="sm" variant="ghost" className="h-6">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </PaperButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 墙布二级分类 */}
              <div>
                <h4 className="text-sm font-medium text-ink-700 mb-2">墙布</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['艺术漆', '提花', '印花'].map((subcategory) => (
                    <div key={subcategory} className="p-3 bg-paper-200 rounded-lg flex items-center justify-between">
                      <span className="text-xs text-ink-700">{subcategory}</span>
                      <div className="flex space-x-1">
                        <PaperButton size="sm" variant="ghost" className="h-6">
                          <Edit className="h-3 w-3" />
                        </PaperButton>
                        <PaperButton size="sm" variant="ghost" className="h-6">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </PaperButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PaperCardContent>
    </PaperCard>
  )
}
