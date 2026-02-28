import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const publicTemplatesDir = path.join(process.cwd(), 'public', 'templates');

if (!fs.existsSync(publicTemplatesDir)) {
    fs.mkdirSync(publicTemplatesDir, { recursive: true });
}

const templatePath = path.join(publicTemplatesDir, 'product_import_template.xlsx');

const headers = ['产品名称', 'SKU型号', '品类', '零售价', '采购价'];

// Optional: add some sample data or explanation
const data = [
    headers,
    ['示例商品A', 'SKU-001', '电子产品', 199.99, 100],
    ['示例商品B', 'SKU-002', '服装', 59.9, 20]
];

const ws = XLSX.utils.aoa_to_sheet(data);

// Adjust column widths
ws['!cols'] = [
    { wch: 30 }, // 产品名称
    { wch: 15 }, // SKU型号
    { wch: 15 }, // 品类
    { wch: 10 }, // 零售价
    { wch: 10 }, // 采购价
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, '商品导入模板');

XLSX.writeFile(wb, templatePath);

console.log(`Successfully generated template at ${templatePath}`);
