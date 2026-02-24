'use server';

import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { logger } from '@/shared/lib/logger';
import { db } from '@/shared/api/db';
import { auditLogs } from '@/shared/api/schema';
import { auth } from '@/shared/lib/auth';

/**
 * 允许的文件 MIME 类型白名单
 *
 * 安全策略：仅允许图片（JPEG/PNG/GIF/WebP/SVG）和办公文档（PDF/Word/Excel），
 * 禁止可执行文件、脚本文件及所有未列出的类型，防止恶意文件上传攻击。
 */
const ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

/**
 * 单文件最大配置容量：限定为 10MB，换算为 Byte 需表示为 `10 * 1024 * 1024` Byte。
 *
 * @remarks 由 Zod Schema 在元数据校验阶段使用，如超出会做校验拦截告警。
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Zod Schema：文件上传元数据验证规范核心验证器
 *
 * 专门校验参数中的各元信息（大小字节、名称、对应 MIME 类型）。
 * @remarks
 * 涉及安全性检查：
 * - fileSize：上限受制于 `MAX_FILE_SIZE` 字节大小配置（此处为 10MB = 10485760 Byte）
 * - mimeType：只能在 `ALLOWED_MIME_TYPES` 配置之内上传
 */
const uploadMetadataSchema = z.object({
    fileName: z.string().min(1, '文件名不能为空').max(255, '文件名不能超过 255 个字符'),
    fileSize: z.number().min(1, '文件不能为空').max(MAX_FILE_SIZE, '文件大小不能超过 10MB'),
    mimeType: z.string().refine(
        (type) => ALLOWED_MIME_TYPES.includes(type),
        '不支持的文件类型',
    ),
});

/**
 * 基于 createSafeAction 的文件上传元数据校验内部实现
 *
 * @remarks 此 Action 仅校验文件的元数据（文件名、大小、MIME 类型），
 * 不涉及实际文件读写。内部自动进行 Session 认证检查。
 */
const validateUploadActionInternal = createSafeAction(
    uploadMetadataSchema,
    async (params, { session }) => {
        const tenantId = session.user.tenantId;
        logger.info(`文件上传校验通过: tenant=${tenantId}, file=${params.fileName}`);
        return { success: true, tenantId, validated: true };
    },
);

/**
 * 校验文件上传元数据（文件名、大小、MIME 类型）
 *
 * @param params - 文件元数据对象
 * @param params.fileName - 文件名，长度 1~255 字符
 * @param params.fileSize - 文件大小（字节），范围 1 ~ 10MB
 * @param params.mimeType - 文件 MIME 类型，必须在白名单内
 * @returns `{ success: true, data: { tenantId, validated } }` 或 `{ success: false, error }`
 *
 * @example
 * ```ts
 * const result = await validateUpload({
 *   fileName: 'product.png',
 *   fileSize: 2048,
 *   mimeType: 'image/png',
 * });
 * ```
 */
export async function validateUpload(params: z.infer<typeof uploadMetadataSchema>) {
    return validateUploadActionInternal(params);
}

/**
 * 文件上传 Server Action（使用 FormData）
 *
 * 完整的上传处理流程：
 * 1. Session 认证检查（含 tenantId 验证）
 * 2. FormData 中提取 file 字段
 * 3. Zod Schema 校验文件元数据（类型、大小、文件名长度）
 * 4. 文件名安全净化（防路径遍历攻击）
 * 5. 按 tenantId 隔离存储至本地磁盘
 * 6. 写入审计日志
 *
 * @param formData - 包含 `file` 字段的 FormData 对象
 * @returns `{ success: true, url: string }` 成功时返回文件访问 URL
 * @returns `{ success: false, error: string }` 失败时返回错误描述
 *
 * @example
 * ```ts
 * const formData = new FormData();
 * formData.append('file', fileBlob);
 * const result = await uploadFileAction(formData);
 * if (result.success) {
 *   console.log('文件 URL:', result.url);
 * }
 * ```
 */
export async function uploadFileAction(formData: FormData) {
    // createSafeAction 不直接支持 FormData，手动进行 auth/校验
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权访问' };
    }

    const file = formData.get('file') as File;
    if (!file) {
        return { success: false, error: '未上传文件' };
    }

    // Zod 校验文件元数据
    const validation = uploadMetadataSchema.safeParse({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
    });

    if (!validation.success) {
        // [D7 可运维性] 根据安全规范，拦截恶意或超常规请求时，应当触发告警预备介入检查
        logger.warn(
            `[安全拦截] 文件校验违规阻止上传: tenantId=${session.user.tenantId}, userId=${session.user.id}, fileName=${file.name}, size=${file.size}, type=${file.type}, error=${validation.error.issues[0]?.message}`
        );
        return { success: false, error: validation.error.issues[0]?.message || '文件校验失败' };
    }

    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 确保上传目录存在（按租户隔离）
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', session.user.tenantId);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // 安全文件名（去除路径遍历字符）
        const safeName = file.name.replace(/[^\w.\-]/g, '_');
        const filename = `${Date.now()}-${safeName}`;
        const filepath = path.join(uploadDir, filename);

        await writeFile(filepath, buffer);

        const fileUrl = `/uploads/${session.user.tenantId}/${filename}`;

        // 审计日志
        await db.insert(auditLogs).values({
            tenantId: session.user.tenantId,
            action: 'UPLOAD_FILE',
            tableName: 'uploads',
            recordId: filename,
            userId: session.user.id,
            newValues: { fileName: file.name, fileSize: file.size, url: fileUrl } as Record<string, unknown>,
            createdAt: new Date(),
        });

        return { success: true, url: fileUrl };
    } catch (error) {
        logger.error('文件上传失败:', error);
        return { success: false, error: '上传失败' };
    }
}
