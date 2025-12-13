// 标准API错误响应格式
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;           // 错误代码，如 'VALIDATION_ERROR'
    message: string;        // 用户友好的错误消息
    details?: unknown;      // 详细的错误信息（开发环境）
    timestamp: string;      // 错误发生时间
    path?: string;          // 请求路径
    requestId?: string;     // 请求ID，用于追踪
  };
}

// 标准API成功响应格式
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    version: string;
  };
}

// API响应联合类型
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// 常见错误代码枚举
export enum ApiErrorCode {
  // 通用错误
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  FORBIDDEN = 'FORBIDDEN',
  UNAUTHORIZED = 'UNAUTHORIZED',
  BAD_REQUEST = 'BAD_REQUEST',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  MAINTENANCE = 'MAINTENANCE',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',
  
  // 验证错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_FORMAT = 'INVALID_FIELD_FORMAT',
  INVALID_FIELD_VALUE = 'INVALID_FIELD_VALUE',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',
  
  // 业务逻辑错误
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  DEPENDENCY_FAILED = 'DEPENDENCY_FAILED',
  
  // 认证和授权错误
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  
  // 数据相关错误
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  DATA_CONFLICT = 'DATA_CONFLICT',
  DATA_INVALID = 'DATA_INVALID',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  
  // 文件相关错误
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  FILE_PROCESSING_FAILED = 'FILE_PROCESSING_FAILED',
  
  // 第三方服务错误
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  API_RATE_LIMITED = 'API_RATE_LIMITED',
  API_CONNECTION_FAILED = 'API_CONNECTION_FAILED',
  
  // 系统错误
  DATABASE_ERROR = 'DATABASE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // 安全错误
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  CSRF_ATTACK = 'CSRF_ATTACK',
  XSS_ATTACK = 'XSS_ATTACK',
  SQL_INJECTION = 'SQL_INJECTION',
  
  // 其他错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  DEPRECATED_API = 'DEPRECATED_API'
}

// API请求上下文
export interface ApiRequestContext {
  requestId: string;
  path: string;
  method: string;
  timestamp: string;
  userAgent?: string;
  clientIp?: string;
  userId?: string;
  tenantId?: string;
}

// API日志条目
export interface ApiLogEntry {
  context: ApiRequestContext;
  response: ApiResponse<unknown>;
  latency: number;
  statusCode: number;
}

// API版本信息
export interface ApiVersionInfo {
  version: string;
  buildDate: string;
  commitHash: string;
  environment: string;
}
