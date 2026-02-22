'use client';

/**
 * 员工注册页面
 *
 * 通过管理员分享的邀请链接注册
 */
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Loader2, UserPlus, CheckCircle2, AlertTriangle } from 'lucide-react';
import { validateInviteToken, registerEmployee } from '@/features/settings/actions/invite';
import { signIn } from 'next-auth/react';

// 包装组件，用于 Suspense
function EmployeeRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // 验证令牌
  useEffect(() => {
    if (!token) {
      setValidating(false);
      setTokenError('缺少邀请令牌');
      return;
    }

    validateInviteToken(token).then((result) => {
      setValidating(false);
      if (result.valid) {
        setTokenValid(true);
      } else {
        setTokenError(result.error || '无效的邀请链接');
      }
    });
  }, [token]);

  // 提交注册
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少 6 位');
      return;
    }

    // 手机号格式校验
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      setError('请输入有效的手机号');
      return;
    }

    // 邮箱格式校验（如果填写了的话）
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('邮箱格式不正确');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await registerEmployee(token!, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        password: formData.password,
      });

      if (result.success) {
        setSuccess(true);

        // 注册成功后自动登录
        const loginResult = await signIn('credentials', {
          username: formData.phone,
          password: formData.password,
          redirect: false,
        });

        if (loginResult?.ok) {
          // 登录成功，跳转首页
          setTimeout(() => {
            router.push('/');
          }, 1500);
        } else {
          // 登录失败，跳转登录页
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        }
      } else {
        setError(result.error || '注册失败');
      }
    } catch {
      setError('注册失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 加载状态
  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // 令牌无效
  if (!tokenValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md border-white/20 bg-white/10 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <CardTitle className="text-xl text-white">邀请链接无效</CardTitle>
            <CardDescription className="text-slate-300">{tokenError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" onClick={() => router.push('/login')}>
              返回登录
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 注册成功
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md border-white/20 bg-white/10 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
            <CardTitle className="text-xl text-white">注册成功</CardTitle>
            <CardDescription className="text-slate-300">正在跳转到登录页面...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // 注册表单
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md border-white/20 bg-white/10 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
            <UserPlus className="h-8 w-8 text-blue-400" />
          </div>
          <CardTitle className="text-xl text-white">员工注册</CardTitle>
          <CardDescription className="text-slate-300">请填写您的信息完成注册</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                姓名
              </Label>
              <Input
                id="name"
                placeholder="请输入您的姓名"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="border-white/20 bg-white/5 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">
                手机号
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="请输入手机号"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="border-white/20 bg-white/5 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                邮箱 <span className="text-xs text-slate-400">(选填，可用于登录)</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="请输入邮箱（选填）"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border-white/20 bg-white/5 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                密码
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="请设置密码（至少 6 位）"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="border-white/20 bg-white/5 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">
                确认密码
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="border-white/20 bg-white/5 text-white"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  注册中...
                </>
              ) : (
                '注册'
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-400">注册后需等待管理员分配权限</p>
        </CardContent>
      </Card>
    </div>
  );
}

// 导出包装后的组件
export default function EmployeeRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      }
    >
      <EmployeeRegisterContent />
    </Suspense>
  );
}
