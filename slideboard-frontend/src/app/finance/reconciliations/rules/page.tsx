'use client'

import React, { useState, useEffect } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperInput } from '@/components/ui/paper-input'
import { PaperModal } from "@/components/ui/paper-modal";
import { PaperSelect } from '@/components/ui/paper-select'
import { PaperTable, PaperTableHeader, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table'
import { reconciliationRules } from '@/services/reconciliationRules.client'
import { ReconciliationRule } from '@/shared/types/reconciliation'

const ReconciliationRulesPage: React.FC = () => {
  const [rules, setRules] = useState<ReconciliationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentRule, setCurrentRule] = useState<Partial<ReconciliationRule>>({})

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    setLoading(true)
    try {
      const response = await reconciliationRules.getReconciliationRules()
      if (response.success && response.data) {
        setRules(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRule = () => {
    setIsEditMode(false)
    setCurrentRule({
      name: '',
      description: '',
      ruleType: 'order',
      priority: 1,
      enabled: true,
      conditions: [],
      actions: []
    })
    setIsModalOpen(true)
  }

  const handleEditRule = (rule: ReconciliationRule) => {
    setIsEditMode(true)
    setCurrentRule({ ...rule })
    setIsModalOpen(true)
  }

  const handleSaveRule = async () => {
    try {
      if (isEditMode && currentRule.id) {
        await reconciliationRules.updateReconciliationRule(currentRule.id, currentRule as ReconciliationRule)
      } else {
        await reconciliationRules.createReconciliationRule(currentRule as Omit<ReconciliationRule, 'id' | 'createdAt' | 'updatedAt'>)
      }
      setIsModalOpen(false)
      fetchRules()
    } catch (error) {
      console.error('Failed to save rule:', error)
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await reconciliationRules.deleteReconciliationRule(ruleId)
      fetchRules()
    } catch (error) {
      console.error('Failed to delete rule:', error)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink-800">对账规则管理</h1>
          <p className="text-ink-500 mt-1">配置和管理自动对账规则</p>
        </div>
        <PaperButton variant="primary" onClick={handleCreateRule}>
          新建规则
        </PaperButton>
      </div>

      <PaperCard>
        <PaperCardHeader>
          <PaperCardTitle>对账规则列表</PaperCardTitle>
        </PaperCardHeader>
        <PaperCardContent>
          <div className="overflow-x-auto">
            <PaperTable>
              <PaperTableHeader>
                <PaperTableRow>
                  <PaperTableCell>规则名称</PaperTableCell>
                  <PaperTableCell>规则类型</PaperTableCell>
                  <PaperTableCell>状态</PaperTableCell>
                  <PaperTableCell>优先级</PaperTableCell>
                  <PaperTableCell>条件数量</PaperTableCell>
                  <PaperTableCell>操作数量</PaperTableCell>
                  <PaperTableCell>操作</PaperTableCell>
                </PaperTableRow>
              </PaperTableHeader>
              <tbody>
                {loading ? (
                  <PaperTableRow>
                    <PaperTableCell colSpan={7} className="text-center py-8 text-ink-400">
                      加载中...
                    </PaperTableCell>
                  </PaperTableRow>
                ) : rules.length === 0 ? (
                  <PaperTableRow>
                    <PaperTableCell colSpan={7} className="text-center py-8 text-ink-400">
                      暂无规则
                    </PaperTableCell>
                  </PaperTableRow>
                ) : (
                  rules.map((rule) => (
                    <PaperTableRow key={rule.id}>
                      <PaperTableCell>{rule.name}</PaperTableCell>
                      <PaperTableCell>
                        <span className={`px-2 py-1 rounded text-sm ${
                          rule.ruleType === 'order' ? 'bg-blue-100 text-blue-800' :
                          rule.ruleType === 'customer' ? 'bg-green-100 text-green-800' :
                          rule.ruleType === 'time_range' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rule.ruleType === 'order' ? '订单匹配' :
                           rule.ruleType === 'customer' ? '客户匹配' :
                           rule.ruleType === 'time_range' ? '时间范围匹配' :
                           rule.ruleType}
                        </span>
                      </PaperTableCell>
                      <PaperTableCell>
                        <span className={`px-2 py-1 rounded text-sm ${
                          rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {rule.enabled ? '启用' : '禁用'}
                        </span>
                      </PaperTableCell>
                      <PaperTableCell>{rule.priority}</PaperTableCell>
                      <PaperTableCell>{rule.conditions.length}</PaperTableCell>
                      <PaperTableCell>{rule.actions.length}</PaperTableCell>
                      <PaperTableCell>
                        <div className="flex gap-2">
                          <button
                            className="text-blue-600 hover:underline"
                            onClick={() => handleEditRule(rule)}
                          >
                            编辑
                          </button>
                          <button
                            className="text-red-600 hover:underline"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            删除
                          </button>
                        </div>
                      </PaperTableCell>
                    </PaperTableRow>
                  ))
                )}
              </tbody>
            </PaperTable>
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* 规则编辑模态框 */}
      <PaperModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? '编辑对账规则' : '新建对账规则'}
        className="max-w-2xl"
      >
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <PaperInput
              label="规则名称"
              value={currentRule.name || ''}
              onChange={(e) => setCurrentRule({ ...currentRule, name: e.target.value })}
              placeholder="输入规则名称"
            />
            <PaperInput
              label="规则描述"
              value={currentRule.description || ''}
              onChange={(e) => setCurrentRule({ ...currentRule, description: e.target.value })}
              placeholder="输入规则描述"
              multiline
              rows={3}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <PaperSelect
              label="规则类型"
              value={currentRule.ruleType || 'order'}
              onChange={(e) => setCurrentRule({ ...currentRule, ruleType: e.target.value as any })}
              options={[
                { value: 'order', label: '订单匹配' },
                { value: 'customer', label: '客户匹配' },
                { value: 'time_range', label: '时间范围匹配' },
              ]}
            />
            <PaperInput
              label="优先级"
              type="number"
              value={currentRule.priority?.toString() || '1'}
              onChange={(e) => setCurrentRule({ ...currentRule, priority: parseInt(e.target.value) })}
              placeholder="输入优先级，数字越小优先级越高"
            />
            <PaperSelect
              label="状态"
              value={currentRule.enabled?.toString() || 'true'}
              onChange={(e) => setCurrentRule({ ...currentRule, enabled: e.target.value === 'true' })}
              options={[
                { value: 'true', label: '启用' },
                { value: 'false', label: '禁用' },
              ]}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <PaperButton variant="outline" onClick={() => setIsModalOpen(false)}>
              取消
            </PaperButton>
            <PaperButton variant="primary" onClick={handleSaveRule}>
              保存
            </PaperButton>
          </div>
        </div>
      </PaperModal>
    </div>
  )
}

export default ReconciliationRulesPage