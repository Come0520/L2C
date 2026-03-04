export enum ErrorCode {
  /** 客户端错误参数 (400) */
  BAD_REQUEST = 400,
  /** 未登录或登录过期 (401) */
  UNAUTHORIZED = 401,
  /** 无权限执行此操作 (403) */
  FORBIDDEN = 403,
  /** 请求的资源不存在 (404) */
  NOT_FOUND = 404,
  /** 业务冲突或重复 (409) */
  CONFLICT = 409,
  /** 过于频繁的请求 (429) */
  TOO_MANY_REQUESTS = 429,
  /** 服务器内部错误 (500) */
  INTERNAL_SERVER_ERROR = 500,

  // ===== 预留示例：未来可零成本演进为 5 位数业务错误码 =====
  // INVALID_PARAM = 40001,
  // TOKEN_EXPIRED = 40101,
  // PERMISSION_DENIED = 40301,
  // TASK_NOT_FOUND = 40401,
  // STATUS_CONFLICT = 40901
}

/**
 * 将常见的错误信息映射到标准的 ErrorCode 上
 * 如果之后业务需要 5 位数错误码，可以直接按消息段映射。
 */
export function inferErrorCode(
  msg: string,
  defaultCode: number = ErrorCode.BAD_REQUEST
): ErrorCode {
  if (msg.includes('未登录') || msg.includes('过期') || msg.includes('Token')) {
    return ErrorCode.UNAUTHORIZED;
  }
  if (msg.includes('权限') || msg.includes('只能')) {
    return ErrorCode.FORBIDDEN;
  }
  if (msg.includes('不存在') || msg.includes('未找到')) {
    return ErrorCode.NOT_FOUND;
  }
  if (msg.includes('服务器') || msg.includes('内部错误') || msg.includes('异常')) {
    return ErrorCode.INTERNAL_SERVER_ERROR;
  }
  return defaultCode;
}
