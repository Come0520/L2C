/**
 * 租户自助注册页面
 *
 * 企业可通过此页面申请入驻 L2C 销售管理系统
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Loader2, Building2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { submitTenantApplication } from '@/features/platform/actions/tenant-registration';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 前端验证
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码至少6位');
      return;
    }

    if (!formData.region) {
      setError('请选择地区');
      return;
    }

    setSubmitting(true);
    setError(null);

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
      } else {
        setError(result.error || '提交失败，请稍后重试');
      }
    } catch {
      setError('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 提交成功页面
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md border-white/20 bg-white/10 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle2 className="h-10 w-10 text-green-400" />
            </div>
            <CardTitle className="text-2xl text-white">申请已提交</CardTitle>
            <CardDescription className="mt-2 text-slate-300">
              您的企业入驻申请已成功提交！
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-white/5 p-4 text-center">
              <p className="text-sm text-slate-300">
                我们将在 <span className="font-semibold text-white">1-3 个工作日</span> 内完成审核
              </p>
              <p className="mt-2 text-sm text-slate-400">审核结果将通过短信和邮件通知您</p>
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
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-4 py-8">
      <Card className="w-full max-w-lg border-white/20 bg-white/10 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
            <Building2 className="h-8 w-8 text-blue-400" />
          </div>
          <CardTitle className="text-xl text-white">企业入驻申请</CardTitle>
          <CardDescription className="text-slate-300">
            填写以下信息申请开通 L2C 销售管理系统
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 企业名称 */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-white">
                企业名称 <span className="text-red-400">*</span>
              </Label>
              <Input
                id="companyName"
                placeholder="请输入企业全称"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                required
                className="border-white/20 bg-white/5 text-white placeholder:text-slate-500"
              />
            </div>

            {/* 联系人 + 手机号 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applicantName" className="text-white">
                  联系人 <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="applicantName"
                  placeholder="您的姓名"
                  value={formData.applicantName}
                  onChange={(e) => handleChange('applicantName', e.target.value)}
                  required
                  className="border-white/20 bg-white/5 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white">
                  手机号 <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="11位手机号"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  required
                  className="border-white/20 bg-white/5 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* 邮箱 + 地区 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  邮箱 <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="用于接收通知"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  className="border-white/20 bg-white/5 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region" className="text-white">
                  地区 <span className="text-red-400">*</span>
                </Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => handleChange('region', value)}
                >
                  <SelectTrigger className="border-white/20 bg-white/5 text-white">
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
                <Label htmlFor="password" className="text-white">
                  设置密码 <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="至少6位"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                  className="border-white/20 bg-white/5 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">
                  确认密码 <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="再次输入"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  required
                  className="border-white/20 bg-white/5 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* 业务简介 */}
            <div className="space-y-2">
              <Label htmlFor="businessDescription" className="text-white">
                业务简介 <span className="text-slate-500">(选填)</span>
              </Label>
              <Textarea
                id="businessDescription"
                placeholder="请简要介绍您的主营业务..."
                value={formData.businessDescription}
                onChange={(e) => handleChange('businessDescription', e.target.value)}
                className="min-h-[80px] border-white/20 bg-white/5 text-white placeholder:text-slate-500"
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
              className="w-full bg-blue-600 hover:bg-blue-700"
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
                className="text-slate-400 hover:text-white"
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
