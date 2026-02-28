/**
 * 小程序 API Zod 验证 Schema 集合
 *
 * 所有小程序 API 路由的输入验证 Schema 统一在此定义，各路由文件按需引用。
 * 包含完整的 TSDoc 和 .describe()，旨在为前端提供自文档化 (Self-Documenting) 的 API 定义。
 */
import { z } from 'zod';

// ===================== 通用 =====================

/**
 * UUID 格式验证
 */
const uuidSchema = z.string().uuid('无效的 ID 格式').describe('标准的 36 位 UUID 字符串');

/**
 * 分页请求通用参数
 * @property {number} page - 请求的当前页码，默认为 1
 * @property {number} limit - 每页返回的数据条数，最大 100，默认 50
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('当前请求的页数'),
  limit: z.coerce.number().int().min(1).max(100).default(50).describe('每页查询数量上限'),
  cursor: z
    .string()
    .optional()
    .describe('游标指针 (以某条记录的特征值为主键)，用于替代 offset 进行百万级极限深分页'),
});

// ===================== 认证 (Auth) =====================

/**
 * 密码登录请求参数
 * @property {string} account - 登录账号 (手机号或用户名)
 * @property {string} password - 登录明文密码
 */
export const LoginSchema = z.object({
  account: z.string().min(1, '请输入账号').max(100).describe('员工账号/手机号'),
  password: z.string().min(1, '请输入密码').max(100).describe('登录密码'),
});

/**
 * 微信授权登录请求参数
 * @property {string} code - 调用 wx.login() 获取的临时登录凭证
 */
export const WxLoginSchema = z.object({
  code: z.string().min(1, '缺少 code 参数').describe('微信前端获取的票据 code'),
});

/**
 * 微信手机号授权解密参数
 * @property {string} code - 调用 getPhoneNumber() 获取的手机号授权动态令牌
 * @property {string} [openId] - 用户的微信 OpenID (可选)
 */
export const DecryptPhoneSchema = z.object({
  code: z.string().min(1, '缺少 code').describe('微信前端获取的手机号获取 code'),
  openId: z.string().optional().describe('用户的微信 OpenID'),
});

// ===================== 邀请 (Invite) =====================

/**
 * 接受加入租户邀请请求
 * @property {string} code - 管理员生成的 6 位邀请码
 * @property {string} registerToken - 从 wx-login 获取的注册短口令
 */
export const InviteAcceptSchema = z.object({
  code: z.string().min(1, '请输入邀请码').max(50).describe('分配给受邀员工的加入凭证码'),
  registerToken: z.string().min(1, '缺少注册鉴权 Token').describe('通过 wx-login 获得的防伪造令牌'),
});

/**
 * 管理员生成团队邀请码请求
 * @property {string} role - 允许受邀员工获得的系统角色
 * @property {number} [expiresInDays] - 邀请码的有效天数，默认 7 天
 */
export const InviteGenerateSchema = z.object({
  role: z
    .string()
    .min(1, '请选择角色')
    .describe('如 SALES(销售)、MEASURER(测量工)、INSTALLER(安装工)'),
  expiresInDays: z.number().int().min(1).max(365).default(7).describe('该邀请码可生成的有效期天数'),
});

// ===================== 客户/CRM =====================

/**
 * 创建新客户请求
 * @property {string} name - 必须，客户全名或称呼
 * @property {string} [phone] - 可选，客户联络手机号
 * @property {string} [wechat] - 可选，客户微信号
 * @property {string} [address] - 可选，默认建档地址（将被保存为默认收货地）
 */
export const CreateCustomerSchema = z.object({
  name: z.string().min(1, '客户姓名不能为空').max(100).describe('客户全称'),
  phone: z.string().max(20).optional().default('').describe('主联络手机号'),
  wechat: z.string().max(100).nullable().optional().describe('微信联系人'),
  address: z.string().max(500).optional().describe('客户建档时的初始跟进地址'),
});

/**
 * 记录客户跟进或活动
 * @property {string} customerId - 被跟进客户的 UUID
 * @property {string} type - 跟进类型枚举 (VISIT, CALL 等)
 * @property {string} description - 跟进的主要记录内容
 * @property {string[]} [images] - 跟进附带的图片凭证 URL 数组，最多 9 张
 * @property {string} [location] - 可选，跟进发生时的地理位置
 */
export const CreateActivitySchema = z.object({
  customerId: uuidSchema.describe('归属系统客户 ID'),
  type: z.string().min(1, '请选择活动类型').describe('跟进类型如 MEET, VISIT, ONLINE'),
  description: z.string().min(1, '请填写活动描述').max(2000).describe('跟进文字摘要/总结'),
  images: z
    .array(z.string().url('必须为有效的 URL格式'))
    .max(9)
    .optional()
    .default([])
    .describe('活动上传图组'),
  location: z.string().max(200).nullable().optional().describe('活动发生时的人工录入详细地址'),
});

// ===================== 报价单 (Quotes) =====================

/**
 * 报价单内单品明细
 */
const QuoteItemSchema = z.object({
  id: z.string().min(1).describe('前端唯一生成或已有商品的 ID'),
  name: z.string().min(1).describe('商品名称'),
  unit: z.string().optional().default('').describe('计价单位 (套/米/卷/个)'),
  unitPrice: z.coerce.number().min(0).describe('单价 (元)'),
  quantity: z.coerce.number().min(0).describe('购买数量'),
  width: z.coerce.number().min(0).default(0).describe('面宽尺寸 (米)'),
  height: z.coerce.number().min(0).default(0).describe('高度尺寸 (米)'),
  foldRatio: z.coerce.number().min(0).default(1).describe('褶皱倍率/打褶比例'),
  subtotal: z.coerce.number().min(0).describe('当前单品项小计金额'),
  category: z
    .string()
    .optional()
    .default('GENERAL')
    .describe('类目类型编码 (FABRIC, TRACK, MAIN...)'),
});

/**
 * 报价单内的空间/房间分区定义
 */
const QuoteRoomSchema = z.object({
  name: z.string().min(1, '房间名不能为空').describe('房间分区名，如: 主卧、次卧、客厅'),
  items: z.array(QuoteItemSchema).optional().default([]).describe('该房间内挂载挂靠的所有商品项'),
});

/**
 * 新建报价单请求
 * @property {string} customerId - 归属客户
 * @property {QuoteRoomSchema[]} [rooms] - 按房间编排的报价明细数组
 */
export const CreateQuoteSchema = z.object({
  customerId: uuidSchema.describe('归属客户 ID'),
  rooms: z.array(QuoteRoomSchema).optional().default([]).describe('包含商品详情的全部房间数组'),
});

/**
 * 确认客户已签署并生成终确认报价
 * @property {string} signatureUrl - 签署好的画板签名图 OSS 地址
 */
export const ConfirmQuoteSchema = z.object({
  signatureUrl: z
    .string()
    .min(1, '签名URL不能为空')
    .url('签名URL格式无效')
    .describe('带签名的画板或承诺函 PDF 地址'),
});

// ===================== 订单 (Orders) =====================

/**
 * 由已确定的报价单转换生成订单
 * @property {string} quoteId - 即将转换为合同订单的报价单 ID
 */
export const CreateOrderSchema = z.object({
  quoteId: uuidSchema.describe('客户已确认的有效报价单 ID'),
});

/**
 * 记录订单节点的实际收款交易
 * @property {string} scheduleId - 针对的分期付款计划 ID
 * @property {number} actualAmount - 当次实际流水金额
 * @property {string} proofImg - 财务/销售留存的付款截屏或凭证
 * @property {string} paymentMethod - 履约渠道 (微信、支付宝、现金等)
 */
export const SubmitPaymentSchema = z.object({
  scheduleId: uuidSchema.describe('对应的预设置收款计划进度表 ID'),
  actualAmount: z.coerce.number().positive('金额必须大于零').describe('此笔最终确立账面净收款数'),
  proofImg: z.string().min(1, '请上传凭证').describe('打款凭条上传 OSS 的记录 URL'),
  paymentMethod: z.enum(['CASH', 'WECHAT', 'ALIPAY', 'BANK']).describe('打款核销流转通路'),
});

// ===================== 任务 (Tasks) =====================

/**
 * 外勤打水签到请求参数
 * @property {number} latitude - 定位点纬度
 * @property {number} longitude - 定位点经度
 * @property {string} [address] - 高德/腾讯解析出的地理名
 */
export const TaskCheckInSchema = z.object({
  latitude: z.number().min(-90).max(90).describe('微信定位 API 返回的纬坐标'),
  longitude: z.number().min(-180).max(180).describe('微信定位 API 返回的经坐标'),
  address: z.string().min(1).max(500).optional().describe('经纬反序列化得到的街道名称'),
});

/**
 * 上传测量工录入的复尺测绘明细
 * @property {MeasureRoom[]} rooms - 多个房间的各类窗体测算表（每个房间包含房间名和窗户测量数组）
 * @property {string[]} [images] - 房屋现场毛坯实拍参考
 * @property {string} [remark] - 测量特殊备注或要求
 */
export const SubmitMeasureDataSchema = z.object({
  rooms: z
    .array(
      z.object({
        name: z.string().min(1).describe('测量的对应房间'),
        windows: z
          .array(
            z.object({
              width: z.coerce.number().positive().describe('窗口测得主面宽(m)'),
              height: z.coerce.number().positive().describe('窗口测得垂高(m)'),
              remark: z.string().max(500).optional().describe('窗体特征备注(如外开/飘窗)'),
            })
          )
          .min(1)
          .describe('房间名下所有测过的各窗体表'),
      })
    )
    .min(1, '至少提交一个房间的测量数据')
    .describe('需要按房间打包分组结构'),
  images: z.array(z.string()).max(20).optional().default([]).describe('现场图片补充'),
  remark: z.string().max(2000).optional().describe('整体测量评价(如现场灰大/晚装灯)'),
});

/**
 * 任务(如安装)完工节点归档闭环
 * @property {string[]} [images] - 安装完工的实拍成果照
 * @property {string} [remark] - 遗留缺陷补充或返修申请摘要
 */
export const TaskCompleteSchema = z.object({
  images: z.array(z.string()).max(20).optional().default([]).describe('完工作品或交接人合照'),
  remark: z.string().max(2000).optional().describe('安装过程异常或收尾补充'),
});

// ===================== 售后 (Service) =====================

/**
 * 发起售后请求单
 * @property {string} orderId - 原订单 ID
 * @property {string} type - 售后分型
 * @property {string} description - 故障缺陷文字全息说明
 * @property {string[]} [images] - 断裂/色差等问题附贴
 */
export const CreateServiceTicketSchema = z.object({
  orderId: uuidSchema.describe('客诉涉及的对应已成交正单 ID'),
  type: z
    .enum(['REPAIR', 'RETURN', 'EXCHANGE', 'COMPLAINT', 'CONSULTATION'])
    .describe('客诉归属枚举类型'),
  description: z.string().min(1, '请描述问题').max(2000).describe('详细问题反馈'),
  images: z.array(z.string()).max(9).optional().default([]).describe('客诉佐证照'),
});

// ===================== 租户 (Tenant) =====================

/**
 * 管理员侧的全局系统支付通道开启预设项
 */
export const TenantPaymentConfigSchema = z.object({
  wechatPayEnabled: z.boolean().optional().describe('系统微信小微商户支付通道状态'),
  alipayEnabled: z.boolean().optional().describe('门店支付宝通道状态'),
  bankTransferEnabled: z.boolean().optional().describe('柜台银行转账通道状态'),
  cashEnabled: z.boolean().optional().describe('对公现金收取通道状态'),
});

// ===================== 销售目标 =====================

export const SetSalesTargetSchema = z.object({
  userId: uuidSchema.describe('分派的接收销售人 ID'),
  year: z.number().int().min(2020).max(2100).describe('预算所处年份 YYYY'),
  month: z.number().int().min(1).max(12).describe('预算所处月份 M~MM'),
  targetAmount: z.coerce.number().min(0).describe('业绩硬性定额'),
});

/**
 * 管理为员工指定设定周度创收基础值
 */
export const SetSalesWeeklyTargetSchema = z.object({
  userId: uuidSchema.describe('分派的接收销售人 ID'),
  year: z.number().int().min(2020).max(2100).describe('预算所处年份 YYYY'),
  week: z.number().int().min(1).max(53).describe('预算所处周数 1-53'),
  targetAmount: z.coerce.number().min(0).describe('业绩硬性定额'),
});
