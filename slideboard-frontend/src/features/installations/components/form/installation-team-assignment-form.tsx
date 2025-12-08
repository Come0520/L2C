'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PaperSelect } from '@/components/ui/paper-select'
import { PaperTextarea } from '@/components/ui/paper-textarea'
import { PaperButton } from '@/components/ui/paper-button'
import { installationTeamService } from '@/services/installation-team.client'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

// Form schema using Zod
const installationTeamAssignmentSchema = z.object({
  installationTeamId: z.string().min(1, '安装团队不能为空'),
  installerId: z.string().optional(),
  assignmentNotes: z.string().optional()
})

type InstallationTeamAssignmentFormData = z.infer<typeof installationTeamAssignmentSchema>

interface InstallationTeamAssignmentFormProps {
  installationId: string
  currentTeamId?: string
  currentInstallerId?: string
  onSubmit: (data: InstallationTeamAssignmentFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export const InstallationTeamAssignmentForm: React.FC<InstallationTeamAssignmentFormProps> = ({
  currentTeamId,
  currentInstallerId,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [teams, setTeams] = useState<Array<{ value: string; label: string }>>([])
  const [installers, setInstallers] = useState<Array<{ value: string; label: string }>>([])
  const [teamLoading, setTeamLoading] = useState(false)
  const [installerLoading, setInstallerLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<InstallationTeamAssignmentFormData>({
    resolver: zodResolver(installationTeamAssignmentSchema),
    defaultValues: {
      installationTeamId: currentTeamId || '',
      installerId: currentInstallerId || ''
    }
  })

  const selectedTeamId = watch('installationTeamId')

  const fetchTeams = useCallback(async () => {
    setTeamLoading(true)
    try {
      const result = await installationTeamService.getInstallationTeams()
      setTeams(result.teams.map((team: any) => ({ value: team.id, label: team.name })))
    } catch (_) {
    } finally {
      setTeamLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const refetchInstallers = useCallback(async () => {
    if (selectedTeamId) {
      setInstallerLoading(true)
      try {
        const team = await installationTeamService.getInstallationTeamById(selectedTeamId)
        setInstallers(team.teamMembers.map((member: any) => ({ value: member.installerId, label: member.name })))
      } catch (_) {
        setInstallers([])
      } finally {
        setInstallerLoading(false)
      }
    } else {
      setInstallers([])
    }
  }, [selectedTeamId])

  useEffect(() => {
    refetchInstallers()
  }, [refetchInstallers])

  useRealtimeSubscription({
    table: 'installation_teams',
    event: '*',
    channelName: 'installation_teams:list',
    handler: () => {
      fetchTeams()
    }
  })

  useRealtimeSubscription({
    table: 'installation_team_members',
    event: '*',
    filter: selectedTeamId ? `team_id=eq.${selectedTeamId}` : undefined,
    channelName: selectedTeamId ? `installation_team_members:${selectedTeamId}` : 'installation_team_members:list',
    handler: () => {
      refetchInstallers()
    }
  })

  useRealtimeSubscription({
    table: 'installers',
    event: '*',
    filter: selectedTeamId ? `team_id=eq.${selectedTeamId}` : undefined,
    channelName: selectedTeamId ? `installers:${selectedTeamId}` : 'installers:list',
    handler: () => {
      refetchInstallers()
    }
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">分配安装团队</h3>

        <div>
          <PaperSelect
            label="安装团队"
            error={errors.installationTeamId?.message}
            options={teams}
            loading={teamLoading}
            {...register('installationTeamId')}
          />
        </div>

        {installers.length > 0 && (
          <div>
            <PaperSelect
              label="安装人员"
              error={errors.installerId?.message}
              options={installers}
              loading={installerLoading}
              {...register('installerId')}
            />
          </div>
        )}

        <div>
          <PaperTextarea
            label="分配备注"
            placeholder="请输入分配的原因或备注信息..."
            error={errors.assignmentNotes?.message}
            rows={4}
            {...register('assignmentNotes')}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <PaperButton
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          取消
        </PaperButton>
        <PaperButton
          type="submit"
          variant="primary"
          loading={loading}
        >
          分配团队
        </PaperButton>
      </div>
    </form>
  )
}
