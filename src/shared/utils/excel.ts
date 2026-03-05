/**
 * Excel 导入导出通用工具函数
 * 将非 React 的纯逻辑从组件中抽离，方便复用和测试
 */

/**
 * 将 Excel 文件 (ArrayBuffer) 解析为 JS 对象数组
 * @param buffer 从 FileReader 读取的 ArrayBuffer
 * @returns 包含每一行数据的对象数组，键为表头内容
 */
export async function parseExcelArrayBuffer(
  buffer: ArrayBuffer
): Promise<Record<string, unknown>[]> {
  // 动态导入，避免增加初始 Bundle Size
  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();
  await workbook.xlsx.load(buffer);
  const ws = workbook.worksheets[0];

  const jsonData: Record<string, unknown>[] = [];
  if (ws) {
    const headers: string[] = [];
    ws.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value ? String(cell.value) : `Column${colNumber}`;
    });

    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 跳过表头
      const rowData: Record<string, unknown> = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          rowData[header] = cell.value;
        }
      });
      jsonData.push(rowData);
    });
  }
  return jsonData;
}

/**
 * 生成并下载 Excel 模版文件
 * @param headers 表头数组，例如 ['客户姓名', '手机号']
 * @param exampleRow 示例行数据数组，需与表头对应
 * @param filename 下载的文件名（含后缀 .xlsx）
 */
export async function downloadExcelTemplate(
  headers: string[],
  exampleRow: string[],
  filename: string
): Promise<void> {
  const { Workbook } = await import('exceljs');
  const { saveAs } = await import('file-saver');

  const workbook = new Workbook();
  const ws = workbook.addWorksheet('模版');
  ws.addRow(headers);
  if (exampleRow.length > 0) {
    ws.addRow(exampleRow);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  saveAs(blob, filename);
}
