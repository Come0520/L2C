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
            <LoginForm />
        </div>
    );
}
