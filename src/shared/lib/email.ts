import nodemailer from 'nodemailer';

/**
 * 邮件发送服务
 * 
 * 基于 Nodemailer 实现，支持 SMTP 协议。
 * 如果未配置环境变量，将只会打印日志而不会实际发送邮件。
 */

// 只有在配置了 SMTP 主机时才创建 transport
const transporter = process.env.SMTP_HOST ? nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465, // 465 端口默认为 true
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
}) : null;

export interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string; // 纯文本版本（可谓空）
}

/**
 * 发送邮件
 * 
 * @param options - 邮件选项
 * @returns 是否发送成功
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
    const { to, subject, html, text } = options;

    // 开发/预览环境或者未配置 SMTP 时，仅打印日志
    if (!transporter) {
        console.log('---------------------------------------------------');
        console.log(`[Email Mock] 模拟发送邮件`);
        console.log(`To: ${Array.isArray(to) ? to.join(', ') : to}`);
        console.log(`Subject: ${subject}`);
        console.log(`HTML Preview: ${html.substring(0, 100)}...`);
        console.log('---------------------------------------------------');
        return true;
    }

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || `"L2C System" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>?/gm, ''), // 简单的 HTML 转 Text
        });
        return true;
    } catch (error) {
        console.error('发送邮件失败:', error);
        return false;
    }
}
