'use client';

import { useState } from 'react';
import { Quote, QuoteVersion } from '@/shared/types/quote';
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card';
import { PaperTable, PaperTableBody, PaperTableCell, PaperTableHeader, PaperTableRow } from '@/components/ui/paper-table';
import { QuoteVersionSelector } from './quote-version-selector';

interface QuoteDetailViewProps {
    quote: Quote;
}

export function QuoteDetailView({ quote }: QuoteDetailViewProps) {
    const [selectedVersionId, setSelectedVersionId] = useState<string>(
        quote.currentVersionId || quote.versions?.[0]?.id || ''
    );

    const selectedVersion = quote.versions?.find(v => v.id === selectedVersionId);

    const getStatusLabel = (status: string) => {
        const statusMap: Record<string, string> = {
            draft: '草稿',
            presented: '已发布',
            rejected: '已拒绝',
            accepted: '已接受',
            confirmed: '已确认',
            expired: '已过期',
            cancelled: '已取消',
            active: '进行中',
            won: '赢单',
            lost: '输单'
        };
        return statusMap[status] || status;
    };

    const getStatusBadgeClass = (status: string) => {
        const statusMap: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-800',
            presented: 'bg-blue-100 text-blue-800',
            rejected: 'bg-red-100 text-red-800',
            accepted: 'bg-green-100 text-green-800',
            confirmed: 'bg-green-100 text-green-800',
            active: 'bg-blue-100 text-blue-800',
            won: 'bg-green-100 text-green-800',
            lost: 'bg-red-100 text-red-800'
        };
        return statusMap[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-6">
            {/* Quote Header */}
            <PaperCard>
                <PaperCardHeader>
                    <PaperCardTitle>报价单基本信息</PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-500">报价单号</label>
                            <p className="font-medium">{quote.quoteNo}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">项目名称</label>
                            <p className="font-medium">{quote.projectName || '-'}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">项目地址</label>
                            <p className="font-medium">{quote.projectAddress || '-'}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">状态</label>
                            <p>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(quote.status)}`}>
                                    {getStatusLabel(quote.status)}
                                </span>
                            </p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">创建时间</label>
                            <p className="font-medium">{new Date(quote.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                </PaperCardContent>
            </PaperCard>

            {/* Version Selector */}
            {quote.versions && quote.versions.length > 0 && (
                <PaperCard>
                    <PaperCardContent>
                        <QuoteVersionSelector
                            versions={quote.versions}
                            selectedVersionId={selectedVersionId}
                            onSelect={setSelectedVersionId}
                        />
                    </PaperCardContent>
                </PaperCard>
            )}

            {/* Version Details */}
            {selectedVersion && (
                <PaperCard>
                    <PaperCardHeader>
                        <PaperCardTitle>
                            版本详情 - {selectedVersion.versionSuffix || `V${selectedVersion.versionNumber}`}
                        </PaperCardTitle>
                    </PaperCardHeader>
                    <PaperCardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm text-gray-500">版本状态</label>
                                <p>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedVersion.status)}`}>
                                        {getStatusLabel(selectedVersion.status)}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">总金额</label>
                                <p className="font-medium text-lg">¥{selectedVersion.totalAmount.toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">有效期至</label>
                                <p className="font-medium">
                                    {selectedVersion.validUntil
                                        ? new Date(selectedVersion.validUntil).toLocaleDateString()
                                        : '-'}
                                </p>
                            </div>
                        </div>

                        {selectedVersion.remarks && (
                            <div>
                                <label className="text-sm text-gray-500">备注</label>
                                <p className="text-sm mt-1">{selectedVersion.remarks}</p>
                            </div>
                        )}

                        {/* Items Table */}
                        {selectedVersion.items && selectedVersion.items.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-3">报价明细</h4>
                                <PaperTable>
                                    <PaperTableHeader>
                                        <PaperTableRow>
                                            <PaperTableCell>空间</PaperTableCell>
                                            <PaperTableCell>产品名称</PaperTableCell>
                                            <PaperTableCell>类别</PaperTableCell>
                                            <PaperTableCell>数量</PaperTableCell>
                                            <PaperTableCell>单价</PaperTableCell>
                                            <PaperTableCell>总价</PaperTableCell>
                                        </PaperTableRow>
                                    </PaperTableHeader>
                                    <PaperTableBody>
                                        {selectedVersion.items.map((item) => (
                                            <PaperTableRow key={item.id}>
                                                <PaperTableCell>{item.space}</PaperTableCell>
                                                <PaperTableCell>{item.productName}</PaperTableCell>
                                                <PaperTableCell>{item.category}</PaperTableCell>
                                                <PaperTableCell>{item.quantity}</PaperTableCell>
                                                <PaperTableCell>¥{item.unitPrice.toLocaleString()}</PaperTableCell>
                                                <PaperTableCell>¥{item.totalPrice.toLocaleString()}</PaperTableCell>
                                            </PaperTableRow>
                                        ))}
                                    </PaperTableBody>
                                </PaperTable>
                            </div>
                        )}
                    </PaperCardContent>
                </PaperCard>
            )}
        </div>
    );
}
