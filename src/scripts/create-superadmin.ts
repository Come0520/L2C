import 'dotenv/config';
import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL 缺失');
    process.exit(1);
  }

  // 目标：把现有超管 15601911921 改为 13800000000，密码设为 123456
  const oldPhone = '15601911921';
  const newPhone = '13800000000';
  const newPassword = '123456';

  const user = await db.query.users.findFirst({
    where: eq(users.phone, oldPhone),
  });

  if (!user) {
    console.error(`❌ 未找到超管账号 ${oldPhone}`);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db
    .update(users)
    .set({ phone: newPhone, passwordHash: hashedPassword })
    .where(eq(users.id, user.id));

  console.log('✅ 超管账号更新成功！');
  console.log(`   手机号：${newPhone}`);
  console.log(`   密码：${newPassword}`);
  console.log(`   姓名：${user.name}`);
  process.exit(0);
}

main().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
