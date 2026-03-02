import { AuditService } from '@/shared/services/audit-service';
import type { DB, DbTransaction } from '@/shared/api/db';

/**
 * ============================================================================
 * L2C Auth Module: Authentication Audit Service
 * ============================================================================
 * 本文件负责提供身份验证和会话流转环节的核心安全审计封装。
 */

/**
 * 登录操作成功记录参数接口定义
 *
 * @description
 * - 当且仅当用户凭借正确的密码（或魔术链接、单点登录凭证）成功换取到了应用内部通行证后发生。
 */
interface LoginSuccessOptions {
  /**
   * @property {string} userId - 完成登录的用户全系统唯一序列主键
   */
  userId: string;
  /**
   * @property {string} tenantId - 此用户目前归落的实体租户隔离域的主键
   */
  tenantId: string;
  /**
   * @property {string} [userAgent] - 登录环境浏览器及操作系统的 User Agent 探针签名字串，用于后续风控与排异
   */
  userAgent?: string;
}

/**
 * 登录操作遭拒记录参数接口定义
 *
 * @description
 * - 针对密码不对、账户被冻结、IP频控等所有阻止鉴权核发签章的分支。
 */
interface LoginFailedOptions {
  /**
   * @property {string} username - 尝试进行嗅探突防或常规找回登录的账号实体名，必须脱敏录入！
   */
  username: string;
  /**
   * @property {string} reason - 遭拒的内部判定根本原因，如 'credentials' 或 'rate_limit'
   */
  reason: string;
  /**
   * @property {string} [userAgent] - 失败终端所带的硬件环境报文签名
   */
  userAgent?: string;
}

/**
 * 用户主动或被动登出终止记录参数接口定义
 *
 * @description
 * - 清理所有本地会话存储空间，彻底截断该 JWT 和 session 凭证的回溯有效性。
 */
interface LogoutOptions {
  /** @property {string} userId - 发起销毁登录态目标的用户身份明码 */
  userId: string;
  /** @property {string} tenantId - 限定此清理所作用的租户空间 */
  tenantId: string;
}

/**
 * 找回密码流程前置门禁请求记录参数接口
 *
 * @description
 * - 当访客透过忘记密码页向服务器发起密码找回门票请求时。
 */
interface PasswordResetRequestedOptions {
  /** @property {string} userId - 被核实在内部有映射的确切用户 ID（若为盲敲诈欺等查无此人，不会走入这一支日志的） */
  userId: string;
  /** @property {string} tenantId - 用户本身挂载的安全隔离租户 */
  tenantId: string;
  /** @property {string} email - 用于寻回的通讯邮箱线路终端 */
  email: string;
}

/**
 * 找回密码流程实质结束斩杀记录参数接口
 *
 * @description
 * - 用合法寻回门票换取了全盘密码字段更新。
 */
interface PasswordResetCompletedOptions {
  /** @property {string} userId - 完成密码换绑的用户 ID 主体 */
  userId: string;
  /** @property {string} tenantId - 重置发生时的上下文租户域边界 */
  tenantId: string;
}

/**
 * 魔术链接登录特权调用参数接口
 *
 * @description
 * - 指后台特许管理员人工干预直接给出的，不依赖于原生账密的特权越界通道行为。须列为重点合规抽查部分。
 */
interface MagicLinkLoginOptions {
  /** @property {string} userId - 通过一键通成功绕过口令限制登入的用户 */
  userId: string;
  /** @property {string} tenantId - 执行提权的租户圈子实体 */
  tenantId: string;
  /** @property {string} [generatedBy] - 具体发放这根魔术手杖给他的高级权限管理员标识（追溯人偶链条） */
  generatedBy?: string;
}

/**
 * 身份验证全阶段强合规审计记录服务 (AuthAuditService)
 *
 * @description
 * AuthAuditService 为应用中的身份处理层级提供强类型的、预格式化的日志接入点。
 * 在内部通过转接到底层基础的 AuditService，落实所有数据的 JSON 封箱操作。
 * 在开发或代码走查时，请务必保证：密码密文、加密盐、各类 token 等，绝对不可经由本服务传递至普通结构体中入参。
 */
export class AuthAuditService {
  /**
   * 记录登录成功审计通报日志
   *
   * @description 标识一个安全期会话的发端。
   *
   * @param {DB | DbTransaction} db - 活动的持久游标，可以是单次 DB 对象或者 Transaction 的句柄对象
   * @param {LoginSuccessOptions} options - 从鉴权拦截器萃取的数据切片对象
   *
   * @returns {Promise<void>} 挂载进系统库表的异步确认过程
   */
  static async logLoginSuccess(
    db: DB | DbTransaction,
    { userId, tenantId, userAgent }: LoginSuccessOptions
  ) {
    return AuditService.log(db, {
      tableName: 'users',
      recordId: userId,
      action: 'LOGIN',
      tenantId,
      userId,
      details: {
        userAgent,
        authType: 'credentials',
      },
    });
  }

  /**
   * 记录魔术免密登录特令下达日志
   *
   * @description 管理员代发快速授权导致登录凭证变更转移或核发。
   *
   * @param {DB | DbTransaction} db - 底层驱动游标/事务
   * @param {MagicLinkLoginOptions} options - 魔术连线所涉及的发端人和落脚人双方信息
   *
   * @returns {Promise<void>} 挂载过程
   */
  static async logMagicLinkLogin(
    db: DB | DbTransaction,
    { userId, tenantId, generatedBy }: MagicLinkLoginOptions
  ) {
    return AuditService.log(db, {
      tableName: 'users',
      recordId: userId,
      action: 'MAGIC_LOGIN',
      tenantId,
      userId,
      details: {
        authType: 'magic_link',
        generatedBy,
      },
    });
  }

  /**
   * 记录登录探雷失败或常规拒登日志
   *
   * @description
   * 高风险信息收集点：需小心防范把原始明文密码当做 `reason` 放入。所有传进来的 `username` 必须由调用方先做基础掩码脱敏。
   *
   * @param {DB | DbTransaction} db - 底层游标
   * @param {LoginFailedOptions} options - 防风控体系萃取的特征值及拒接回退源文
   *
   * @returns {Promise<void>} 落日志入库
   */
  static async logLoginFailed(
    db: DB | DbTransaction,
    { username, reason, userAgent }: LoginFailedOptions
  ) {
    return AuditService.log(db, {
      tableName: 'users',
      recordId: 'auth',
      action: 'LOGIN_FAILED',
      tenantId: 'system',
      userId: 'system',
      details: {
        usernameMasked: username,
        reason,
        userAgent,
      },
    });
  }

  /**
   * 记录主控注销清退动作通报
   *
   * @description 清空凭证。作为日常用户在端上的生命周期收尾。
   *
   * @param {DB | DbTransaction} db - 数据库访问控制类驱动
   * @param {LogoutOptions} options - 含主谓宾识别的基本实体标识
   *
   * @returns {Promise<void>} 落日志入库
   */
  static async logLogout(db: DB | DbTransaction, { userId, tenantId }: LogoutOptions) {
    return AuditService.log(db, {
      tableName: 'users',
      recordId: userId,
      action: 'LOGOUT',
      tenantId,
      userId,
    });
  }

  /**
   * 记录重置链路请求发起环节
   *
   * @description 作为风控中非常容易遭受自动机器人暴库发邮箱轰炸的起点口。
   *
   * @param {DB | DbTransaction} db - 数据库事务对象
   * @param {PasswordResetRequestedOptions} options - 发起人对象体集
   *
   * @returns {Promise<void>} 落库存档
   */
  static async logPasswordResetRequested(
    db: DB | DbTransaction,
    { userId, tenantId, email }: PasswordResetRequestedOptions
  ) {
    return AuditService.log(db, {
      tableName: 'users',
      recordId: userId,
      action: 'PASSWORD_RESET_REQUESTED',
      tenantId,
      userId,
      details: {
        emailMasked: email.replace(/(.{2}).*(.{2}@)/, '$1***$2'),
      },
    });
  }

  /**
   * 记录重置链路密码真实落库终点
   *
   * @description 该动作意味着旧的哈希串已被彻底翻页，同时任何原密码对应的记忆库将被认为已经不能工作。
   *
   * @param {DB | DbTransaction} db - 数据库挂件上下文
   * @param {PasswordResetCompletedOptions} options - 操作完成落地标量
   *
   * @returns {Promise<void>} 落库存档
   */
  static async logPasswordResetCompleted(
    db: DB | DbTransaction,
    { userId, tenantId }: PasswordResetCompletedOptions
  ) {
    return AuditService.log(db, {
      tableName: 'users',
      recordId: userId,
      action: 'PASSWORD_RESET_COMPLETED',
      tenantId,
      userId,
    });
  }
}
