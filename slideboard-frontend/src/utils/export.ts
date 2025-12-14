import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

/**
 * 测量记录接口
 */
export interface MeasurementRecord {
  quoteNo?: string
  customerName?: string
  customerPhone?: string
  projectAddress?: string
  surveyorName?: string
  scheduledAt?: string
  status: string
  measurementData?: { remark?: string; totalArea?: number; rooms?: Array<{ name?: string; area?: number }> }
  createdAt?: string | number | Date
}

/**
 * 导出格式类型
 */
export type ExportFormat = 'excel' | 'csv' | 'pdf' | 'word'

/**
 * 列配置接口
 */
export interface ExportColumn {
  /**
   * 显示标题
   */
  header: string
  /**
   * 数据键名
   */
  dataKey: string
  /**
   * 宽度（可选）
   */
  width?: number | string
  /**
   * 对齐方式（可选）
   */
  align?: 'left' | 'center' | 'right'
  /**
   * 格式化函数（可选）
   */
  formatter?: (value: any) => any
}

/**
 * 导出选项接口
 */
export interface ExportOptions {
  /**
   * 工作表名称（仅Excel）
   */
  sheetName?: string
  /**
   * 列配置
   */
  columns?: ExportColumn[]
  /**
   * 是否包含时间戳
   */
  includeTimestamp?: boolean
  /**
   * 标题（仅PDF和Word）
   */
  title?: string
  /**
   * 作者（仅Word）
   */
  author?: string
  /**
   * 主题（仅Word）
   */
  subject?: string
}

/**
 * 格式化日期
 * @param date 日期对象或字符串
 * @returns 格式化后的日期字符串
 */
function formatDate(date: string | number | Date): string {
  return new Date(date).toLocaleString('zh-CN')
}

/**
 * 获取状态文本
 * @param status 状态值
 * @returns 状态显示文本
 */
export function getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
        'measuring_pending_assignment': '测量中-待分配',
        'measuring_assigning': '测量中-分配中',
        'measuring_pending_visit': '测量中-待上门',
        'measuring_pending_confirmation': '测量中-待确认',
        'measuring_completed': '测量完成',
        'measuring_cancelled': '测量取消',
        'measuring_rescheduled': '测量改期',
        'measuring_in_progress': '测量进行中',
        'pending_survey': '待测量',
        'survey_completed': '测量完成'
    }
    return statusMap[status] || status
}

/**
 * 导出数据到Excel文件
 * @param rows 要导出的数据数组
 * @param filename 文件名(不含扩展名)
 * @param options 导出选项
 */
export function exportToExcel(
    rows: Array<Record<string, unknown>>,
    filename: string,
    options: ExportOptions = {}
): void {
    if (rows.length === 0) {
        return
    }

    const { sheetName = 'Sheet1', columns, includeTimestamp = true } = options

    // 格式化数据（应用列配置）
    const formattedRows = formatExportData(rows, columns)

    // 创建工作簿
    const wb = XLSX.utils.book_new()

    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(formattedRows)

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    // 生成文件名
    const fullFilename = generateFilename(filename, 'xlsx', includeTimestamp)

    // 导出文件
    XLSX.writeFile(wb, fullFilename)
}

/**
 * 导出数据到CSV文件(UTF-8 BOM)
 * @param rows 要导出的数据数组
 * @param filename 文件名(不含扩展名)
 * @param options 导出选项
 */
export function exportToCSV(
    rows: Array<Record<string, unknown>>,
    filename: string,
    options: ExportOptions = {}
): void {
    if (rows.length === 0) {
        return
    }

    const { columns, includeTimestamp = true } = options

    // 格式化数据（应用列配置）
    const formattedRows = formatExportData(rows, columns)

    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(formattedRows)

    // 转换为CSV
    const csv = XLSX.utils.sheet_to_csv(ws)

    // 添加UTF-8 BOM以支持中文
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })

    // 创建下载链接
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    // 生成文件名
    const fullFilename = generateFilename(filename, 'csv', includeTimestamp)

    link.setAttribute('href', url)
    link.setAttribute('download', fullFilename)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 释放URL对象
    URL.revokeObjectURL(url)
}

/**
 * 导出数据到PDF文件
 * @param rows 要导出的数据数组
 * @param filename 文件名(不含扩展名)
 * @param options 导出选项
 */
export function exportToPDF(
    rows: Array<Record<string, unknown>>,
    filename: string,
    options: ExportOptions = {}
): void {
    if (rows.length === 0) {
        return
    }

    const { columns, includeTimestamp = true, title = '测量数据报告' } = options

    // 格式化数据（应用列配置）
    const formattedRows = formatExportData(rows, columns)

    const doc = new jsPDF()

    // 准备表头和数据
    let head: string[][] = []
    let body: any[][] = []
    let headers: string[] = []
    let dataKeys: string[] = []

    if (columns) {
        headers = columns.map(c => c.header)
        dataKeys = columns.map(c => c.dataKey)
    } else {
        // 如果没有提供列配置，自动从第一行获取键作为表头
        const firstRow = formattedRows[0]
        if (!firstRow) return

        dataKeys = Object.keys(firstRow)
        headers = dataKeys
    }

    head = [headers]
    body = formattedRows.map(row => dataKeys.map(k => row[k]))

    // 添加标题
    doc.setFontSize(16)
    doc.text(title, 14, 15)

    // 添加日期
    doc.setFontSize(10)
    doc.text(`生成日期: ${new Date().toLocaleString('zh-CN')}`, 14, 22)

    // 添加表格
    autoTable(doc, {
        head: head,
        body: body,
        startY: 30,
        styles: { font: 'helvetica', fontSize: 10 }, // 默认字体
        headStyles: { fillColor: [66, 66, 66], textColor: 255, fontStyle: 'bold' },
        bodyStyles: { textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        columnStyles: columns?.reduce((acc, col, index) => {
            acc[index] = {
                halign: col.align || 'left',
                cellWidth: col.width || 'auto'
            }
            return acc
        }, {} as any) || {},
        foot: [['总计', '', '', '', formattedRows.length.toString()]],
        footStyles: { fillColor: [220, 220, 220], fontStyle: 'bold' }
    })

    // 生成文件名
    const fullFilename = generateFilename(filename, 'pdf', includeTimestamp)
    doc.save(fullFilename)
}

/**
 * 导出数据到Word文件
 * @param rows 要导出的数据数组
 * @param filename 文件名(不含扩展名)
 * @param options 导出选项
 */
export function exportToWord(
    rows: Array<Record<string, unknown>>,
    filename: string,
    options: ExportOptions = {}
): void {
    if (rows.length === 0) {
        return
    }

    const { columns, includeTimestamp = true, title = '测量数据报告' } = options

    // 格式化数据（应用列配置）
    const formattedRows = formatExportData(rows, columns)

    // 准备HTML内容
    let html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; text-align: center; margin-bottom: 20px; }
        .subtitle { text-align: center; color: #666; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class='subtitle'>生成日期: ${new Date().toLocaleString('zh-CN')}</p>
      <table>
    `

    // 添加表头
    html += '<tr>'
    if (columns) {
        columns.forEach(col => {
            html += `<th>${col.header}</th>`
        })
    } else {
        const firstRow = formattedRows[0]
        if (firstRow) {
            Object.keys(firstRow).forEach(key => {
                html += `<th>${key}</th>`
            })
        }
    }
    html += '</tr>'

    // 添加数据行
    formattedRows.forEach(row => {
        html += '<tr>'
        if (columns) {
            columns.forEach(col => {
                html += `<td>${row[col.dataKey] || ''}</td>`
            })
        } else {
            Object.values(row).forEach(value => {
                html += `<td>${value || ''}</td>`
            })
        }
        html += '</tr>'
    })

    // 添加总计行
    html += `<tr>`
    if (columns) {
        html += `<td colspan="${columns.length - 1}" style="font-weight: bold; text-align: right;">总计</td>`
        html += `<td style="font-weight: bold;">${formattedRows.length}</td>`
    } else {
        const firstRow = formattedRows[0]
        if (firstRow) {
            const keys = Object.keys(firstRow)
            html += `<td colspan="${keys.length - 1}" style="font-weight: bold; text-align: right;">总计</td>`
            html += `<td style="font-weight: bold;">${formattedRows.length}</td>`
        }
    }
    html += `</tr>`

    // 关闭表格和HTML
    html += `
      </table>
      <p class='footer'>共 ${formattedRows.length} 条记录</p>
    </body>
    </html>
    `

    // 创建下载链接
    const blob = new Blob([html], { type: 'application/msword' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    // 生成文件名
    const fullFilename = generateFilename(filename, 'docx', includeTimestamp)

    link.setAttribute('href', url)
    link.setAttribute('download', fullFilename)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 释放URL对象
    URL.revokeObjectURL(url)
}

/**
 * 格式化导出数据
 * @param rows 原始数据
 * @param columns 列配置
 * @returns 格式化后的数据
 */
function formatExportData(rows: Array<Record<string, unknown>>, columns?: ExportColumn[]): Array<Record<string, unknown>> {
    if (!columns) {
        // 如果没有列配置，直接返回原始数据
        return rows
    }

    // 应用列配置和格式化
    return rows.map(row => {
        const formattedRow: Record<string, unknown> = {}
        columns.forEach(col => {
            let value = row[col.dataKey]
            // 应用格式化函数
            if (col.formatter) {
                value = col.formatter(value)
            } else {
                // 默认格式化
                if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
                    value = formatDate(value)
                }
            }
            formattedRow[col.dataKey] = value
        })
        return formattedRow
    })
}

/**
 * 生成带时间戳的文件名
 * @param baseName 基础文件名
 * @param extension 文件扩展名
 * @param includeTimestamp 是否包含时间戳
 * @returns 完整文件名
 */
function generateFilename(baseName: string, extension: string, includeTimestamp: boolean): string {
    if (includeTimestamp) {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
        return `${baseName}_${timestamp}.${extension}`
    }
    return `${baseName}.${extension}`
}

/**
 * 统一导出函数
 * @param rows 要导出的数据
 * @param filename 文件名(不含扩展名)
 * @param format 导出格式
 * @param options 导出选项
 */
export function exportData(
    rows: Array<Record<string, unknown>>,
    filename: string,
    format: ExportFormat,
    options: ExportOptions = {}
): void {
    switch (format) {
        case 'excel':
            exportToExcel(rows, filename, options)
            break
        case 'csv':
            exportToCSV(rows, filename, options)
            break
        case 'pdf':
            exportToPDF(rows, filename, options)
            break
        case 'word':
            exportToWord(rows, filename, options)
            break
        default:
            throw new Error(`不支持的导出格式: ${format}`)
    }
}

/**
 * 格式化测量单数据用于导出
 * @param measurements 测量单数组
 * @returns 格式化后的数据
 */
export function formatMeasurementsForExport(measurements: MeasurementRecord[], includeDetails: boolean = false) {
    if (includeDetails) {
        // 包含详细信息的导出格式
        return measurements.map(item => ({
            '测量单号': item.quoteNo || '',
            '客户姓名': item.customerName || '',
            '客户电话': item.customerPhone || '',
            '项目地址': item.projectAddress || '',
            '测量师': item.surveyorName || '未分配',
            '预约时间': item.scheduledAt ? formatDate(item.scheduledAt) : '未预约',
            '状态': getStatusText(item.status),
            '总面积(m²)': item.measurementData?.totalArea?.toFixed(2) || '0.00',
            '房间数量': item.measurementData?.rooms?.length || 0,
            '备注': item.measurementData?.remark || '',
            '创建时间': item.createdAt ? formatDate(item.createdAt) : ''
        }))
    }
    
    // 简洁导出格式
    return measurements.map(item => ({
        '测量单号': item.quoteNo || '',
        '客户姓名': item.customerName || '',
        '项目地址': item.projectAddress || '',
        '测量师': item.surveyorName || '未分配',
        '预约时间': item.scheduledAt ? formatDate(item.scheduledAt) : '未预约',
        '状态': getStatusText(item.status),
        '备注': item.measurementData?.remark || '',
        '创建时间': item.createdAt ? formatDate(item.createdAt) : ''
    }))
}

/**
 * 格式化测量单详情数据用于导出
 * @param measurement 测量单数据
 * @returns 格式化后的数据
 */
export function formatMeasurementDetailForExport(measurement: MeasurementRecord) {
    const result: Record<string, unknown> = {
        '测量单号': measurement.quoteNo || '',
        '客户姓名': measurement.customerName || '',
        '客户电话': measurement.customerPhone || '',
        '项目地址': measurement.projectAddress || '',
        '测量师': measurement.surveyorName || '未分配',
        '预约时间': measurement.scheduledAt ? formatDate(measurement.scheduledAt) : '未预约',
        '状态': getStatusText(measurement.status),
        '创建时间': measurement.createdAt ? formatDate(measurement.createdAt) : '',
        '总面积(m²)': measurement.measurementData?.totalArea?.toFixed(2) || '0.00',
        '房间数量': measurement.measurementData?.rooms?.length || 0,
        '备注': measurement.measurementData?.remark || ''
    }

    // 添加房间详情
    if (measurement.measurementData?.rooms?.length) {
        measurement.measurementData.rooms.forEach((room, index) => {
            result[`房间${index + 1}名称`] = room.name || ''
            result[`房间${index + 1}面积(m²)`] = room.area?.toFixed(2) || '0.00'
        })
    }

    return result
}

