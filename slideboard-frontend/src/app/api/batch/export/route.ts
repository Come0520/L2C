import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { withApiHandler, ApiError, validateRequest } from '@/utils/api-error-handler';
import { withAuth } from '@/middleware/auth';

export const runtime = 'edge';

// 定义请求参数验证schema
const querySchema = z.object({
  resource: z.enum(['leads', 'orders']),
  ids: z.string().optional(),
  format: z.enum(['csv', 'excel', 'pdf']).optional().default('csv')
});

/**
 * GET /api/batch/export?resource=leads&ids=xxx&format=csv
 * Export data to different formats (csv, excel, pdf)
 */
const handleGet = async (request: NextRequest, userId: string) => {
  const supabase = await createClient();
  
  const { searchParams } = new URL(request.url);
  
  // 验证请求参数
  const queryParams = Object.fromEntries(searchParams.entries());
  const validationResult = await validateRequest(querySchema, queryParams);
  
  if (!validationResult.success) {
    throw validationResult.error;
  }
  
  const { resource, ids, format } = validationResult.data;
  const idsArray = ids ? ids.split(',') : undefined;

  // 获取数据
  let query = supabase.from(resource).select('*');

  if (idsArray) {
    query = query.in('id', idsArray);
  }

  const { data, error } = await query;

  if (error) {
    throw new ApiError('DB_ERROR', 'Failed to fetch data', 500, error);
  }

  if (!data || data.length === 0) {
    return new NextResponse('', {
      headers: { 'Content-Type': 'text/csv' }
    });
  }

  // Convert data to array of arrays for easier handling
  const firstRow = data[0] || {};
  const headers = Object.keys(firstRow);
  const rows = data.map(row => {
    return headers.map(header => {
      const val = (row as any)[header];
      if (val === null || val === undefined) {
        return '';
      }
      if (typeof val === 'object') {
        return JSON.stringify(val);
      }
      return String(val);
    });
  });

  // Generate file based on format
  let fileContent: Blob | string;
  let contentType: string;
  let filename: string;

  switch (format) {
    case 'excel':
      // Generate Excel file
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, resource);
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      fileContent = new Blob([excelBuffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `${resource}_export_${Date.now()}.xlsx`;
      break;

    case 'pdf':
      // Generate PDF file
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text(`${resource.charAt(0).toUpperCase() + resource.slice(1)} Export`, 14, 16);
      
      // Add table
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 20,
        theme: 'striped',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        }
      });
      
      fileContent = doc.output('blob');
      contentType = 'application/pdf';
      filename = `${resource}_export_${Date.now()}.pdf`;
      break;

    case 'csv':
    default:
      // Generate CSV
      const csvRows = [
        headers.join(','), // Header row
        ...rows.map(row => {
          return row.map(cell => {
            // Handle special characters and quotes
            const escaped = ('' + cell).replace(/"/g, '""');
            return `"${escaped}"`;
          }).join(',');
        })
      ];
      
      fileContent = csvRows.join('\n');
      contentType = 'text/csv';
      filename = `${resource}_export_${Date.now()}.csv`;
      break;
  }

  return new NextResponse(fileContent, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
};

// 允许访问的角色
const ALLOWED_ROLES = ['admin', 'LEAD_ADMIN', 'LEAD_SALES', 'LEAD_CHANNEL', 'SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL'];

export const GET = withApiHandler(withAuth(handleGet, ALLOWED_ROLES));
