import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// 注册中文字体（使用本地字体以保证离线和内网环境的可用性）
Font.register({
  family: 'NotoSansSC',
  // 将在 public/fonts 留下本地字体文件
  src: '/fonts/NotoSansSC-Regular.ttf',
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'NotoSansSC',
    fontSize: 10,
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'normal',
  },
  period: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    backgroundColor: '#f3f4f6',
    padding: 6,
  },
  tableCol: {
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    padding: 6,
  },
  tableCellHeader: {
    margin: 'auto',
    fontSize: 10,
    fontWeight: 'normal',
  },
  tableCell: {
    margin: 'auto',
    fontSize: 10,
  },
});

export interface PdfColumn {
  header: string;
  dataKey: string;
  width?: number | string;
}

interface ReportPdfTemplateProps {
  title: string;
  period: string;
  columns: PdfColumn[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
}

export const ReportPdfTemplate: React.FC<ReportPdfTemplateProps> = ({
  title,
  period,
  columns,
  data,
}) => {
  const colWidth = `${100 / columns.length}%`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.period}>{period}</Text>
        </View>
        <View style={styles.table}>
          {/* 表头 */}
          <View style={styles.tableRow}>
            {columns.map((col, i) => (
              <View
                key={`header-${i}`}
                style={[styles.tableColHeader, { width: col.width || colWidth }]}
              >
                <Text style={styles.tableCellHeader}>{col.header}</Text>
              </View>
            ))}
          </View>
          {/* 数据行 */}
          {data.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.tableRow}>
              {columns.map((col, colIndex) => {
                const value = row[col.dataKey];
                return (
                  <View
                    key={`cell-${rowIndex}-${colIndex}`}
                    style={[styles.tableCol, { width: col.width || colWidth }]}
                  >
                    <Text style={styles.tableCell}>
                      {value !== undefined && value !== null ? String(value) : '-'}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};
