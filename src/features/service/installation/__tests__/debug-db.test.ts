
import { describe, it, expect } from 'vitest';
import { db } from '@/shared/api/db';
import { installTasks } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';

describe('Debug DB', () => {
    it('should have working delete', async () => {
        console.log('DB Type:', typeof db);
        console.log('DB Delete Type:', typeof db.delete);

        try {
            const deleteBuilder = db.delete(installTasks);
            console.log('Delete Builder:', deleteBuilder);
            console.log('Delete Builder .where:', typeof deleteBuilder.where);

            // Try formatting
            // const q = deleteBuilder.where(eq(installTasks.tenantId, 'test')).toSQL();
            // console.log('SQL:', q);
        } catch (e) {
            console.error('Builder Error:', e);
        }
    });
});
