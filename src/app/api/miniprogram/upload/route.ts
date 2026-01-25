/**
 * 通用文件上传 API (Mock Implementation)
 *
 * POST /api/miniprogram/upload
 */
import { NextRequest, NextResponse } from 'next/server';
// import { put } from '@vercel/blob'; // Example for cloud storage
// import fs from 'fs';
// import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    // TODO: Integrate with actual cloud storage (OSS/S3/Vercel Blob)
    // For now, we'll mock a successful upload and return a fake URL
    // In a real local dev environment, we might write to ./public/uploads

    const filename = `${Date.now()}-${file.name}`;
    // const buffer = Buffer.from(await file.arrayBuffer());
    // await fs.promises.writeFile(path.join(process.cwd(), 'public', 'uploads', filename), buffer);

    const mockUrl = `https://mock-storage.com/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        url: mockUrl,
        width: 0,
        height: 0,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
