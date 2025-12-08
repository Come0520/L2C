// 安装单类型定义

// 安装单状态类型
export type InstallationStatus = 
  | 'pending'      // 待安排
  | 'assigning'    // 分配中
  | 'waiting'      // 待上门
  | 'installing'   // 安装中
  | 'confirming'   // 待验收
  | 'completed'    // 已完成
  | 'cancelled'    // 已取消
  | 'rework'       // 返工

// 安装类型
export type InstallationType = 
  | 'standard'     // 标准安装
  | 'complex'      // 复杂安装
  | 'supplement'   // 补装
  | 'repair'       // 维修安装
  | 'modification' // 改装

// 验收状态
export type AcceptanceStatus = 
  | 'pending'      // 待验收
  | 'passed'       // 验收通过
  | 'failed'       // 验收失败
  | 'partial'      // 部分通过

// 环境要求
export interface EnvironmentRequirements {
  powerSupply: boolean
  waterSupply: boolean
  ventilation: boolean
  lighting: boolean
  other?: string
}

// 安装结果
export interface InstallationResult {
  installationStartTime: string
  installationEndTime: string
  actualDuration: number
  materialsUsed: Array<{
    name: string
    quantity: number
    unit: string
  }>
  toolsUsed: Array<{
    name: string
    status: 'normal' | 'damaged' | 'lost'
  }>
  problemsEncountered: Array<{
    description: string
    solution: string
    resolved: boolean
  }>
  notes: string
}

// 安装质量检查项
export interface QualityCheckItem {
  id: string
  name: string
  standard: string
  result: 'pass' | 'fail' | 'na'
  notes?: string
  photoUrl?: string
}

// 安装质量检查
export interface QualityCheck {
  id: string
  installationId: string
  checkDate: string
  checkerId: string
  checkerName: string
  checkItems: QualityCheckItem[]
  overallResult: 'pass' | 'fail' | 'partial'
  notes?: string
  createdAt: string
  updatedAt: string
}

// 客户反馈
export interface CustomerFeedback {
  id: string
  installationId: string
  customerId: string
  customerName: string
  rating: number // 1-5
  feedback: string
  createdAt: string
  updatedAt: string
}

// 安装单类型
export interface Installation {
  id: string
  installationNo: string
  salesOrderId: string
  salesOrderNo: string
  measurementId: string
  customerId: string
  customerName: string
  customerPhone: string
  projectAddress: string
  installationContact: string
  installationPhone: string
  installationType: InstallationType
  status: InstallationStatus
  acceptanceStatus: AcceptanceStatus
  scheduledAt: string
  appointmentTimeSlot: string
  estimatedDuration: number
  actualDuration?: number
  installerId?: string
  installerName?: string
  installationTeamId?: string
  installationTeamName?: string
  environmentRequirements: EnvironmentRequirements
  requiredTools: string[]
  requiredMaterials: string[]
  specialInstructions?: string
  installationData: InstallationResult
  installationPhotos?: string[]
  beforePhotos?: string[]
  afterPhotos?: string[]
  qualityRating?: number
  customerSatisfaction?: number
  acceptanceNotes?: string
  customerSignature?: string
  exceptionReason?: string
  reworkReason?: string
  reworkCount: number
  installationFee: number
  additionalFee: number
  materialFee: number
  feeNotes?: string
  qualityCheck?: QualityCheck
  customerFeedback?: CustomerFeedback
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

// 安装单创建请求类型
export interface CreateInstallationRequest {
  salesOrderId: string
  measurementId?: string
  installationType?: InstallationType
  scheduledAt: string
  appointmentTimeSlot: string
  estimatedDuration: number
  installationContact: string
  installationPhone: string
  installationAddress: string
  installerId?: string
  installationTeamId?: string
  environmentRequirements: EnvironmentRequirements
  requiredTools: string[]
  requiredMaterials: string[]
  specialInstructions?: string
}

// 安装单更新请求类型
export interface UpdateInstallationRequest {
  status?: InstallationStatus
  acceptanceStatus?: AcceptanceStatus
  installerId?: string
  installationTeamId?: string
  scheduledAt?: string
  appointmentTimeSlot?: string
  estimatedDuration?: number
  installationData?: InstallationResult
  installationPhotos?: string[]
  beforePhotos?: string[]
  afterPhotos?: string[]
  qualityRating?: number
  customerSatisfaction?: number
  acceptanceNotes?: string
  customerSignature?: string
  exceptionReason?: string
  reworkReason?: string
  reworkCount?: number
  installationFee?: number
  additionalFee?: number
  materialFee?: number
  feeNotes?: string
  completedAt?: string
}

// 安装单列表项
export interface InstallationListItem {
  id: string
  installationNo: string
  salesOrderNo: string
  customerName: string
  projectAddress: string
  installationType: InstallationType
  status: InstallationStatus
  acceptanceStatus: AcceptanceStatus
  scheduledAt: string
  installerName?: string
  installationTeamName?: string
  qualityRating?: number
  customerSatisfaction?: number
  createdAt: string
  updatedAt: string
}

// 安装调度项
export interface InstallationScheduleItem {
  id: string
  installationNo: string
  customerName: string
  projectAddress: string
  scheduledAt: string
  appointmentTimeSlot: string
  installerName?: string
  installationTeamName?: string
  installationType: InstallationType
  status: InstallationStatus
}
