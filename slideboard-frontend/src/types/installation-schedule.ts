// 安装调度类型定义

// 时间槽
export interface TimeSlot {
  startTime: string
  endTime: string
  isAvailable: boolean
  installationId?: string
  customerName?: string
  projectAddress?: string
}

// 安装调度计划
export interface InstallationSchedule {
  id: string
  installationId: string
  installationNo: string
  customerName: string
  projectAddress: string
  scheduledDate: string
  timeSlot: {
    startTime: string
    endTime: string
  }
  estimatedDuration: number
  installerId?: string
  installerName?: string
  installationTeamId?: string
  installationTeamName?: string
  status: 'scheduled' | 'confirmed' | 'canceled' | 'completed'
  notes?: string
  createdAt: string
  updatedAt: string
}

// 安装调度请求
export interface CreateInstallationScheduleRequest {
  installationId: string
  scheduledDate: string
  startTime: string
  endTime: string
  installerId?: string
  installationTeamId?: string
  notes?: string
}

// 安装调度更新请求
export interface UpdateInstallationScheduleRequest {
  scheduledDate?: string
  startTime?: string
  endTime?: string
  installerId?: string
  installationTeamId?: string
  status?: 'scheduled' | 'confirmed' | 'canceled' | 'completed'
  notes?: string
}

// 安装日历项
export interface InstallationCalendarItem {
  date: string
  day: string
  isToday: boolean
  isWeekend: boolean
  hasInstallations: boolean
  installations: Array<{
    id: string
    installationNo: string
    customerName: string
    startTime: string
    endTime: string
    status: 'scheduled' | 'confirmed' | 'canceled' | 'completed'
  }>
  totalInstallations: number
}

// 安装可用性
export interface InstallationAvailability {
  date: string
  timeSlots: TimeSlot[]
}

// 安装可用性查询请求
export interface InstallationAvailabilityRequest {
  date: string
  installerId?: string
  installationTeamId?: string
  duration: number
}

// 安装路线规划
export interface InstallationRoutePlan {
  id: string
  date: string
  installerId: string
  installerName: string
  installations: Array<{
    id: string
    installationNo: string
    customerName: string
    projectAddress: string
    scheduledTime: string
    sequence: number
    estimatedTravelTime: number
    estimatedTravelDistance: number
  }>
  totalTravelTime: number
  totalTravelDistance: number
  estimatedStartTime: string
  estimatedEndTime: string
  createdAt: string
  updatedAt: string
}

// 安装路线规划请求
export interface CreateInstallationRoutePlanRequest {
  date: string
  installerId: string
  installationIds: string[]
}

// 安装提醒
export interface InstallationReminder {
  id: string
  installationId: string
  type: 'sms' | 'app' | 'wechat'
  recipient: string
  content: string
  scheduledTime: string
  status: 'pending' | 'sent' | 'failed'
  sentTime?: string
  failureReason?: string
  createdAt: string
  updatedAt: string
}

// 安装提醒请求
export interface CreateInstallationReminderRequest {
  installationId: string
  type: 'sms' | 'app' | 'wechat'
  recipient: string
  content: string
  scheduledTime: string
}

// 安装统计
export interface InstallationStatistics {
  totalInstallations: number
  completedInstallations: number
  canceledInstallations: number
  pendingInstallations: number
  averageDuration: number
  averageRating: number
  byStatus: {
    status: string
    count: number
    percentage: number
  }[]
  byType: {
    type: string
    count: number
    percentage: number
  }[]
  byTeam: {
    teamId: string
    teamName: string
    count: number
    averageRating: number
  }[]
  byInstaller: {
    installerId: string
    installerName: string
    count: number
    averageRating: number
  }[]
  byDateRange: {
    date: string
    count: number
  }[]
}

// 安装统计查询请求
export interface InstallationStatisticsRequest {
  startDate: string
  endDate: string
  teamId?: string
  installerId?: string
  installationType?: string
}
