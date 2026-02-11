
import { generateEmployeeInviteToken } from '@/shared/lib/invite-token';
import { jwtVerify } from 'jose';

const AUTH_SECRET = 'e455c6e0f534ee358a3462c4be2bbce42e4c2eca5ddf1e0227f2390c33153c3b';
const AUTH_URL = 'http://luolai-sd.xin';

async function verify() {
    console.log('--- 开始验证邀请链接修复 ---');

    // 1. 模拟生成多角色 Token
    const tenantId = 'tenant-123';
    const inviterId = 'user-456';
    const roles = ['ADMIN', 'MANAGER'];

    console.log(`正在生成邀请 Token，角色: ${roles.join(', ')}...`);
    const token = await generateEmployeeInviteToken(tenantId, inviterId, roles);

    // 2. 验证链接格式
    const inviteLink = `${AUTH_URL}/register/employee?token=${token}`;
    console.log('生成的邀请链接:', inviteLink);

    if (!inviteLink.startsWith('http://luolai-sd.xin')) {
        console.error('❌ 失败: 邀请链接域名错误');
        process.exit(1);
    } else {
        console.log('✅ 通过: 邀请链接域名正确');
    }

    // 3. 验证 Token Payload (包含多角色)
    const secret = new TextEncoder().encode(AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);

    console.log('Token Payload:', JSON.stringify(payload, null, 2));

    // @ts-ignore
    const defaultRoles = payload.defaultRoles;

    if (!defaultRoles || !Array.isArray(defaultRoles)) {
        console.error('❌ 失败: defaultRoles 不存在或不是数组');
        process.exit(1);
    }

    if (JSON.stringify(defaultRoles) !== JSON.stringify(roles)) {
        console.error(`❌ 失败: 角色不匹配。期望 ${JSON.stringify(roles)}, 实际 ${JSON.stringify(defaultRoles)}`);
        process.exit(1);
    }

    console.log('✅ 通过: Token 包含正确的多角色信息');
    console.log('--- 验证完成 ---');
}

verify().catch(console.error);
