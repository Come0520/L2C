/**
 * 通用文件上传 API (Local Dev Implementation)
 *
 * POST /api/miniprogram/upload
 */
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-${file.name}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    // Return local URL
    // access via http://localhost:3000/uploads/filename
    const fileUrl = `/uploads/${filename}`;
    // Or full URL: `http://localhost:3000/uploads/${filename}` but relative is often fine for web
    // For Miniprogram, we need absolute URL if it's not the same domain, but here API_BASE is localhost:3000/api...
    // The image src in miniprogram needs to be absolute if base is different, but let's assume standard behavior.
    // Better to return absolute URL for Miniprogram safety.
    const baseUrl = 'http://localhost:3000'; // Make this dynamic if possible or valid for local
    const fullUrl = `${baseUrl}${fileUrl}`;

    return NextResponse.json({
      success: true,
      data: {
        url: fullUrl,
        width: 0,
        height: 0,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
