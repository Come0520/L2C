// 测量报告生成器

import { MeasurementRoom } from '@/types/measurement';
interface MeasurementInput {
  id?: string;
  measurementNo?: string;
  customerName?: string;
  projectAddress?: string;
  surveyorName?: string;
  completedAt?: string | number | Date;
  measurementData?: {
    totalArea?: number;
    rooms?: MeasurementRoom[];
  };
  notes?: string;
}

// 测量报告类型
export interface MeasurementReport {
  id: string;
  measurementId: string;
  measurementNo: string;
  customerName: string;
  projectAddress: string;
  surveyorName: string;
  surveyDate: string;
  totalArea: number;
  rooms: MeasurementRoom[];
  notes?: string;
}

// 报告生成器选项
export interface ReportGeneratorOptions {
  format: 'json' | 'pdf' | 'html';
  includeRooms?: boolean;
  includePhotos?: boolean;
  template?: 'standard' | 'detailed';
}

/**
 * 测量报告生成器类
 */
export class ReportGenerator {
  /**
   * 生成测量报告
   * @param data 测量数据
   * @param options 生成选项
   * @returns 生成的报告
   */
  static generateReport(measurement: MeasurementInput, options: ReportGeneratorOptions): any {
    switch (options.format) {
      case 'json':
        return this.generateJsonReport(measurement, options);
      case 'pdf':
        return this.generatePdfReport(measurement, options);
      case 'html':
        return this.generateHtmlReport(measurement, options);
      default:
        throw new Error(`Unsupported report format: ${options.format}`);
    }
  }

  /**
   * 生成JSON格式报告
   * @param data 测量数据
   * @param options 生成选项
   * @returns JSON格式报告
   */
  private static generateJsonReport(measurement: MeasurementInput, optionsParam: ReportGeneratorOptions): MeasurementReport {
    void optionsParam;
    const report: MeasurementReport = {
      id: `report-${Date.now()}`,
      measurementId: measurement.id || '',
      measurementNo: measurement.measurementNo || measurement.id?.substring(0, 8) || 'N/A',
      customerName: measurement.customerName || 'N/A',
      projectAddress: measurement.projectAddress || 'N/A',
      surveyorName: measurement.surveyorName || 'N/A',
      surveyDate: measurement.completedAt ? new Date(measurement.completedAt).toISOString() : new Date().toISOString(),
      totalArea: measurement.measurementData?.totalArea || 0,
      rooms: measurement.measurementData?.rooms || [],
      notes: measurement.notes || ''
    };

    return report;
  }

  /**
   * 生成PDF格式报告
   * @param data 测量数据
   * @param options 生成选项
   * @returns PDF报告（二进制数据或Base64编码）
   */
  private static generatePdfReport(measurement: MeasurementInput, options: ReportGeneratorOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // 动态导入jsPDF，避免影响初始加载性能
        import('jspdf').then(({ jsPDF }) => {
          import('jspdf-autotable').then(() => {
            const doc = new jsPDF();

            // 生成报告标题
            doc.setFontSize(16);
            doc.text('测量报告', 105, 20, { align: 'center' });

            // 生成报告基本信息
            doc.setFontSize(12);
            doc.text(`测量单号: ${measurement.measurementNo || measurement.id?.substring(0, 8) || 'N/A'}`, 20, 40);
            doc.text(`客户名称: ${measurement.customerName || 'N/A'}`, 20, 50);
            doc.text(`项目地址: ${measurement.projectAddress || 'N/A'}`, 20, 60);
            doc.text(`测量师: ${measurement.surveyorName || 'N/A'}`, 20, 70);
            doc.text(`测量日期: ${measurement.completedAt ? new Date(measurement.completedAt).toLocaleDateString() : new Date().toLocaleDateString()}`, 20, 80);
            doc.text(`总面积: ${(measurement.measurementData?.totalArea || 0).toFixed(2)} m²`, 20, 90);

            // 生成房间测量数据表格
            if (options.includeRooms && measurement.measurementData?.rooms && measurement.measurementData.rooms.length > 0) {
              doc.text('房间测量数据', 20, 110);

              // 准备表格数据
              const tableData = measurement.measurementData.rooms.map((room: MeasurementRoom, index: number) => [
                index + 1,
                room.name,
                `${room.area?.toFixed(2) ?? '0.00'} m²`,
                `${room.items?.length ?? 0}`
              ]);

              // 配置表格列
              const columns = [
                { title: '序号', dataKey: 'index', width: 20 },
                { title: '房间名称', dataKey: 'name', width: 60 },
                { title: '面积', dataKey: 'area', width: 40 },
                { title: '项目数', dataKey: 'items', width: 30 }
              ];

              // 生成表格
              (doc as any).autoTable({
                head: [columns.map(col => col.title)],
                body: tableData,
                startY: 120,
                margin: { left: 20, right: 20 },
                styles: {
                  fontSize: 10,
                  cellPadding: 2
                },
                headStyles: {
                  fillColor: [66, 133, 244],
                  textColor: 255,
                  fontStyle: 'bold'
                }
              });
            }

            // 生成报告底部
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
              doc.setPage(i);
              doc.setFontSize(8);
              doc.text(
                `Page ${i} of ${pageCount}`,
                105,
                (doc as any).internal.pageSize.height - 10,
                { align: 'center' }
              );
            }

            // 转换为Blob对象
            const blob = doc.output('blob');
            resolve(blob);
          }).catch(reject);
        }).catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 生成HTML格式报告
   * @param data 测量数据
   * @param options 生成选项
   * @returns HTML格式报告
   */
  private static generateHtmlReport(input: MeasurementInput, options: ReportGeneratorOptions): string {
    const report = this.generateJsonReport(input, options);

    // 生成HTML模板
    return `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>测量报告</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            padding: 20px;
            border: 1px solid #ddd;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 {
            text-align: center;
            color: #333;
          }
          .report-header {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #ddd;
          }
          .report-info {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 20px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
          }
          .info-label {
            font-weight: bold;
          }
          .rooms-section {
            margin-top: 30px;
          }
          .rooms-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          .rooms-table th,
          .rooms-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          .rooms-table th {
            background-color: #f2f2f2;
          }
          .total-area {
            margin-top: 20px;
            text-align: right;
            font-weight: bold;
          }
          .report-footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <h1>测量报告</h1>
        
        <div class="report-header">
          <div class="report-info">
            <div class="info-item">
              <span class="info-label">测量单号:</span>
              <span>${report.measurementNo}</span>
            </div>
            <div class="info-item">
              <span class="info-label">客户名称:</span>
              <span>${report.customerName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">项目地址:</span>
              <span>${report.projectAddress}</span>
            </div>
            <div class="info-item">
              <span class="info-label">测量师:</span>
              <span>${report.surveyorName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">测量日期:</span>
              <span>${new Date(report.surveyDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        ${report.rooms.length > 0 ? `
          <div class="rooms-section">
            <h2>房间测量数据</h2>
            <table class="rooms-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>房间名称</th>
                  <th>面积 (m²)</th>
                  <th>项目数</th>
                  <th>面积 (m²)</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                ${report.rooms.map((room, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${room.name}</td>
                    <td>${room.area?.toFixed(2) ?? '0.00'}</td>
                    <td>${room.items?.length ?? 0}</td>
                    <td>${room.area.toFixed(2)}</td>
                    <td>-</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total-area">
              总面积: ${report.totalArea.toFixed(2)} m²
            </div>
          </div>
        ` : ''}
        
        <div class="report-footer">
          <p>报告生成时间: ${new Date().toLocaleString()}</p>
          <p>测量报告 - 仅供参考</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 下载报告
   * @param data 测量数据
   * @param options 生成选项
   * @param filename 文件名
   */
  static async downloadReport(measurement: MeasurementInput, options: ReportGeneratorOptions, filename?: string): Promise<void> {
    const report = await this.generateReport(measurement, options);
    const defaultFilename = `测量报告-${Date.now()}`;
    const finalFilename = filename || defaultFilename;

    switch (options.format) {
      case 'pdf':
        this.downloadPdf(report, finalFilename);
        break;
      case 'json':
        this.downloadJson(report, finalFilename);
        break;
      case 'html':
        this.downloadHtml(report, finalFilename);
        break;
      default:
        throw new Error(`Unsupported report format: ${options.format}`);
    }
  }

  /**
   * 下载PDF格式报告
   * @param blob PDF blob对象
   * @param filename 文件名
   */
  private static downloadPdf(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * 下载JSON格式报告
   * @param data JSON数据
   * @param filename 文件名
   */
  private static downloadJson(jsonData: unknown, filename: string): void {
    const jsonStr = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * 下载HTML格式报告
   * @param html HTML字符串
   * @param filename 文件名
   */
  private static downloadHtml(html: string, filename: string): void {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
