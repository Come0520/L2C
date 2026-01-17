'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import React from 'react';

// 定义基础样式
export const basePdfStyles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Noto Sans SC',
        fontSize: 10,
        color: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 2,
        borderBottomColor: '#1a1a1a',
        paddingBottom: 10,
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    companyInfo: {
        textAlign: 'right',
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
        backgroundColor: '#f9f9f9',
        padding: 10,
        borderRadius: 4,
    },
    summaryItem: {
        width: '33%',
        marginBottom: 8,
    },
    label: {
        color: '#666',
        marginBottom: 2,
    },
    value: {
        fontWeight: 'bold',
    },
    table: {
        width: '100%',
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingVertical: 5,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 5,
    },
    tableCell: {
        flex: 1,
        paddingHorizontal: 5,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        color: '#999',
        fontSize: 8,
    },
    pageNumber: {
        textAlign: 'right',
    }
});

/**
 * 基础 PDF 页面布局
 */
interface BasePdfLayoutProps {
    title: string;
    children: React.ReactNode;
}

export const BasePdfLayout: React.FC<BasePdfLayoutProps> = ({ title, children }) => (
    <Document>
        <Page size="A4" style={basePdfStyles.page}>
            {/* Header */}
            <View style={basePdfStyles.header}>
                <View>
                    <Text style={basePdfStyles.title}>{title}</Text>
                </View>
                <View style={basePdfStyles.companyInfo}>
                    <Text style={{ fontWeight: 'bold' }}>L2C 数字化管理系统</Text>
                    <Text>专业定制化服务商</Text>
                </View>
            </View>

            {/* Content */}
            {children}

            {/* Footer */}
            <View style={basePdfStyles.footer} fixed>
                <Text>生成的单据仅供内部参考使用</Text>
                <Text
                    style={basePdfStyles.pageNumber}
                    render={({ pageNumber, totalPages }) => `第 ${pageNumber} 页 / 共 ${totalPages} 页`}
                />
            </View>
        </Page>
    </Document>
);
