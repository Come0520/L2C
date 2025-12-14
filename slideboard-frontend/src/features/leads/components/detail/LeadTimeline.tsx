import { useEffect, useState } from 'react'

import { LEAD_STATUS_CONFIG } from '@/constants/lead-status'
import { leadService } from '@/services/leads.client'

interface LeadTimelineProps {
    leadId: string
}

// Define file type for attachments
interface TimelineFile {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    createdAt: string;
}

// Define required attachment type
interface RequiredAttachment {
    id: string;
    name: string;
    description: string;
    isCompleted: boolean;
}

interface TimelineEvent {
    id: string
    type: 'follow_up' | 'status_change' | 'appointment' | 'note' | 'measurement' | 'installation' | 'financial'
    title: string
    description?: string
    timestamp: string
    user: string
    oldStatus?: string
    newStatus?: string
    requiredAttachments?: RequiredAttachment[]
    attachedFiles?: TimelineFile[]
}

export function LeadTimeline({ leadId }: LeadTimelineProps) {
    const [events, setEvents] = useState<TimelineEvent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTimelineEvents = async () => {
            try {
                setLoading(true)
                // 获取状态历史
                const statusHistory = await leadService.getLeadStatusHistory(leadId)
                // 获取跟进记录
                const followUps = await leadService.getLeadFollowUps(leadId)
                
                // 合并并排序事件
                const allEvents: TimelineEvent[] = []
                
                // Define status history item type
                interface StatusHistoryItem {
                    id: string;
                    old_status: string;
                    new_status: string;
                    comment?: string;
                    changed_at: string;
                    changed_by_name?: string;
                    required_attachments?: RequiredAttachment[];
                    attached_files?: TimelineFile[];
                }

                // Define follow up item type
                interface FollowUpItem {
                    id: string;
                    content: string;
                    created_at: string;
                    creator?: { name: string };
                }

                // 添加状态变更事件
                if (statusHistory && Array.isArray(statusHistory)) {
                    statusHistory.forEach((historyItem: StatusHistoryItem) => {
                        // 获取中文状态名称
                        const oldStatusLabel = LEAD_STATUS_CONFIG[historyItem.old_status]?.label || historyItem.old_status
                        const newStatusLabel = LEAD_STATUS_CONFIG[historyItem.new_status]?.label || historyItem.new_status
                        
                        allEvents.push({
                            id: historyItem.id,
                            type: 'status_change',
                            title: '状态变更',
                            description: historyItem.comment || `从"${oldStatusLabel}"变更为"${newStatusLabel}"`,
                            timestamp: historyItem.changed_at,
                            user: historyItem.changed_by_name || '系统',
                            oldStatus: oldStatusLabel,
                            newStatus: newStatusLabel,
                            requiredAttachments: historyItem.required_attachments,
                            attachedFiles: historyItem.attached_files
                        })
                    })
                }
                
                // 添加跟进记录事件
                if (followUps && Array.isArray(followUps)) {
                    followUps.forEach((followUp: FollowUpItem) => {
                        allEvents.push({
                            id: followUp.id,
                            type: 'follow_up',
                            title: '客户跟进',
                            description: followUp.content,
                            timestamp: followUp.created_at,
                            user: followUp.creator?.name || '未知用户'
                        })
                    })
                }
                
                // 按时间倒序排序
                allEvents.sort((a, b) => {
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                })
                
                setEvents(allEvents)
            } catch (_) {
            } finally {
                setLoading(false)
            }
        }

        fetchTimelineEvents()
    }, [leadId])

    const getEventIcon = (type: TimelineEvent['type']) => {
        switch (type) {
            case 'follow_up':
                return '📞'
            case 'status_change':
                return '🔄'
            case 'appointment':
                return '📅'
            case 'note':
                return '📝'
            case 'measurement':
                return '📏'
            case 'installation':
                return '🔧'
            case 'financial':
                return '💰'
            default:
                return '•'
        }
    }

    const getEventColor = (type: TimelineEvent['type']) => {
        switch (type) {
            case 'follow_up':
                return 'bg-blue-100 text-blue-600 border-blue-300'
            case 'status_change':
                return 'bg-green-100 text-green-600 border-green-300'
            case 'appointment':
                return 'bg-purple-100 text-purple-600 border-purple-300'
            case 'note':
                return 'bg-gray-100 text-gray-600 border-gray-300'
            case 'measurement':
                return 'bg-orange-100 text-orange-600 border-orange-300'
            case 'installation':
                return 'bg-cyan-100 text-cyan-600 border-cyan-300'
            case 'financial':
                return 'bg-yellow-100 text-yellow-600 border-yellow-300'
            default:
                return 'bg-gray-100 text-gray-600 border-gray-300'
        }
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-ink-800 mb-4">状态流转历史</h3>

            {loading ? (
                <div className="text-center py-12 text-ink-400">
                    <p>加载中...</p>
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-12 text-ink-400">
                    <p>暂无状态流转记录</p>
                </div>
            ) : (
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-paper-300" />

                    {/* Events */}
                    <div className="space-y-6">
                        {events.map((event) => (
                            <div key={event.id} className="relative flex gap-4">
                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center z-10 ${getEventColor(event.type)}`}>
                                    <span className="text-xl">{getEventIcon(event.type)}</span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 bg-paper-100 rounded-lg p-4 border border-paper-300">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium text-ink-800">{event.title}</h4>
                                        <span className="text-xs text-ink-400">
                                            {new Date(event.timestamp).toLocaleString('zh-CN')}
                                        </span>
                                    </div>
                                    {event.description && (
                                        <p className="text-sm text-ink-600 mb-2">{event.description}</p>
                                    )}
                                    {event.oldStatus && event.newStatus && (
                                        <div className="flex gap-2 mb-2">
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                原状态: {event.oldStatus}
                                            </span>
                                            <span className="text-xs bg-green-100 px-2 py-1 rounded">
                                                新状态: {event.newStatus}
                                            </span>
                                        </div>
                                    )}
                                    {event.attachedFiles && event.attachedFiles.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs text-ink-500 mb-1">附件:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {event.attachedFiles.map((file: TimelineFile, index: number) => (
                                                    <span key={index} className="text-xs bg-blue-100 px-2 py-1 rounded">
                                                        {file.file_name || `文件${index + 1}`}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-xs text-ink-400 mt-2">操作人：{event.user}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
