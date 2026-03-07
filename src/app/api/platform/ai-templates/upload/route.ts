/**
 * 平台管理 — 款式模板缩略图上传 API Route
 *
 * POST /api/platform/ai-templates/upload
 *
 * 鉴权：仅 SUPER_ADMIN
 * 限制：文件类型 jpg/png/webp，大小 ≤ 5MB
 * 存储：保存到 public/uploads/templates/（本地，后续可迁移 OSS）
 */
import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { auth } from '@/shared/lib/auth';
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiBadRequest,
} from '@/shared/lib/api-response';

/** 允许的文件 MIME 类型 */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** 文件大小上限：5MB */
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

/** 上传目录（相对于 public） */
const UPLOAD_DIR = '/uploads/templates';

export async function POST(req: NextRequest) {
  // ---------- 1. 鉴权 ----------
  const session = await auth();
  if (!session) {
    return apiUnauthorized();
  }
  const role = (session.user as { role?: string })?.role;
  if (role !== 'SUPER_ADMIN') {
    return apiForbidden('仅超级管理员可上传款式模板');
  }

  // ---------- 2. 解析 FormData ----------
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return apiBadRequest('请求格式错误，需要 multipart/form-data');
  }

  const file = formData.get('file');
  // 兼容 Blob/File（vitest/Node 环境中 instanceof File 可能不成立）
  if (!file || typeof file === 'string' || !('arrayBuffer' in file)) {
    return apiBadRequest('缺少 file 字段');
  }

  // ---------- 3. 文件类型校验 ----------
  if (!ALLOWED_TYPES.includes(file.type)) {
    return apiBadRequest('文件格式不支持，仅允许 jpg / png / webp 格式');
  }

  // ---------- 4. 文件大小校验 ----------
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_SIZE_BYTES) {
    return apiBadRequest(
      `文件大小超出限制（最大 5MB），当前大小 ${(bytes.byteLength / 1024 / 1024).toFixed(1)}MB`
    );
  }

  // ---------- 5. 生成文件名并写入磁盘 ----------
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const publicRoot = path.join(process.cwd(), 'public');
  const uploadDirAbs = path.join(publicRoot, UPLOAD_DIR);

  await mkdir(uploadDirAbs, { recursive: true });
  await writeFile(path.join(uploadDirAbs, fileName), Buffer.from(bytes));

  const url = `${UPLOAD_DIR}/${fileName}`;
  return apiSuccess({ url }, '上传成功');
}
