export interface TenantContactInfo {
  address: string;
  phone: string;
  email: string;
}

export interface TenantInfo {
  id: string;
  name: string;
  code: string;
  /** 真实的统一社会信用代码，由企业认证流程填写，认证后锁定 */
  creditCode: string | null;
  logoUrl: string | null;
  contact: TenantContactInfo;
  /** 微信二维码图片 URL，用于报价单品牌展示 */
  wechatQrcodeUrl: string | null;
  /** 品牌标语，用于小程序租户落地页 */
  slogan: string | null;
  /** 门店详细地址，用于落地页和预约 */
  detailAddress: string | null;
  /** 租户所属地区（省市级别） */
  region: string | null;
  /** 客服微信号，用于小程序引导用户联系销售 */
  contactWechat: string | null;
  /** 落地页封面图/背景图 URL */
  landingCoverUrl: string | null;
  settings?: Record<string, unknown>;
}

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface VerificationInfo {
  status: VerificationStatus;
  /** 统一社会信用代码（认证时填写，认证通过后锁定） */
  creditCode: string | null;
  businessLicenseUrl: string | null;
  legalRepName: string | null;
  registeredCapital: string | null;
  businessScope: string | null;
  verifiedAt: Date | null;
  verificationRejectReason: string | null;
}
