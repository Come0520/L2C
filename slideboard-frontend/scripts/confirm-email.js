const { createClient } = require('@supabase/supabase-js');

// Config from .env.production
const SUPABASE_URL = 'https://rdpiajialjnmngnaokix.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // 需要服务端密钥

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ 错误: 缺少 SUPABASE_SERVICE_ROLE_KEY 环境变量');
    console.log('\n解决方案:');
    console.log('1. 登录 https://supabase.com/dashboard');
    console.log('2. 选择项目 rdpiajialjnmngnaokix');
    console.log('3. 进入 Settings → API');
    console.log('4. 复制 service_role key (NOT anon key)');
    console.log('5. 在命令行运行: export SUPABASE_SERVICE_ROLE_KEY="你的service_role_key"');
    console.log('6. 然后再运行此脚本\n');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function confirmEmail(email) {
    console.log(`尝试确认邮箱: ${email}...`);

    try {
        // 使用 admin API 更新用户
        const { data, error } = await supabase.auth.admin.updateUserById(
            email, // 实际上需要 user ID，这里先尝试查找
            { email_confirm: true }
        );

        if (error) {
            // 如果直接更新失败，尝试先查找用户
            const { data: userData, error: listError } = await supabase.auth.admin.listUsers();

            if (listError) {
                throw listError;
            }

            const user = userData.users.find(u => u.email === email);
            if (!user) {
                throw new Error(`未找到邮箱 ${email} 对应的用户`);
            }

            console.log(`找到用户 ID: ${user.id}`);

            // 使用正确的 ID 更新
            const { error: updateError } = await supabase.auth.admin.updateUserById(
                user.id,
                { email_confirm: true }
            );

            if (updateError) {
                throw updateError;
            }
        }

        console.log('✅ 邮箱确认成功！现在可以登录了。');
        return true;
    } catch (err) {
        console.error('❌ 确认失败:', err.message);
        return false;
    }
}

async function main() {
    const email = process.argv[2] || 'bigeyecome@hotmail.com';
    await confirmEmail(email);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
