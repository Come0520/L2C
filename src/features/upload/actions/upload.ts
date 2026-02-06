'use server';

import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';
import { auth } from '@/shared/lib/auth';

export async function uploadFileAction(formData: FormData) {
    const session = await auth();
    if (!session) return { success: false, error: 'Unauthorized' };

    const file = formData.get('file') as File;
    if (!file) {
        return { success: false, error: 'No file uploaded' };
    }

    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure uploads directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
        const filepath = path.join(uploadDir, filename);

        await writeFile(filepath, buffer);

        // Return URL
        // In local dev, we return relative path or localhost absolute.
        // For Image component in Next.js, relative path starting with / is fine.
        const fileUrl = `/uploads/${filename}`;

        return { success: true, url: fileUrl };

    } catch (error) {
        console.error('Upload Action Error:', error);
        return { success: false, error: 'Upload failed' };
    }
}
