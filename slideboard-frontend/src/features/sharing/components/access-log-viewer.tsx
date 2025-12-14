import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, X } from 'lucide-react';
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
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden"
                    >
                        <div className="p-4 border-b flex justify-between items-center bg-paper-50">
                            <h3 className="font-semibold text-lg text-ink-800 flex items-center">
                                访问日志 <span className="mx-2 text-ink-300">|</span> 
                                <span className="font-mono text-sm bg-paper-100 px-2 py-0.5 rounded text-ink-600">
                                    {linkToken}
                                </span>
                            </h3>
                            <button 
                                onClick={onClose} 
                                className="text-ink-400 hover:text-ink-800 p-1 rounded-full hover:bg-paper-200 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-0">
                            <PaperTable>
                                <PaperTableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                                    <PaperTableCell>时间</PaperTableCell>
                                    <PaperTableCell>来源</PaperTableCell>
                                    <PaperTableCell>设备</PaperTableCell>
                                    <PaperTableCell>详情</PaperTableCell>
                                </PaperTableHeader>
                                <PaperTableBody>
                                    {logs.map((log, index) => (
                                        <motion.tr 
                                            key={log.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="border-b border-paper-100 last:border-0 hover:bg-paper-50/50"
                                        >
                                            <PaperTableCell className="text-sm font-mono whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Clock className="h-3 w-3 mr-2 text-ink-400" />
                                                    {new Date(log.accessedAt).toLocaleString()}
                                                </div>
                                            </PaperTableCell>
                                            <PaperTableCell>
                                                <div className="flex items-center font-mono text-sm">
                                                    <MapPin className="h-3 w-3 mr-2 text-ink-400" />
                                                    {log.ipAddress}
                                                </div>
                                            </PaperTableCell>
                                            <PaperTableCell>
                                                <span className="bg-paper-100 px-2 py-1 rounded text-xs text-ink-700 font-medium">
                                                    {getDevice(log.userAgent)}
                                                </span>
                                            </PaperTableCell>
                                            <PaperTableCell>
                                                <div className="text-xs text-ink-500 truncate max-w-[200px]" title={log.userAgent}>
                                                    {log.userAgent}
                                                </div>
                                            </PaperTableCell>
                                        </motion.tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <PaperTableRow>
                                            <PaperTableCell colSpan={4} className="text-center text-ink-400 py-12">
                                                暂无访问记录
                                            </PaperTableCell>
                                        </PaperTableRow>
                                    )}
                                </PaperTableBody>
                            </PaperTable>
                        </div>
                        
                        <div className="p-4 border-t bg-paper-50 text-xs text-ink-400 flex justify-between items-center">
                            <span>共 {logs.length} 条记录</span>
                            <button onClick={onClose} className="text-theme-600 hover:text-theme-700 font-medium">
                                关闭
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
