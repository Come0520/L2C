import { MapPin, Clock } from 'lucide-react';
import React from 'react';

import {
    PaperTable,
    PaperTableHeader,
    PaperTableBody,
    PaperTableRow,
    PaperTableCell
} from '@/components/ui/paper-table';

export interface AccessLog {
    id: string;
    ipAddress: string;
    location?: string; // Derived from IP ideally
    userAgent: string;
    referer: string;
    accessedAt: string;
}

interface ShareAccessLogViewerProps {
    isOpen: boolean;
    onClose: () => void;
    logs: AccessLog[];
    linkToken: string;
}

export const ShareAccessLogViewer: React.FC<ShareAccessLogViewerProps> = ({
    isOpen,
    onClose,
    logs,
    linkToken
}) => {
    // Simple helper to parse generic UA
    const getDevice = (ua: string) => {
        if (ua.includes('Mobile')) return '移动设备';
        if (ua.includes('Mac')) return 'Mac';
        if (ua.includes('Windows')) return 'Windows';
        return 'Desktop';
    };

    return (
        // Assuming Modal accepts standard props. If not, this is a placeholder structure
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${isOpen ? '' : 'hidden'}`}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-paper-100 rounded-t-lg">
                    <h3 className="font-semibold text-lg text-ink-800">
                        访问日志 - <span className="font-mono text-sm">{linkToken}</span>
                    </h3>
                    <button onClick={onClose} className="text-ink-500 hover:text-ink-800">✕</button>
                </div>

                <div className="flex-1 overflow-auto p-4">
                    <PaperTable>
                        <PaperTableHeader>
                            <PaperTableCell>时间</PaperTableCell>
                            <PaperTableCell>来源</PaperTableCell>
                            <PaperTableCell>设备</PaperTableCell>
                            <PaperTableCell>详情</PaperTableCell>
                        </PaperTableHeader>
                        <PaperTableBody>
                            {logs.map(log => (
                                <PaperTableRow key={log.id}>
                                    <PaperTableCell className="text-sm font-mono">
                                        <div className="flex items-center">
                                            <Clock className="h-3 w-3 mr-1 text-ink-400" />
                                            {new Date(log.accessedAt).toLocaleString()}
                                        </div>
                                    </PaperTableCell>
                                    <PaperTableCell>
                                        <div className="flex items-center">
                                            <MapPin className="h-3 w-3 mr-1 text-ink-400" />
                                            {log.ipAddress}
                                        </div>
                                    </PaperTableCell>
                                    <PaperTableCell>
                                        <span className="bg-paper-200 px-2 py-0.5 rounded text-xs text-ink-700">
                                            {getDevice(log.userAgent)}
                                        </span>
                                    </PaperTableCell>
                                    <PaperTableCell>
                                        <div className="text-xs text-ink-400 truncate max-w-[150px]" title={log.userAgent}>
                                            {log.userAgent}
                                        </div>
                                    </PaperTableCell>
                                </PaperTableRow>
                            ))}
                            {logs.length === 0 && (
                                <PaperTableRow>
                                    <PaperTableCell colSpan={4} className="text-center text-ink-400 py-8">
                                        暂无访问记录
                                    </PaperTableCell>
                                </PaperTableRow>
                            )}
                        </PaperTableBody>
                    </PaperTable>
                </div>
            </div>
        </div>
    );
};
