// 日志记录类型定义

// 操作类型
export type LogAction =
  | 'create_measurement'
  | 'update_measurement'
  | 'delete_measurement'
  | 'assign_measurement'
  | 'update_measurement_status'
  | 'upload_measurement_report'
  | 'download_measurement_report'
  | 'create_template'
  | 'update_template'
  | 'delete_template'
  | 'login'
  | 'logout'
  | 'change_password'
  | 'update_user'
  | 'create_user'
  | 'delete_user'
  | 'update_role'
  | 'approve_measurement'
  | 'rate_measurement'
  | 'view_measurement'
  | 'view_analytics'
  | 'export_data'
  | 'import_data'
  | 'copy_slide_share_link'
  | 'delete_slide'
  | 'load_teams'
  | 'create_team'
  | 'invite_team_member'
  | 'remove_team_member'
  | 'update_team_member_role'
  | 'load_collaboration_data'
  | 'invite_collaborator'
  | 'send_comment'
  | 'remove_collaborator'

// 日志级别
export type LogLevel = 'info' | 'warning' | 'error' | 'debug'

// 日志详情类型
export interface MeasurementLogDetails {
  measurementId: string;
  oldStatus?: string;
  newStatus?: string;
  assignedTo?: string;
  reportUrl?: string;
}

export interface TemplateLogDetails {
  templateId: string;
  templateName?: string;
}

export interface UserLogDetails {
  changedFields?: string[];
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}

export interface TeamLogDetails {
  teamId: string;
  memberId?: string;
  memberName?: string;
  oldRole?: string;
  newRole?: string;
}

export interface CollaborationLogDetails {
  collaboratorId: string;
  collaboratorName?: string;
  permission?: string;
}

export interface DataLogDetails {
  recordCount?: number;
  fileName?: string;
  format?: string;
}

export interface SlideLogDetails {
  slideId: string;
  slideName?: string;
  shareLink?: string;
}

// 通用日志详情类型
export type LogDetails = 
  | MeasurementLogDetails
  | TemplateLogDetails
  | UserLogDetails
  | TeamLogDetails
  | CollaborationLogDetails
  | DataLogDetails
  | SlideLogDetails
  | Record<string, unknown>;

// 日志记录
export interface LogEntry {
  id: string;
  userId: string;
  userName: string;
  action: LogAction;
  level: LogLevel;
  resourceId?: string; // 相关资源ID（如测量单ID、模板ID）
  resourceType?: string; // 资源类型
  details?: LogDetails; // 详细信息
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// 数据库日志记录格式（snake_case）
export interface DbLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  action: LogAction;
  level: LogLevel;
  resource_id?: string;
  resource_type?: string;
  details?: LogDetails;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

/**
 * 将客户端日志记录（camelCase）转换为数据库格式（snake_case）
 * @param log 客户端日志记录
 * @returns 数据库格式日志记录
 */
export function toDbLog(log: Omit<LogEntry, 'id' | 'createdAt'> | LogEntry): DbLogEntry {
  return {
    id: 'id' in log ? log.id : `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    user_id: log.userId,
    user_name: log.userName,
    action: log.action,
    level: log.level,
    resource_id: log.resourceId,
    resource_type: log.resourceType,
    details: log.details,
    ip_address: log.ipAddress,
    user_agent: log.userAgent,
    created_at: 'createdAt' in log ? log.createdAt : new Date().toISOString()
  };
}

/**
 * 将数据库日志记录（snake_case）转换为客户端格式（camelCase）
 * @param dbLog 数据库日志记录
 * @returns 客户端日志记录
 */
export function fromDbLog(dbLog: DbLogEntry): LogEntry {
  return {
    id: dbLog.id,
    userId: dbLog.user_id,
    userName: dbLog.user_name,
    action: dbLog.action,
    level: dbLog.level,
    resourceId: dbLog.resource_id,
    resourceType: dbLog.resource_type,
    details: dbLog.details,
    ipAddress: dbLog.ip_address,
    userAgent: dbLog.user_agent,
    createdAt: dbLog.created_at
  };
}

// 日志查询参数
export interface LogQueryParams {
  userId?: string;
  action?: LogAction;
  level?: LogLevel;
  resourceId?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

// 日志查询结果
export interface LogQueryResult {
  logs: LogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 操作描述映射
export const LOG_ACTION_DESCRIPTIONS: Record<LogAction, string> = {
  create_measurement: '创建测量单',
  update_measurement: '更新测量单',
  delete_measurement: '删除测量单',
  assign_measurement: '分配测量单',
  update_measurement_status: '更新测量单状态',
  upload_measurement_report: '上传测量报告',
  download_measurement_report: '下载测量报告',
  create_template: '创建模板',
  update_template: '更新模板',
  delete_template: '删除模板',
  login: '用户登录',
  logout: '用户登出',
  change_password: '修改密码',
  update_user: '更新用户信息',
  create_user: '创建用户',
  delete_user: '删除用户',
  update_role: '更新角色',
  approve_measurement: '审批测量单',
  rate_measurement: '评价测量单',
  view_measurement: '查看测量单',
  view_analytics: '查看数据分析',
  export_data: '导出数据',
  import_data: '导入数据',
  copy_slide_share_link: '复制幻灯片分享链接',
  delete_slide: '删除幻灯片',
  load_teams: '加载团队列表',
  create_team: '创建团队',
  invite_team_member: '邀请团队成员',
  remove_team_member: '移除团队成员',
  update_team_member_role: '更新团队成员角色',
  load_collaboration_data: '加载协作数据',
  invite_collaborator: '邀请协作者',
  send_comment: '发送评论',
  remove_collaborator: '移除协作者'
}

// 日志级别颜色映射
export const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  info: 'text-blue-600 bg-blue-50',
  warning: 'text-yellow-600 bg-yellow-50',
  error: 'text-red-600 bg-red-50',
  debug: 'text-purple-600 bg-purple-50'
}
