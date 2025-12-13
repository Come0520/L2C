'use client'

import { PaperButton } from '@/components/ui/paper-button'
import { LEAD_STATUS_CONFIG } from '@/constants/lead-status'
import { cn } from '@/lib/utils'
import { Lead } from '@/shared/types/lead'

interface LeadActionButtonsProps {
  lead: Lead
  currentUserRole: string
  onAction: (action: string, lead: Lead) => void
  className?: string
}

type LeadAction = {
  key: string
  label: string
  permission?: string[]
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'error' | 'info'
}

export default function LeadActionButtons({ lead, currentUserRole, onAction, className }: LeadActionButtonsProps) {
  const statusConfig = LEAD_STATUS_CONFIG[lead.status]
  if (!statusConfig || !statusConfig.actions) return null

  // 检查权限
  const hasPermission = (action: LeadAction) => {
    try {
      // 如果没有配置权限，则默认有操作权限
      if (!action.permission || action.permission.length === 0) {
        return true
      }

      // 检查当前用户角色是否在允许的权限列表中
      const hasRolePermission = action.permission.includes(currentUserRole)

      // 系统管理员拥有所有权限
      const isSuperAdmin = currentUserRole === 'LEAD_ADMIN'

      return hasRolePermission || isSuperAdmin
    } catch (_) {
      // 出错时默认拒绝操作，确保安全
      return false
    }
  }

  const availableActions = (statusConfig.actions as LeadAction[]).filter(action => hasPermission(action))

  if (availableActions.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {availableActions.map((action) => (
        <PaperButton
          key={action.key}
          variant={action.variant}
          size="sm"
          onClick={() => onAction(action.key, lead)}
        >
          {action.label}
        </PaperButton>
      ))}
    </div>
  )
}
