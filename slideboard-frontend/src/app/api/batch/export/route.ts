import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

/**
 * GET /api/batch/export?resource=leads&ids=xxx&format=csv
 * Export data to different formats (csv, excel, pdf)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');
    const idsParam = searchParams.get('ids');
    const format = searchParams.get('format') || 'csv';

    if (!resource || !['leads', 'orders'].includes(resource)) {
      return new NextResponse('Invalid resource type', { status: 400 });
    }

    if (format && !['csv', 'excel', 'pdf'].includes(format)) {
      return new NextResponse('Invalid format', { status: 400 });
    }

    let query = supabase.from(resource as 'leads' | 'orders').select('*');

    if (idsParam) {
      const ids = idsParam.split(',');
      query = query.in('id', ids);
    }

    const { data, error } = await query;

    if (error) {
      return new NextResponse(error.message, { status: 500 });
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
  } catch (err) {
    console.error('Export error:', err);
    return new NextResponse(String(err), { status: 500 });
  }
}
