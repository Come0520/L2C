# 认证授权功能完善 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完善系统认证授权机制，堵住"未登录可访问"漏洞，实现用户菜单功能。

**Architecture:** 利用现有 NextAuth + RBAC 基础设施，在 Dashboard 布局层添加认证守卫，创建用户菜单组件，完善登录页面。

**Tech Stack:** NextAuth v5, Drizzle ORM, shadcn/ui, React Server Components

---

## 需求摘要

| 需求 | 说明 |
|------|------|
| 用户群体 | 多租户 SaaS（销售、店长、采购、老板、派单员） |
| 登录方式 | 手机号+验证码、企微/钉钉（Phase 2） |
| 权限控制 | 细粒度 RBAC（按钮级别） |
| 实施策略 | 先堵漏洞，后续迭代 |

---

## Task 1: Dashboard 路由守卫

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`

**Step 1: 添加认证检查**

```tsx
// src/app/(dashboard)/layout.tsx
import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { AppSidebar } from '../../widgets/layout/sidebar';
import { Header } from '../../widgets/layout/header';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    
    // 未登录，跳转到登录页
    if (!session) {
        redirect('/login');
    }
    
    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden relative">
                <Header session={session} />
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative md:ml-[60px]">
                    {children}
                </main>
            </div>
        </div>
    );
}
```

**Step 2: 验证效果**

Run: 打开浏览器访问 `http://localhost:3000/quotes`
Expected: 应自动跳转到 `/login`

**Step 3: Commit**

```bash
git add src/app/(dashboard)/layout.tsx
git commit -m "feat(auth): 添加 Dashboard 路由守卫"
```

---

## Task 2: 用户菜单组件

**Files:**
- Create: `src/widgets/layout/user-menu.tsx`
- Modify: `src/widgets/layout/header.tsx`

**Step 1: 创建 UserMenu 组件**

```tsx
// src/widgets/layout/user-menu.tsx
'use client';

import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import { User, LogOut, Settings, Building2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';

interface UserMenuProps {
    session: Session;
}

export function UserMenu({ session }: UserMenuProps) {
    const user = session.user;
    const initials = user?.name?.slice(0, 2) || user?.email?.slice(0, 2) || 'U';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 hover:opacity-90"
                >
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
                        <AvatarFallback className="bg-transparent text-white text-sm">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user?.name || '未设置姓名'}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>当前租户</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>个人设置</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="text-destructive focus:text-destructive"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
```

**Step 2: 修改 Header 组件**

```tsx
// src/widgets/layout/header.tsx - 修改 props 和用户按钮部分
import { Session } from 'next-auth';
import { UserMenu } from './user-menu';

interface HeaderProps {
    session?: Session | null;
}

export function Header({ session }: HeaderProps) {
    // ... 保持其他代码不变 ...
    
    // 替换用户按钮部分：
    {session ? (
        <UserMenu session={session} />
    ) : (
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <User className="h-4 w-4" />
        </Button>
    )}
}
```

**Step 3: 验证效果**

Run: 打开浏览器，登录后点击右上角用户头像
Expected: 应弹出下拉菜单，显示用户名、退出登录等选项

**Step 4: Commit**

```bash
git add src/widgets/layout/user-menu.tsx src/widgets/layout/header.tsx
git commit -m "feat(auth): 添加用户菜单组件"
```

---

## Task 3: 登录页面

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/features/auth/components/login-form.tsx`

**Step 1: 创建登录页面路由**

```tsx
// src/app/login/page.tsx
import { LoginForm } from '@/features/auth/components/login-form';
import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
    const session = await auth();
    
    // 已登录，跳转到首页
    if (session) {
        redirect('/');
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white">L2C 管理系统</h1>
                    <p className="text-slate-400 mt-2">线索到现金，一站式管理</p>
                </div>
                <LoginForm />
            </div>
        </div>
    );
}
```

**Step 2: 创建登录表单组件**

```tsx
// src/features/auth/components/login-form.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function LoginForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                username,
                password,
                redirect: false,
            });

            if (result?.error) {
                toast.error('登录失败：用户名或密码错误');
            } else {
                toast.success('登录成功');
                router.push('/');
                router.refresh();
            }
        } catch (error) {
            toast.error('登录失败，请稍后重试');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
                <CardTitle className="text-white text-center">登录</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-slate-200">
                            手机号 / 邮箱
                        </Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="请输入手机号或邮箱"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-200">
                            密码
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="请输入密码"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                            required
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        登录
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
```

**Step 3: 验证效果**

Run: 打开浏览器访问 `http://localhost:3000/login`
Expected: 显示登录页面，输入正确账号密码后跳转到首页

**Step 4: Commit**

```bash
git add src/app/login/page.tsx src/features/auth/components/login-form.tsx
git commit -m "feat(auth): 添加登录页面"
```

---

## 验证清单

- [ ] 未登录访问 `/quotes` → 跳转 `/login`
- [ ] 登录成功 → 跳转首页
- [ ] 右上角头像 → 弹出菜单
- [ ] 点击退出登录 → 跳转 `/login`
- [ ] Server Action 权限检查 → 返回"未授权"

---

## Phase 2 规划（未来）

| 功能 | 说明 |
|------|------|
| 手机号验证码登录 | 接入阿里云/腾讯云短信 |
| 企业微信登录 | OAuth2 集成 |
| 权限配置界面 | 动态配置角色权限 |
| Session 过期提示 | 友好的弹窗提示 |
