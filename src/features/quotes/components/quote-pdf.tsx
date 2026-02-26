'use client';

import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
} from '@react-pdf/renderer';
import { format } from 'date-fns';

// Register a font that supports Chinese
// Using a CDN for Noto Sans SC (Simplified Chinese)
// In production, you might want to host this font locally in public/fonts
Font.register({
    family: 'Noto Sans SC',
    src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5.0.12/files/noto-sans-sc-latin-400-normal.woff',
    // Fallback or multiple weights can be added
});

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Noto Sans SC',
        fontSize: 10,
        color: '#333',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    subTitle: {
        fontSize: 12,
        color: '#666',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    infoLabel: {
        width: 60,
        color: '#666',
    },
    infoValue: {
        flex: 1,
    },
    table: {
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderColor: '#e5e7eb',
        marginTop: 10,
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row',
    },
    tableCol: {
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#e5e7eb',
        padding: 5,
    },
    tableHeader: {
        backgroundColor: '#f9fafb',
        fontWeight: 'bold',
    },
    roomHeader: {
        backgroundColor: '#f3f4f6',
        padding: 5,
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#e5e7eb',
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 20,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 5,
    },
    totalLabel: {
        width: 100,
        textAlign: 'right',
        marginRight: 10,
        color: '#666',
    },
    totalValue: {
        width: 80,
        textAlign: 'right',
        fontWeight: 'bold',
    },
    signature: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signBox: {
        borderTopWidth: 1,
        borderTopColor: '#333',
        width: 200,
        paddingTop: 5,
        textAlign: 'center',
    },
});

import { QuotePdfData } from '../types';
import { QuoteItem } from '@/shared/api/schema/quotes';

// ... (retain imports)

interface QuotePdfProps {
    quote: QuotePdfData;
    mode: 'customer' | 'internal'; // Customer: No Cost/Margin; Internal: With Cost/Margin
}

export const QuotePdfDocument = ({ quote, mode }: QuotePdfProps) => {
    // Group items by room
    const itemsByRoom: Record<string, QuoteItem[]> = {};
    const unassignedItems: QuoteItem[] = [];

    // Helper to build tree if needed, but for PDF we might just flatten or group simply
    // Let's assume passed items are flat but have roomId
    (quote.items || []).forEach((item) => {
        if (item.roomId) {
            if (!itemsByRoom[item.roomId]) itemsByRoom[item.roomId] = [];
            itemsByRoom[item.roomId].push(item);
        } else {
            unassignedItems.push(item);
        }
    });

    const roomList = quote.rooms || [];

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>报价单</Text>
                        <Text style={styles.subTitle}>单号: {quote.quoteNo}</Text>
                        <Text style={styles.subTitle}>日期: {format(new Date(quote.createdAt), 'yyyy-MM-dd')}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.subTitle}>L2C System</Text>
                        {/* <Image src="/l2c-logo.png" style={{ width: 50, height: 50 }} /> */}
                    </View>
                </View>

                {/* Customer Info */}
                <View style={{ marginBottom: 20 }}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>客户姓名:</Text>
                        <Text style={styles.infoValue}>{quote.customer?.name || '-'}</Text>
                        <Text style={styles.infoLabel}>联系电话:</Text>
                        <Text style={styles.infoValue}>{quote.customer?.phone || '-'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>楼盘地址:</Text>
                        <Text style={styles.infoValue}>{quote.customer?.address || quote.deliveryAddress || '-'}</Text>
                    </View>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    {/* Header Row */}
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={[styles.tableCol, { width: '30%' }]}><Text>商品名称</Text></View>
                        <View style={[styles.tableCol, { width: '15%' }]}><Text>规格</Text></View>
                        <View style={[styles.tableCol, { width: '10%' }]}><Text>数量</Text></View>
                        <View style={[styles.tableCol, { width: '10%' }]}><Text>单价</Text></View>
                        <View style={[styles.tableCol, { width: '15%' }]}><Text>金额</Text></View>
                        {mode === 'internal' && (
                            <View style={[styles.tableCol, { width: '20%' }]}><Text>成本/毛利</Text></View>
                        )}
                        {mode === 'customer' && (
                            <View style={[styles.tableCol, { width: '20%' }]}><Text>备注</Text></View>
                        )}
                    </View>

                    {/* Room Groups */}
                    {roomList.map((room: QuotePdfData['rooms'][0]) => {
                        const items = itemsByRoom[room.id] || [];
                        if (items.length === 0) return null;

                        return (
                            <React.Fragment key={room.id}>
                                <View style={styles.roomHeader}>
                                    <Text>{room.name}</Text>
                                </View>
                                {items.map((item: QuoteItem) => (
                                    <View style={styles.tableRow} key={item.id}>
                                        <View style={[styles.tableCol, { width: '30%' }]}>
                                            <Text>{item.productName}</Text>
                                            {item.category === 'ACCESSORY' && <Text style={{ fontSize: 8, color: '#666' }}>(附件)</Text>}
                                        </View>
                                        <View style={[styles.tableCol, { width: '15%' }]}>
                                            <Text>{(item.width && Number(item.width) > 0) ? `${item.width}x${item.height}` : '-'}</Text>
                                        </View>
                                        <View style={[styles.tableCol, { width: '10%' }]}>
                                            <Text>{item.quantity}</Text>
                                        </View>
                                        <View style={[styles.tableCol, { width: '10%' }]}>
                                            <Text>{item.unitPrice}</Text>
                                        </View>
                                        <View style={[styles.tableCol, { width: '15%' }]}>
                                            <Text>{item.subtotal}</Text>
                                        </View>
                                        {mode === 'internal' && (
                                            <View style={[styles.tableCol, { width: '20%' }]}>
                                                <Text>C:{item.costPrice || '-'}</Text>
                                            </View>
                                        )}
                                        {mode === 'customer' && (
                                            <View style={[styles.tableCol, { width: '20%' }]}>
                                                <Text>{item.remark || ''}</Text>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </React.Fragment>
                        );
                    })}

                    {/* Unassigned */}
                    {unassignedItems.length > 0 && (
                        <>
                            <View style={styles.roomHeader}>
                                <Text>未分配</Text>
                            </View>
                            {unassignedItems.map((item: QuoteItem) => (
                                <View style={styles.tableRow} key={item.id}>
                                    <View style={[styles.tableCol, { width: '30%' }]}><Text>{item.productName}</Text></View>
                                    {/* ... simplified cols ... */}
                                    {/* Keeping structure same for simplicity */}
                                    <View style={[styles.tableCol, { width: '15%' }]}><Text>{(item.width && Number(item.width) > 0) ? `${item.width}x${item.height}` : '-'}</Text></View>
                                    <View style={[styles.tableCol, { width: '10%' }]}><Text>{item.quantity}</Text></View>
                                    <View style={[styles.tableCol, { width: '10%' }]}><Text>{item.unitPrice}</Text></View>
                                    <View style={[styles.tableCol, { width: '15%' }]}><Text>{item.subtotal}</Text></View>
                                    {mode === 'internal' && (
                                        <View style={[styles.tableCol, { width: '20%' }]}><Text>-</Text></View>
                                    )}
                                    {mode === 'customer' && (
                                        <View style={[styles.tableCol, { width: '20%' }]}><Text>{item.remark || ''}</Text></View>
                                    )}
                                </View>
                            ))}
                        </>
                    )}
                </View>

                {/* Footer Totals */}
                <View style={styles.footer}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>合计金额:</Text>
                        <Text style={styles.totalValue}>{quote.totalAmount}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>折扣:</Text>
                        <Text style={styles.totalValue}>{Number(quote.discountAmount) > 0 ? `-${quote.discountAmount}` : '-'}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>最终金额:</Text>
                        <Text style={[styles.totalValue, { fontSize: 12, color: 'red' }]}>{quote.finalAmount}</Text>
                    </View>
                </View>

                {/* Signature */}
                <View style={styles.signature}>
                    <View>
                        <View style={styles.signBox}><Text>客户签字</Text></View>
                    </View>
                    <View>
                        <View style={styles.signBox}><Text>公司盖章/销售签字</Text></View>
                        <Text style={{ textAlign: 'center', marginTop: 5, fontSize: 8 }}>{format(new Date(), 'yyyy-MM-dd')}</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
