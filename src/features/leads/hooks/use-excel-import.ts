import { useState } from 'react';
import { toast } from 'sonner';
import { parseExcelArrayBuffer, downloadExcelTemplate } from '@/shared/utils/excel';
import {
  LEAD_TEMPLATE_HEADER,
  LEAD_TEMPLATE_EXAMPLE,
  mapExcelRowToLead,
  ImportedLead,
  ImportResult,
} from '../services/excel-mapping';
import { importLeads } from '../actions';

interface UseExcelImportOptions {
  onSuccess?: () => void;
}

export function useExcelImport(options?: UseExcelImportOptions) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportedLead[]>([]);
  const [stats, setStats] = useState<{ total: number; valid: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const resetState = () => {
    setFile(null);
    setPreviewData([]);
    setStats(null);
    setIsUploading(false);
    setImportResult(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadExcelTemplate(LEAD_TEMPLATE_HEADER, LEAD_TEMPLATE_EXAMPLE, '线索导入模版.xlsx');
    } catch (_err) {
      toast.error('下载模版失败');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const jsonData = await parseExcelArrayBuffer(buffer);

        // 映射字段
        const mappedData = jsonData.map(mapExcelRowToLead);

        setPreviewData(mappedData.slice(0, 5)); // 预览前 5 条
        setStats({ total: mappedData.length, valid: mappedData.length }); // Simple stat
      } catch (_err) {
        toast.error('解析文件失败');
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleImport = async () => {
    if (!file) return;
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const jsonData = await parseExcelArrayBuffer(buffer);

        // 映射字段
        const mappedData = jsonData.map(mapExcelRowToLead);

        const result = await importLeads(mappedData);
        setImportResult(result);

        if (result.successCount > 0) {
          toast.success(`成功导入 ${result.successCount} 条线索`);
          options?.onSuccess?.();
        }

        if (result.errors.length > 0) {
          toast.warning(`${result.errors.length} 条数据导入失败，请查看详情`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '未知错误';
        toast.error('导入失败: ' + message);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return {
    file,
    previewData,
    stats,
    isUploading,
    importResult,
    handleDownloadTemplate,
    handleFileChange,
    handleImport,
    resetState,
  };
}
