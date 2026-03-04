'use client';

import { Button } from '@/shared/ui/button';
import Download from 'lucide-react/dist/esm/icons/download';
import FileSpreadsheet from 'lucide-react/dist/esm/icons/file-spreadsheet';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { toast } from 'sonner';
import { getTenantInfo } from '@/features/settings/actions/tenant-info';

interface QuoteData {
  id: string;
  quoteNo: string;
  title?: string | null;
  createdAt?: Date | string | number | null;
  customer?: {
    name?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
  deliveryAddress?: string | null;
  items?: Array<{
    id?: string;
    productName: string;
    width?: string | number | null;
    height?: string | number | null;
    quantity?: string | number | null;
    unitPrice?: string | number | null;
    subtotal?: string | number | null;
    costPrice?: string | number | null;
    remark?: string | null;
    roomId?: string | null;
    category?: string | null;
  }>;
  rooms?: Array<{
    id: string;
    name: string;
  }>;
  totalAmount?: string | number | null;
  discountAmount?: string | number | null;
  finalAmount?: string | number | null;
  notes?: string | null;
  /** 租户品牌信息，由导出时动态注入 */
  tenant?: {
    name: string;
    logoUrl: string | null;
    phone: string;
    address: string;
    wechatQrcodeUrl: string | null;
  };
}

/**
 * 条件注入租户品牌信息
 * 仅当租户有实质品牌数据（Logo/地址/电话）时注入
 */
function injectTenantBranding(
  quote: QuoteData,
  tenantResult: {
    success: boolean;
    data?: {
      name: string;
      logoUrl: string | null;
      contact: { address: string; phone: string; email: string };
      wechatQrcodeUrl: string | null;
    };
  }
): QuoteData {
  if (!tenantResult.success || !tenantResult.data) return quote;
  const t = tenantResult.data;
  const hasBranding = t.logoUrl || t.contact.address || t.contact.phone;
  if (!hasBranding) return quote;
  return {
    ...quote,
    tenant: {
      name: t.name,
      logoUrl: t.logoUrl,
      phone: t.contact.phone,
      address: t.contact.address,
      wechatQrcodeUrl: t.wechatQrcodeUrl,
    },
  };
}

export interface QuoteExportMenuProps {
  quote: QuoteData;
  renderPdfButtons?: React.ReactNode;
}

/**
 * 导出报价单为 Excel 格式
 */
async function exportToExcel(quote: QuoteData): Promise<void> {
  // 动态导入 exceljs 和 file-saver
  const { Workbook } = await import('exceljs');
  const { saveAs } = await import('file-saver');

  const workbook = new Workbook();
  const ws = workbook.addWorksheet('报价明细');

  // 准备数据
  const roomMap = new Map((quote.rooms || []).map((r) => [r.id, r.name]));

  // 条件插入品牌信息首行
  let dataStartRow = 1;
  if (quote.tenant) {
    ws.addRow([quote.tenant.name, '', '', '', '', '', '']);
    const contactParts: string[] = [];
    if (quote.tenant.phone) contactParts.push(`电话: ${quote.tenant.phone}`);
    if (quote.tenant.address) contactParts.push(`地址: ${quote.tenant.address}`);
    if (contactParts.length > 0) {
      ws.addRow([contactParts.join('  |  '), '', '', '', '', '', '']);
    }
    ws.addRow([]); // 空行分隔
    dataStartRow = ws.rowCount + 1;
  }

  // 设置表头
  const defaultHeaders = ['空间', '商品名称', '宽度(cm)', '高度(cm)', '数量', '单价(¥)', '小计(¥)'];
  ws.addRow(defaultHeaders);

  // 插入数据
  const rows = (quote.items || []).map((item) => [
    roomMap.get(item.roomId || '') || '未分配',
    item.productName,
    item.width || '-',
    item.height || '-',
    item.quantity || '-',
    item.unitPrice || '-',
    item.subtotal || '-',
  ]);
  ws.addRows(rows);

  // 设置列宽
  ws.columns = [
    { width: 15 },
    { width: 25 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 12 },
    { width: 12 },
  ];

  // 添加汇总行
  ws.addRow([]);
  ws.addRow(['', '', '', '', '', '商品合计:', quote.totalAmount || 0]);
  ws.addRow(['', '', '', '', '', '折扣:', quote.discountAmount || 0]);
  ws.addRow(['', '', '', '', '', '最终报价:', quote.finalAmount || 0]);

  // 导出文件
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `报价单_${quote.quoteNo}.xlsx`);
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

  const roomMap = new Map((quote.rooms || []).map((r) => [r.id, r.name]));

  // 生成 HTML 内容
  const brandHtml = quote.tenant
    ? `
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #f0f4ff, #e8f0fe); border-radius: 12px;">
            ${quote.tenant.logoUrl ? `<img src="${quote.tenant.logoUrl}" style="width: 60px; height: 60px; object-fit: contain; border-radius: 8px;" />` : ''}
            <div style="flex: 1;">
                <h2 style="font-size: 20px; margin: 0; color: #1a73e8;">${quote.tenant.name}</h2>
                <p style="color: #666; margin: 5px 0 0; font-size: 13px;">
                    ${[quote.tenant.phone ? `电话: ${quote.tenant.phone}` : '', quote.tenant.address ? `地址: ${quote.tenant.address}` : ''].filter(Boolean).join(' | ')}
                </p>
            </div>
            ${
              quote.tenant.wechatQrcodeUrl
                ? `
                <div style="text-align: center;">
                    <img src="${quote.tenant.wechatQrcodeUrl}" style="width: 70px; height: 70px; object-fit: contain;" />
                    <p style="font-size: 10px; color: #999; margin: 3px 0 0;">扫码添加微信</p>
                </div>
            `
                : ''
            }
        </div>
    `
    : '';

  container.innerHTML = `
        ${brandHtml}
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
                ${(quote.items || [])
                  .map(
                    (item) => `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">${roomMap.get(item.roomId || '') || '-'}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${item.productName}</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.width || '-'} × ${item.height || '-'}</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.quantity || '-'}</td>
                        <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">¥${Number(item.subtotal || 0).toFixed(2)}</td>
                    </tr>
                `
                  )
                  .join('')}
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
  const handlePdfExport = async () => {
    toast.promise(
      (async () => {
        // 动态导入 + 获取租户品牌信息
        const [{ pdf }, { QuotePdfDocument }, { saveAs }, tenantResult] = await Promise.all([
          import('@react-pdf/renderer'),
          import('./quote-pdf'),
          import('file-saver'),
          getTenantInfo(),
        ]);

        // 条件注入品牌信息
        const quoteWithTenant = injectTenantBranding(quote, tenantResult);
        const asPdf = pdf(<QuotePdfDocument quote={quoteWithTenant as any} mode="customer" />);
        const blob = await asPdf.toBlob();
        saveAs(blob, `专属报价方案-${quote.quoteNo}.pdf`);
      })(),
      {
        loading: '正在生成 PDF...',
        success: 'PDF 导出成功',
        error: (err) => `PDF 导出失败: ${err.message}`,
      }
    );
  };

  const handleExcelExport = async () => {
    toast.promise(
      (async () => {
        const tenantResult = await getTenantInfo();
        const quoteWithTenant = injectTenantBranding(quote, tenantResult);
        await exportToExcel(quoteWithTenant as any);
      })(),
      {
        loading: '正在生成 Excel...',
        success: 'Excel 导出成功',
        error: 'Excel 导出失败',
      }
    );
  };

  const handleImageExport = async () => {
    toast.promise(
      (async () => {
        const tenantResult = await getTenantInfo();
        const quoteWithTenant = injectTenantBranding(quote, tenantResult);
        await exportToImage(quoteWithTenant as any);
      })(),
      {
        loading: '正在生成长图...',
        success: '长图导出成功',
        error: '长图导出失败',
      }
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          导出
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {renderPdfButtons || (
          <DropdownMenuItem onClick={handlePdfExport}>
            <FileText className="mr-2 h-4 w-4" />
            导出报价单 (PDF)
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleExcelExport}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          导出表格数据 (Excel)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleImageExport}>
          <ImageIcon className="mr-2 h-4 w-4" />
          生成分享长图 (适合微信)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
