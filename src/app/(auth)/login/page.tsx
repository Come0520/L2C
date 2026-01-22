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
        <div className="w-full">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white">L2C 管理系统</h1>
                <p className="text-slate-400 mt-2">线索到现金，一站式管理</p>
            </div>
            <LoginForm />
        </div>
    );
}
