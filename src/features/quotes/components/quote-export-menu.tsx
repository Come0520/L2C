'use client';

import { Button } from '@/shared/ui/button';
import { Download, FileSpreadsheet, Image } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { toast } from 'sonner';

interface QuoteData {
    id: string;
    quoteNo: string;
    title?: string | null;
    customer?: {
        name?: string | null;
        phone?: string | null;
    } | null;
    items?: Array<{
        productName: string;
        width?: string | number | null;
        height?: string | number | null;
        quantity?: string | number | null;
        unitPrice?: string | number | null;
        subtotal?: string | number | null;
        roomId?: string | null;
    }>;
    rooms?: Array<{
        id: string;
        name: string;
    }>;
    totalAmount?: string | number | null;
    discountAmount?: string | number | null;
    finalAmount?: string | number | null;
    notes?: string | null;
}

interface QuoteExportMenuProps {
    quote: QuoteData;
    /** 渲染 PDF 下载按钮（由父组件提供，因为需要 @react-pdf/renderer） */
    renderPdfButtons?: React.ReactNode;
}

/**
 * 导出报价单为 Excel 格式
 */
async function exportToExcel(quote: QuoteData): Promise<void> {
    // 动态导入 xlsx 库
    const XLSX = await import('xlsx');

    // 准备数据
    const roomMap = new Map((quote.rooms || []).map(r => [r.id, r.name]));

    const rows = (quote.items || []).map(item => ({
        '空间': roomMap.get(item.roomId || '') || '未分配',
        '商品名称': item.productName,
        '宽度(cm)': item.width || '-',
        '高度(cm)': item.height || '-',
        '数量': item.quantity || '-',
        '单价(¥)': item.unitPrice || '-',
        '小计(¥)': item.subtotal || '-',
    }));

    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(rows);

    // 设置列宽
    ws['!cols'] = [
        { wch: 15 }, // 空间
        { wch: 25 }, // 商品名称
        { wch: 10 }, // 宽度
        { wch: 10 }, // 高度
        { wch: 10 }, // 数量
        { wch: 12 }, // 单价
        { wch: 12 }, // 小计
    ];

    // 添加汇总行
    const totalRowIndex = rows.length + 2;
    XLSX.utils.sheet_add_aoa(ws, [
        [],
        ['', '', '', '', '', '商品合计:', quote.totalAmount || 0],
        ['', '', '', '', '', '折扣:', quote.discountAmount || 0],
        ['', '', '', '', '', '最终报价:', quote.finalAmount || 0],
    ], { origin: `A${totalRowIndex}` });

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '报价明细');

    // 导出文件
    XLSX.writeFile(wb, `报价单_${quote.quoteNo}.xlsx`);
}

/**
 * 导出报价单为图片格式（用于微信分享）
 */
async function exportToImage(quote: QuoteData): Promise<void> {
    // 动态导入 html2canvas
    const html2canvas = (await import('html2canvas')).default;

    // 创建临时容器
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 800px;
        padding: 40px;
        background: white;
        font-family: system-ui, -apple-system, sans-serif;
    `;

    const roomMap = new Map((quote.rooms || []).map(r => [r.id, r.name]));

    // 生成 HTML 内容
    container.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 24px; margin: 0;">报价单</h1>
            <p style="color: #666; margin-top: 10px;">${quote.quoteNo}</p>
        </div>
        
        <div style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
            <p style="margin: 0;"><strong>客户：</strong>${quote.customer?.name || '-'}</p>
            <p style="margin: 5px 0 0;"><strong>电话：</strong>${quote.customer?.phone || '-'}</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
                <tr style="background: #f0f0f0;">
                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">空间</th>
                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">商品</th>
                    <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">尺寸</th>
                    <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">数量</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">金额</th>
                </tr>
            </thead>
            <tbody>
                ${(quote.items || []).map(item => `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">${roomMap.get(item.roomId || '') || '-'}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${item.productName}</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.width || '-'} × ${item.height || '-'}</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.quantity || '-'}</td>
                        <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">¥${Number(item.subtotal || 0).toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div style="text-align: right; padding: 15px; background: #f9f9f9; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #666;">商品合计：¥${Number(quote.totalAmount || 0).toFixed(2)}</p>
            <p style="margin: 5px 0 0; font-size: 14px; color: #666;">折扣：-¥${Number(quote.discountAmount || 0).toFixed(2)}</p>
            <p style="margin: 10px 0 0; font-size: 20px; font-weight: bold; color: #1a73e8;">
                最终报价：¥${Number(quote.finalAmount || 0).toFixed(2)}
            </p>
        </div>
        
        ${quote.notes ? `<p style="margin-top: 20px; color: #666; font-size: 14px;">备注：${quote.notes}</p>` : ''}
    `;

    document.body.appendChild(container);

    try {
        const canvas = await html2canvas(container, {
            scale: 2,
            backgroundColor: '#ffffff',
        });

        // 转换为图片并下载
        const link = document.createElement('a');
        link.download = `报价单_${quote.quoteNo}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } finally {
        document.body.removeChild(container);
    }
}

/**
 * 报价单导出菜单组件
 */
export function QuoteExportMenu({ quote, renderPdfButtons }: QuoteExportMenuProps) {
    const handleExcelExport = async () => {
        toast.promise(exportToExcel(quote), {
            loading: '正在生成 Excel...',
            success: 'Excel 导出成功',
            error: 'Excel 导出失败',
        });
    };

    const handleImageExport = async () => {
        toast.promise(exportToImage(quote), {
            loading: '正在生成图片...',
            success: '图片导出成功',
            error: '图片导出失败',
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    导出
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {/* PDF 导出（由父组件提供） */}
                {renderPdfButtons}

                {/* Excel 导出 */}
                <DropdownMenuItem onClick={handleExcelExport}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    导出 Excel
                </DropdownMenuItem>

                {/* 图片导出（微信分享） */}
                <DropdownMenuItem onClick={handleImageExport}>
                    <Image className="mr-2 h-4 w-4" />
                    导出图片（微信分享）
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
