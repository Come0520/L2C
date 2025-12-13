import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface MeasurementRecord {
  quoteNo?: string
  customerName?: string
  customerPhone?: string
  projectAddress?: string
  surveyorName?: string
  scheduledAt?: string
  status: string
  measurementData?: { remark?: string }
  createdAt?: string | number | Date
}

/**
 * 导出数据到Excel文件
 * @param data 要导出的数据数组
 * @param filename 文件名(不含扩展名)
 * @param sheetName 工作表名称
 */
export function exportToExcel(
    rows: Array<Record<string, unknown>>,
    filename: string,
    sheetName: string = 'Sheet1'
): void {
    if (rows.length === 0) {
        return
    }

    // 创建工作簿
    const wb = XLSX.utils.book_new()

    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(rows)

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    // 生成带时间戳的文件名
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const fullFilename = `${filename}_${timestamp}.xlsx`

    // 导出文件
    XLSX.writeFile(wb, fullFilename)
}

/**
 * 导出数据到CSV文件(UTF-8 BOM)
 * @param data 要导出的数据数组
 * @param filename 文件名(不含扩展名)
 */
export function exportToCSV(
    rows: Array<Record<string, unknown>>,
    filename: string
): void {
    if (rows.length === 0) {
        return
    }

    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(rows)

    // 转换为CSV
    const csv = XLSX.utils.sheet_to_csv(ws)

    // 添加UTF-8 BOM以支持中文
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })

    // 创建下载链接
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    link.setAttribute('download', `${filename}_${timestamp}.csv`)
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
 * @param columns 列配置（可选，用于指定列顺序和标题）
 */
export function exportToPDF(
    rows: Array<Record<string, unknown>>,
    filename: string,
    columns?: { header: string; dataKey: string }[]
): void {
    if (rows.length === 0) {
        return
    }

    const doc = new jsPDF()

    // 准备表头和数据
    let head: string[][] = []
    let body: any[][] = []

    if (columns) {
        head = [columns.map(c => c.header)]
        body = rows.map(row => columns.map(c => row[c.dataKey]))
    } else {
        // 如果没有提供列配置，自动从第一行获取键作为表头
        const firstRow = rows[0]
        if (!firstRow) return

        const keys = Object.keys(firstRow)
        head = [keys]
        body = rows.map(row => keys.map(k => row[k]))
    }

    // 添加字体支持中文（注意：jspdf 默认不支持中文，需要加载字体，这里暂时使用默认字体，
    // 实际生产中需要引入支持中文的 ttf 字体并 addFileToVFS）
    // 为了防止中文乱码，建议在实际项目中配置中文字体
    // 这里简单处理：如果包含中文，可能会显示乱码，提示用户

    autoTable(doc, {
        head: head,
        body: body,
        styles: { font: 'helvetica' }, // 默认字体
        headStyles: { fillColor: [66, 66, 66] },
    })

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    doc.save(`${filename}_${timestamp}.pdf`)
}


/**
 * 格式化测量单数据用于导出
 * @param measurements 测量单数组
 * @returns 格式化后的数据
 */
export function formatMeasurementsForExport(measurements: MeasurementRecord[]) {
    return measurements.map(item => ({
        '测量单号': item.quoteNo || '',
        '客户姓名': item.customerName || '',
        '客户电话': item.customerPhone || '',
        '项目地址': item.projectAddress || '',
        '测量师': item.surveyorName || '未分配',
        '预约时间': item.scheduledAt || '未预约',
        '状态': getStatusText(item.status),
        '备注': item.measurementData?.remark || '',
        '创建时间': item.createdAt ? new Date(item.createdAt).toLocaleString('zh-CN') : ''
    }))
}

/**
 * 获取状态文本
 */
function getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
        'measuring_pending_assignment': '测量中-待分配',
        'measuring_assigning': '测量中-分配中',
        'measuring_pending_visit': '测量中-待上门',
        'measuring_pending_confirmation': '测量中-待确认'
    }
    return statusMap[status] || status
}
