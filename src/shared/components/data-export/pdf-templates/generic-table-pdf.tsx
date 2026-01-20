'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 30,
    },
    title: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
    },
    table: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#bfbfbf',
    },
    tableRow: {
        flexDirection: 'row',
    },
    tableHeaderCell: {
        margin: 5,
        fontSize: 10,
        fontWeight: 'bold',
    },
    tableCell: {
        margin: 5,
        fontSize: 10,
    },
});

/**
 * 表格行数据类型
 */
type TableRow = Record<string, unknown>;

/**
 * 表格列定义
 */
interface Column<T extends TableRow = TableRow> {
    header: string;
    accessorKey: string | ((row: T) => unknown);
}

/**
 * GenericTablePdf 组件属性
 */
interface GenericTablePdfProps<T extends TableRow = TableRow> {
    title: string;
    columns: Column<T>[];
    data: T[];
}

/**
 * 通用表格 PDF 导出组件
 * @param props - 组件属性
 */
export function GenericTablePdf<T extends TableRow = TableRow>({
    title,
    columns,
    data
}: GenericTablePdfProps<T>) {
    const colWidth = `${100 / (columns.length || 1)}%`;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={{ marginBottom: 20 }}>
                    <Text style={styles.title}>{title}</Text>
                </View>

                <View style={styles.table}>
                    {/* Header */}
                    <View style={styles.tableRow}>
                        {columns.map((col, index) => (
                            <View
                                key={index}
                                style={{
                                    width: colWidth,
                                    borderRightWidth: index === columns.length - 1 ? 0 : 1,
                                    borderRightColor: '#bfbfbf'
                                }}
                            >
                                <Text style={styles.tableHeaderCell}>{col.header}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Body */}
                    {data.map((row, rowIndex) => (
                        <View
                            key={rowIndex}
                            style={{
                                ...styles.tableRow,
                                borderTopWidth: 1,
                                borderTopColor: '#bfbfbf'
                            }}
                        >
                            {columns.map((col, colIndex) => {
                                const value = typeof col.accessorKey === 'function'
                                    ? col.accessorKey(row)
                                    : row[col.accessorKey as keyof T];

                                return (
                                    <View
                                        key={colIndex}
                                        style={{
                                            width: colWidth,
                                            borderRightWidth: colIndex === columns.length - 1 ? 0 : 1,
                                            borderRightColor: '#bfbfbf'
                                        }}
                                    >
                                        <Text style={styles.tableCell}>{String(value ?? '-')}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    ))}
                </View>
            </Page>
        </Document>
    );
}
