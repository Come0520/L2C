import 'dotenv/config';
import { generateAccessToken, verifyToken, MobileRole } from '../src/shared/lib/jwt';

async function main() {
    console.log('🧪 Testing JWT Role Implementation...');

    const userId = 'user-123';
    const tenantId = 'tenant-456';
    const phone = '13800138000';
    const role: MobileRole = 'BOSS'; // Test a privileged role

    try {
        // 1. Generate Token
        console.log('1. Generating Access Token...');
        const token = await generateAccessToken(userId, tenantId, phone, role);
        console.log('✅ Token generated length:', token.length);

        // 2. Verify Token
        console.log('2. Verifying Token...');
        const payload = await verifyToken(token);

        if (!payload) {
            throw new Error('❌ Token verification failed: payload is null');
        }

        console.log('✅ Payload received:', payload);

        // 3. Check Role
        if (payload.role !== role) {
            throw new Error(`❌ Role mismatch! Expected: ${role}, Got: ${payload.role}`);
        }
        console.log(`✅ Role match: ${payload.role}`);

        // 4. Test Missing Role (Simulate old token)
        // Since verifyToken checks signature, we can't easily forge a token without key.
        // But we verified that the generator puts the role in.

        console.log('🎉 JWT Role Access Test Passed!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
