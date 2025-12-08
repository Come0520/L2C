// 安装团队类型定义

// 安装团队状态
export type InstallationTeamStatus = 'active' | 'inactive' | 'on_leave' | 'suspended'

// 安装师傅状态
export type InstallerStatus = 'active' | 'inactive' | 'on_leave' | 'suspended' | 'busy'

// 技能等级
export type SkillLevel = 'junior' | 'senior' | 'expert'

// 安装师傅技能
export interface InstallerSkill {
  id: string
  name: string
  level: SkillLevel
  yearsOfExperience: number
}

// 安装师傅资质
export interface InstallerQualification {
  id: string
  name: string
  issuedBy: string
  issueDate: string
  expiryDate?: string
  documentUrl?: string
}

// 安装师傅工作时间
export interface InstallerWorkTime {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  startTime: string
  endTime: string
  isWorking: boolean
}

// 安装师傅
export interface Installer {
  id: string
  userId: string
  name: string
  phone: string
  avatar?: string
  teamId?: string
  teamName?: string
  status: InstallerStatus
  skillLevel: SkillLevel
  skills: InstallerSkill[]
  qualifications: InstallerQualification[]
  yearsOfExperience: number
  workTime: InstallerWorkTime[]
  currentLocation?: {
    latitude: number
    longitude: number
    lastUpdated: string
  }
  performanceRating: number
  completedInstallations: number
  canceledInstallations: number
  reworkInstallations: number
  totalWorkingHours: number
  createdAt: string
  updatedAt: string
}

// 安装团队
export interface InstallationTeam {
  id: string
  name: string
  status: InstallationTeamStatus
  teamLeaderId: string
  teamLeaderName: string
  teamMembers: Array<{
    installerId: string
    name: string
    skillLevel: SkillLevel
  }>
  totalMembers: number
  completedInstallations: number
  averageRating: number
  createdAt: string
  updatedAt: string
}

// 安装团队创建请求
export interface CreateInstallationTeamRequest {
  name: string
  teamLeaderId: string
  teamMemberIds: string[]
}

// 安装团队更新请求
export interface UpdateInstallationTeamRequest {
  name?: string
  status?: InstallationTeamStatus
  teamLeaderId?: string
  teamMemberIds?: string[]
}

// 安装师傅创建请求
export interface CreateInstallerRequest {
  userId: string
  name: string
  phone: string
  skillLevel: SkillLevel
  yearsOfExperience: number
  workTime: InstallerWorkTime[]
  teamId?: string
}

// 安装师傅更新请求
export interface UpdateInstallerRequest {
  name?: string
  phone?: string
  avatar?: string
  status?: InstallerStatus
  skillLevel?: SkillLevel
  skills?: InstallerSkill[]
  qualifications?: InstallerQualification[]
  yearsOfExperience?: number
  workTime?: InstallerWorkTime[]
  teamId?: string
}

// 安装团队列表项
export interface InstallationTeamListItem {
  id: string
  name: string
  status: InstallationTeamStatus
  teamLeaderName: string
  totalMembers: number
  completedInstallations: number
  averageRating: number
  createdAt: string
  updatedAt: string
}

// 安装师傅列表项
export interface InstallerListItem {
  id: string
  name: string
  status: InstallerStatus
  skillLevel: SkillLevel
  teamName?: string
  performanceRating: number
  completedInstallations: number
  createdAt: string
}
