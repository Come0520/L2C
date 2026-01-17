'use client';

import { Font } from '@react-pdf/renderer';

/**
 * 注册中文字体
 * 注意：通常需要下载 .ttf 文件到 public 文件夹，或者使用网络 CDN 链接
 * 这里我们优先尝试使用 Google Fonts 的 CDN 链接，避免直接存储大型字体文件
 */
export function registerFonts() {
    try {
        Font.register({
            family: 'Noto Sans SC',
            fonts: [
                {
                    src: 'https://fonts.gstatic.com/s/notosanssc/v26/k3kXo84MPvpLmixcA63oeALhLIi_2I7E1srZzS3gg8_W.ttf',
                    fontWeight: 'normal',
                },
                {
                    src: 'https://fonts.gstatic.com/s/notosanssc/v26/k3kVo84MPvpLmixcA63oeALhLIi_2I7-987dyi_Bms_XfGle.ttf',
                    fontWeight: 'bold',
                },
            ],
        });
        console.log('PDF Fonts registered successfully');
    } catch (error) {
        console.error('Failed to register PDF fonts:', error);
    }
}

// 默认导出注册函数，以便在根组件或生成 PDF 前调用
export default registerFonts;
