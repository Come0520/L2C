import { useCallback } from 'react';

import { ExportFormat } from '@/components/ui/export-menu';
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/export';

export interface ColumnConfig {
  header: string;
  dataKey: string;
  // 可选：格式化函数
  formatter?: (value: any, row: any) => any;
}

export interface UseExportOptions {
  filename: string;
  columns?: ColumnConfig[];
}

export function useExport<T extends Record<string, any>>(options: UseExportOptions) {
  const { filename, columns } = options;

  const handleExport = useCallback((data: T[], format: ExportFormat) => {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // 如果配置了列，先进行数据处理
    let exportData: Record<string, any>[] = data;
    
    if (columns) {
      exportData = data.map(row => {
        const newRow: Record<string, any> = {};
        columns.forEach(col => {
          const value = row[col.dataKey];
          // 如果有格式化函数，使用格式化后的值
          newRow[col.header] = col.formatter ? col.formatter(value, row) : value;
        });
        return newRow;
      });
    }

    switch (format) {
      case 'csv':
        exportToCSV(exportData, filename);
        break;
      case 'excel':
        exportToExcel(exportData, filename);
        break;
      case 'pdf':
        // PDF 导出可能需要传递列配置给 autoTable
        // 如果我们已经在上面转换了数据（key变成了中文header），那么传递给PDF的数据已经是处理过的了
        // 但是 jspdf-autotable 需要知道列的顺序。
        // 如果我们转换了数据，key 就是 header。
        // 为了简单起见，如果转换了数据，我们就不传递 columns 参数给 exportToPDF（让它自动推断）
        // 或者我们可以重新构造 columns 参数
        
        // 简单策略：直接使用转换后的数据
        exportToPDF(exportData, filename);
        break;
    }
  }, [filename, columns]);

  return {
    handleExport
  };
}
