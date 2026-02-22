/**
 * 通用文件上传 API (Local Dev Implementation)
 *
 * POST /api/miniprogram/upload
 */
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';
import { getMiniprogramUser } from '../auth-utils';

// 允许的文件类型（MIME types）
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

// 最大文件大小：10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Helper: 从 Token 获取用户信息
// 已迁移至 @/app/api/miniprogram/auth-utils

// Helper: 清理文件名，防止路径遍历攻击
function sanitizeFilename(filename: string): string {
  // 移除路径分隔符和特殊字符
  return filename
    .replace(/[\/\\]/g, '')
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function POST(request: NextRequest) {
  try {
    // 1. 认证检查
    const user = await getMiniprogramUser(request);
    if (!user || !user.tenantId) {
      return apiError('未授权', 401);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return apiError('未上传文件', 400);
    }

    // 2. 文件类型验证
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return apiError(`不支持的文件类型: ${file.type}`, 400);
    }

    // 3. 文件大小验证
    if (file.size > MAX_FILE_SIZE) {
      return apiError(`文件过大，最大支持 ${MAX_FILE_SIZE / 1024 / 1024}MB`, 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 4. 确保上传目录存在
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 5. 生成安全的文件名（清理用户输入）
    const sanitizedName = sanitizeFilename(file.name);
    const filename = `${Date.now()}-${sanitizedName}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    // 6. 返回相对 URL（使用环境变量或请求头获取 base URL）
    const fileUrl = `/uploads/${filename}`;
    // 优先使用环境变量，否则回退到请求头侦测
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host') || 'localhost:3000'}`;
    const fullUrl = `${baseUrl}${fileUrl}`;

    return apiSuccess({
      url: fullUrl,
      width: 0,
      height: 0,
    });
  } catch (error) {
    logger.error('Upload error:', error);
    return apiError('上传失败', 500);
  }
}
