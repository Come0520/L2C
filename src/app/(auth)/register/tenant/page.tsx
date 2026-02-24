'use client';

/**
 * 租户自助注册页面
 *
 * 企业可通过此页面申请入驻 L2C 销售管理系统
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Loader2, Building2, CheckCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { submitTenantApplication } from '@/features/platform/actions/tenant-registration';
import { logger } from '@/shared/lib/logger';


// 中国省份列表
const REGIONS = [
  '北京市',
  '天津市',
  '上海市',
  '重庆市',
  '河北省',
  '山西省',
  '辽宁省',
  '吉林省',
  '黑龙江省',
  '江苏省',
  '浙江省',
  '安徽省',
  '福建省',
  '江西省',
  '山东省',
  '河南省',
  '湖北省',
  '湖南省',
  '广东省',
  '海南省',
  '四川省',
  '贵州省',
  '云南省',
  '陕西省',
  '甘肃省',
  '青海省',
  '内蒙古自治区',
  '广西壮族自治区',
  '西藏自治区',
  '宁夏回族自治区',
  '新疆维吾尔自治区',
  '香港特别行政区',
  '澳门特别行政区',
  '台湾省',
];

export default function TenantRegisterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    applicantName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    region: '',
    businessDescription: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null); // 清除错误
  };

  // 计算密码强度
  /**
   * 业务级密码强度算法
   * 
   * @description
   * 评分规则：
   * 0 分：空或不符合基本格式
   * 1 分：长度 >= 8
   * 2 分：包含字母 + 数字组合（入门级要求）
   * 3 分：包含特殊字符或长度 >= 12（企业级安全要求）
   */
  const calculateStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/(?=.*[a-zA-Z])(?=.*\d)/.test(pwd)) score += 1;
    if (/(?=.*[!@#$%^&*])/.test(pwd) || pwd.length >= 12) score += 1;
    return score;
  };

  const strengthScore = calculateStrength(formData.password);
  const strengthColor =
    strengthScore === 0 ? 'bg-transparent' : strengthScore === 1 ? 'bg-red-500' : strengthScore === 2 ? 'bg-yellow-500' : 'bg-green-500';
  const strengthText =
    strengthScore === 0 ? '' : strengthScore === 1 ? '较弱 (请混合字母和数字)' : strengthScore === 2 ? '中等 (符合注册要求)' : '高强度';
  const strengthColorText =
    strengthScore === 0 ? 'text-transparent' : strengthScore === 1 ? 'text-red-500' : strengthScore === 2 ? 'text-yellow-600 dark:text-yellow-500' : 'text-green-600 dark:text-green-500';

  /**
   * 提交注册申请逻辑
   * 
   * @description
   * 1. 客户端校验：二次密码验证、基本长度及复杂度 (Zod 可选)。
   * 2. 调用 Server Action: `submitTenantApplication` 写入 DB。
   * 3. 状态变更：成功后切至提示页面，失败则渲染 Alert 提示。
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 前端验证
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 8) {
      setError('密码至少8位');
      return;
    }

    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      setError('密码需包含字母和数字');
      return;
    }

    if (!formData.region) {
      setError('请选择地区');
      return;
    }

    setSubmitting(true);
    setError(null);

    logger.info('[Auth:Registration] 开始提交租户注册申请', {
      companyName: formData.companyName,
      applicant: formData.applicantName
    });

    try {
      const result = await submitTenantApplication({
        companyName: formData.companyName,
        applicantName: formData.applicantName,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        region: formData.region,
        businessDescription: formData.businessDescription || undefined,
      });

      if (result.success) {
        setSuccess(true);
        logger.info('[Auth:Registration] 租户注册申请提交成功', {
          tenantId: result.tenantId,
          companyName: formData.companyName
        });
      } else {
        setError(result.error || '提交失败，请稍后重试');
        logger.warn('[Auth:Registration] 租户注册申请被拒', {
          reason: result.error,
          companyName: formData.companyName
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '提交申请时发生意外错误';
      setError(errorMsg);
      logger.error('[Auth:Registration] 租户注册请求崩溃', {
        error: errorMsg,
        companyName: formData.companyName
      });
    } finally {
      setSubmitting(false);
    }
  };


  // 提交成功页面
  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <Card className="w-full max-w-md glass-liquid border-white/40 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-foreground">申请已提交</CardTitle>
            <CardDescription className="mt-2 text-muted-foreground">
              您的企业入驻申请已成功提交！
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-secondary/50 p-4 text-center">
              <p className="text-sm text-foreground">
                我们将在 <span className="font-semibold">1-3 个工作日</span> 内完成审核
              </p>
              <p className="mt-2 text-sm text-muted-foreground">审核结果将通过短信和邮件通知您</p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => router.push('/login')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回登录页
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 注册表单
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 py-8">
      <Card className="w-full max-w-lg glass-liquid border-white/40 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/10">
            <Building2 className="h-8 w-8 text-primary-600" />
          </div>
          <CardTitle className="text-xl text-foreground">企业入驻申请</CardTitle>
          <CardDescription className="text-muted-foreground">
            填写以下信息申请开通 L2C 销售管理系统
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 企业名称 */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-foreground">
                企业名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="companyName"
                placeholder="请输入企业全称"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                required
                className="input-base"
              />
            </div>

            {/* 联系人 + 手机号 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applicantName" className="text-foreground">
                  联系人 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="applicantName"
                  placeholder="您的姓名"
                  value={formData.applicantName}
                  onChange={(e) => handleChange('applicantName', e.target.value)}
                  required
                  className="input-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">
                  手机号 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="11位手机号"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  required
                  className="input-base"
                />
              </div>
            </div>

            {/* 邮箱 + 地区 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  邮箱 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="用于接收通知"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  className="input-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region" className="text-foreground">
                  地区 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => handleChange('region', value)}
                >
                  <SelectTrigger className="input-base">
                    <SelectValue placeholder="选择省份" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 密码 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  设置密码 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="至少8位且包含字母和数字"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required
                    className="input-base pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* 密码强度检测进度条 */}
                {formData.password && (
                  <div className="mt-1.5 space-y-1 transition-all">
                    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full transition-all duration-300 ${strengthColor}`}
                        style={{ width: `${(strengthScore / 3) * 100}%` }}
                      />
                    </div>
                    <p className={`text-[11px] font-medium transition-colors ${strengthColorText}`}>
                      {strengthText}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">
                  确认密码 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="再次输入"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    required
                    className="input-base pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? '隐藏密码' : '显示密码'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* 业务简介 */}
            <div className="space-y-2">
              <Label htmlFor="businessDescription" className="text-foreground">
                业务简介 <span className="text-muted-foreground">(选填)</span>
              </Label>
              <Textarea
                id="businessDescription"
                placeholder="请简要介绍您的主营业务..."
                value={formData.businessDescription}
                onChange={(e) => handleChange('businessDescription', e.target.value)}
                className="min-h-[80px] input-base"
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* 提交按钮 */}
            <Button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/30"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  提交中...
                </>
              ) : (
                '提交入驻申请'
              )}
            </Button>

            {/* 返回登录 */}
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => router.push('/login')}
              >
                已有账号？返回登录
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
