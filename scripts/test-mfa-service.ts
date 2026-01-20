
import 'dotenv/config';
import { VerificationCodeService } from '../src/shared/services/verification-code.service';
import { db } from '@/shared/api/db';
import { verificationCodes } from '@/shared/api/schema/verification_codes';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Minimal mock of user ID for testing
const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000'; // Make sure this UUID is valid format if DB enforces FK. 
// Actually foreign key `userId` references `users.id`.
// We might fail if we don't have a user.
// So we should fetch a real user or insert a temp one if possible.
// Or we can disable FK check? No.
// Let's try to find a user first.

async function main() {
    console.log('🧪 Testing Verification Code Service...');

    try {
        const user = await db.query.users.findFirst();
        if (!user) {
            console.error('❌ No users found in DB. Cannot test FK constraint.');
            process.exit(1);
        }
        const userId = user.id;
        const phone = '13800000000';

        console.log(`Using User ID: ${userId}`);

        // 1. Generate Code
        console.log('1. Generating Code...');
        const code = await VerificationCodeService.generateAndSend(userId, phone, 'LOGIN_MFA');
        console.log(`✅ Code generated: ${code}`);

        // Check DB
        const records = await db.select().from(verificationCodes).where(eq(verificationCodes.userId, userId));
        console.log(`✅ DB Records count: ${records.length}`);

        // 2. Verify Code (Correct)
        console.log('2. Verifying Code (Correct)...');
        const isValid = await VerificationCodeService.verify(userId, code, 'LOGIN_MFA');
        if (isValid) {
            console.log('✅ Verification Successful');
        } else {
            throw new Error('❌ Verification Failed');
        }

        // 3. Verify Code (Used - should fail)
        console.log('3. Verifying Code (Re-use)...');
        const isValid2 = await VerificationCodeService.verify(userId, code, 'LOGIN_MFA');
        if (!isValid2) {
            console.log('✅ Re-use rejected safely');
        } else {
            throw new Error('❌ Re-use should fail but passed');
        }

        // 4. Verify Code (Wrong Code)
        console.log('4. Verifying Code (Wrong Code)...');
        const isValid3 = await VerificationCodeService.verify(userId, '000000', 'LOGIN_MFA');
        if (!isValid3) {
            console.log('✅ Wrong code rejected');
        } else {
            throw new Error('❌ Wrong code passed');
        }

        console.log('🎉 Verification Service Tests Passed!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
