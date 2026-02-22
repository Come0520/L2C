/**
 * 微信小程序订阅消息服务
 *
 * 用于发送租户审批、订单状态、任务分配等通知
 *
 * 使用前：
 * 1. 在微信小程序后台申请订阅消息模板
 * 2. 配置 .env 环境变量
 * 3. 确保用户已绑定 wechatOpenId
 */

import { db } from '@/shared/api/db';
import { users, tenants, customers } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/shared/lib/logger';

// ============ 类型定义 ============

interface WeChatApiResponse {
  errcode: number;
  errmsg: string;
  msgid?: number;
}

interface SubscribeMessageData {
  [key: string]: { value: string };
}

// Access Token 缓存
let accessTokenCache: { token: string; expiresAt: number } | null = null;

// ============ 核心功能 ============

/**
 * 获取小程序 Access Token
 */
async function getAccessToken(): Promise<string> {
  // 使用缓存
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now()) {
    return accessTokenCache.token;
  }

  // 优先使用 WX_APPID，兼容 WECHAT_MINI_APPID
  const appId = process.env.WX_APPID || process.env.WECHAT_MINI_APPID;
  const appSecret = process.env.WX_APPSECRET || process.env.WECHAT_MINI_SECRET;

  if (!appId || !appSecret) {
    throw new Error('微信小程序 AppID/AppSecret 未配置');
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.access_token) {
    accessTokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 300) * 1000, // 提前5分钟过期
    };
    return data.access_token;
  }

  throw new Error(`获取 Access Token 失败: ${data.errcode} - ${data.errmsg}`);
}

/**
 * 发送订阅消息
 */
async function sendSubscribeMessage(
  openId: string,
  templateId: string,
  data: SubscribeMessageData,
  page?: string
): Promise<boolean> {
  try {
    const accessToken = await getAccessToken();

    const requestBody = {
      touser: openId,
      template_id: templateId,
      page: page || 'pages/index/index',
      miniprogram_state: process.env.NODE_ENV === 'production' ? 'formal' : 'developer',
      lang: 'zh_CN',
      data,
    };

    const response = await fetch(
      `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    const result: WeChatApiResponse = await response.json();

    if (result.errcode === 0) {
      logger.info(`[微信订阅消息] 发送成功, openId: ${openId.slice(0, 10)}...`);
      return true;
    } else {
      console.error(`[微信订阅消息] 发送失败: ${result.errcode} - ${result.errmsg}`);
      // Token 过期，清除缓存
      if (result.errcode === 40001 || result.errcode === 42001) {
        accessTokenCache = null;
      }
      return false;
    }
  } catch (error) {
    console.error('[微信订阅消息] 发送异常:', error);
    return false;
  }
}

// ============ 业务通知函数 ============

/**
 * 发送租户审批通过通知
 */
export async function notifyTenantApproved(tenantId: string): Promise<boolean> {
  const templateId = process.env.WECHAT_TEMPLATE_TENANT_APPROVED;
  if (!templateId) {
    logger.info('[微信订阅消息] 租户审批通过模板未配置，跳过发送');
    return false;
  }

  // 获取租户信息
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });

  if (!tenant) return false;

  // 获取申请人 OpenID
  const applicant = await db.query.users.findFirst({
    where: eq(users.tenantId, tenantId),
    columns: { wechatOpenId: true, name: true },
  });

  if (!applicant?.wechatOpenId) {
    logger.info('[微信订阅消息] 申请人未绑定微信，跳过发送');
    return false;
  }

  // 发送消息
  // 模板数据格式需要根据实际申请的模板调整
  return sendSubscribeMessage(
    applicant.wechatOpenId,
    templateId,
    {
      thing1: { value: tenant.name.slice(0, 20) }, // 企业名称
      phrase2: { value: '已通过' }, // 审批状态
      time3: { value: new Date().toLocaleString('zh-CN') }, // 审批时间
      thing4: { value: '您的入驻申请已通过，请登录系统' }, // 备注
    },
    'pages/login/index' // 跳转页面
  );
}

/**
 * 发送租户审批拒绝通知
 */
export async function notifyTenantRejected(tenantId: string, reason: string): Promise<boolean> {
  const templateId = process.env.WECHAT_TEMPLATE_TENANT_REJECTED;
  if (!templateId) {
    logger.info('[微信订阅消息] 租户审批拒绝模板未配置，跳过发送');
    return false;
  }

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });

  if (!tenant) return false;

  const applicant = await db.query.users.findFirst({
    where: eq(users.tenantId, tenantId),
    columns: { wechatOpenId: true },
  });

  if (!applicant?.wechatOpenId) return false;

  return sendSubscribeMessage(applicant.wechatOpenId, templateId, {
    thing1: { value: tenant.name.slice(0, 20) },
    phrase2: { value: '未通过' },
    time3: { value: new Date().toLocaleString('zh-CN') },
    thing4: { value: reason.slice(0, 20) || '详情请咨询客服' },
  });
}

/**
 * 发送订单状态变更通知
 */
export async function notifyOrderStatusChange(
  userId: string,
  orderNo: string,
  status: string,
  remark?: string
): Promise<boolean> {
  const templateId = process.env.WECHAT_TEMPLATE_ORDER_STATUS;
  if (!templateId) return false;

  let openId = '';
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { wechatOpenId: true },
  });
  if (user?.wechatOpenId) openId = user.wechatOpenId;

  if (!openId) {
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, userId),
      columns: { wechatOpenId: true },
    });
    if (customer?.wechatOpenId) openId = customer.wechatOpenId;
  }

  if (!openId) return false;

  return sendSubscribeMessage(
    openId,
    templateId,
    {
      character_string1: { value: orderNo.slice(0, 32) }, // 订单号
      phrase2: { value: status.slice(0, 5) }, // 状态
      time3: { value: new Date().toLocaleString('zh-CN') },
      thing4: { value: remark?.slice(0, 20) || '订单状态已更新' },
    },
    `pages/order/detail?orderNo=${orderNo}`
  );
}

/**
 * 发送任务分配通知
 */
export async function notifyTaskAssigned(
  userId: string,
  taskTitle: string,
  taskType: string,
  deadline?: string
): Promise<boolean> {
  const templateId = process.env.WECHAT_TEMPLATE_TASK_ASSIGN;
  if (!templateId) return false;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { wechatOpenId: true },
  });

  if (!user?.wechatOpenId) return false;

  return sendSubscribeMessage(
    user.wechatOpenId,
    templateId,
    {
      thing1: { value: taskTitle.slice(0, 20) },
      thing2: { value: taskType.slice(0, 20) },
      time3: { value: deadline || '尽快处理' },
      thing4: { value: '您有新任务，请及时处理' },
    },
    'pages/task/list'
  );
}
