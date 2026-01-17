'use client';

import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { BasePdfLayout, basePdfStyles } from './base/document-layout';

interface GenericOrderPdfProps {
    title: string;
    orderInfo: {
        label: string;
        value: string;
    }[];
    columns: {
        header: string;
        accessorKey: string;
        width?: string | number;
    }[];
    data: Record<string, unknown>[];
    footerInfo?: {
        label: string;
        value: string;
    }[];
}

/**
 * 通用单据 PDF 模板
 */
export const GenericOrderPdf: React.FC<GenericOrderPdfProps> = ({
    title,
    orderInfo,
    columns,
    data,
    footerInfo
}) => {
    return (
        <BasePdfLayout title={title}>
            {/* 订单详细摘要 */}
            <View style={basePdfStyles.summaryGrid}>
                {orderInfo.map((info, index) => (
                    <View key={index} style={basePdfStyles.summaryItem}>
                        <Text style={basePdfStyles.label}>{info.label}</Text>
                        <Text style={basePdfStyles.value}>{info.value}</Text>
                    </View>
                ))}
            </View>

            {/* 数据表格 */}
            <View style={basePdfStyles.table}>
                {/* 表头 */}
                <View style={basePdfStyles.tableHeader}>
                    {columns.map((col, index) => (
                        <Text
                            key={index}
                            style={[
                                basePdfStyles.tableCell,
                                { flex: col.width ? 0 : 1, width: col.width ?? 'auto', fontWeight: 'bold' }
                            ]}
                        >
                            {col.header}
                        </Text>
                    ))}
                </View>
                {/* 数据行 */}
                {data.map((row, rowIndex) => (
                    <View key={rowIndex} style={basePdfStyles.tableRow}>
                        {columns.map((col, colIndex) => (
                            <Text
                                key={colIndex}
                                style={[
                                    basePdfStyles.tableCell,
                                    { flex: col.width ? 0 : 1, width: col.width ?? 'auto' }
                                ]}
                            >
                                {String(row[col.accessorKey] ?? '-')}
                            </Text>
                        ))}
                    </View>
                ))}
            </View>

            {/* 底部摘要（如总计、备注） */}
            {footerInfo && (
                <View style={[basePdfStyles.summaryGrid, { backgroundColor: 'transparent', borderTopWidth: 1, borderTopColor: '#eee', borderRadius: 0 }]}>
                    {footerInfo.map((info, index) => (
                        <View key={index} style={[basePdfStyles.summaryItem, { width: '50%' }]}>
                            <Text style={basePdfStyles.label}>{info.label}</Text>
                            <Text style={[basePdfStyles.value, { fontSize: 12 }]}>{info.value}</Text>
                        </View>
                    ))}
                </View>
            )}
        </BasePdfLayout>
    );
};
