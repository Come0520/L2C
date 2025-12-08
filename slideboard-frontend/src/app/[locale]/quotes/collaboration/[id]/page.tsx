'use client';

import { Users, MessageSquare, Eye, Edit3, UserPlus, Settings, Send } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import { toast } from '@/components/ui/toast';
import { logsService } from '@/services/logs.client';
import { quoteCollaborationService } from '@/services/quote-collaboration.client';

interface Collaborator {
  id: string;
  name: string;
  avatar_url?: string;
  permission: 'view' | 'edit' | 'admin';
  is_online: boolean;
  joined_at: string;
}

interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  position?: { x: number; y: number };
  created_at: string;
}

export default function CollaboratePage() {
  const params = useParams();
  const slideId = params.id as string;

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');
  const [invitePermission, setInvitePermission] = useState<'view' | 'edit'>('view');

  useEffect(() => {
    // Load collaborators from database
    const loadData = async () => {
      try {
        const [collaboratorsData, commentsData] = await Promise.all([
          quoteCollaborationService.getCollaborators(slideId),
          quoteCollaborationService.getComments(slideId)
        ]);

        setCollaborators(collaboratorsData.map((c) => ({
          id: c.id,
          name: c.name || 'Unknown',
          avatar_url: c.avatar_url,
          permission: c.permission,
          is_online: c.is_online ?? false,
          joined_at: c.invited_at,
        })));
        setComments(commentsData.map((cm) => ({
          id: cm.id,
          user_id: cm.user_id,
          user_name: cm.user_name || 'Unknown',
          user_avatar: cm.user_avatar,
          content: cm.content,
          position: cm.position,
          created_at: cm.created_at,
        })));

        await logsService.createLog({
          userId: 'current_user_id',
          userName: '当前用户',
          action: 'load_collaboration_data',
          level: 'info',
          resourceId: slideId,
          resourceType: 'quote_collaboration',
          details: {
            collaboratorsCount: collaboratorsData.length,
            commentsCount: commentsData.length
          }
        });
      } catch (error) {
        await logsService.createLog({
          userId: 'current_user_id',
          userName: '当前用户',
          action: 'load_collaboration_data',
          level: 'error',
          resourceId: slideId,
          resourceType: 'quote_collaboration',
          details: {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          }
        });
      }
    };

    loadData();
  }, [slideId]);

  const handleInviteCollaborator = async () => {
    if (!invitePhone) {
      toast.error('请输入手机号');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(invitePhone)) {
      toast.error('请输入正确的手机号');
      return;
    }

    try {
      const newCollaborator = await quoteCollaborationService.inviteCollaborator(
        slideId,
        invitePhone,
        invitePermission
      );

      setCollaborators([
        ...collaborators,
        {
          id: newCollaborator.id,
          name: newCollaborator.name || 'Unknown',
          avatar_url: newCollaborator.avatar_url,
          permission: newCollaborator.permission,
          is_online: newCollaborator.is_online ?? false,
          joined_at: newCollaborator.invited_at,
        }
      ]);
      setShowInviteModal(false);
      setInvitePhone('');
      setInvitePermission('view');

      await logsService.createLog({
        userId: 'current_user_id',
        userName: '当前用户',
        action: 'invite_collaborator',
        level: 'info',
        resourceId: slideId,
        resourceType: 'quote_collaboration',
        details: {
          invitePhone,
          invitePermission,
          newCollaboratorId: newCollaborator.id
        }
      });

      toast.success('邀请发送成功');
    } catch (error: unknown) {
      await logsService.createLog({
        userId: 'current_user_id',
        userName: '当前用户',
        action: 'invite_collaborator',
        level: 'error',
        resourceId: slideId,
        resourceType: 'quote_collaboration',
        details: {
          invitePhone,
          invitePermission,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      const message = error instanceof Error ? error.message : '邀请发送失败，请重试'
      toast.error(message);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) {
      return;
    }

    try {
      const newCommentData = await quoteCollaborationService.addComment(
        slideId,
        newComment
      );

      setComments([
        ...comments,
        {
          id: newCommentData.id,
          user_id: newCommentData.user_id,
          user_name: newCommentData.user_name || 'Unknown',
          user_avatar: newCommentData.user_avatar,
          content: newCommentData.content,
          position: newCommentData.position,
          created_at: newCommentData.created_at,
        }
      ]);
      setNewComment('');

      await logsService.createLog({
        userId: 'current_user_id',
        userName: '当前用户',
        action: 'send_comment',
        level: 'info',
        resourceId: slideId,
        resourceType: 'quote_collaboration',
        details: {
          commentId: newCommentData.id,
          commentContent: newComment
        }
      });
    } catch (error) {
      await logsService.createLog({
        userId: 'current_user_id',
        userName: '当前用户',
        action: 'send_comment',
        level: 'error',
        resourceId: slideId,
        resourceType: 'quote_collaboration',
        details: {
          commentContent: newComment,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      toast.error('发送评论失败，请重试');
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!confirm('确定要移除该协作者吗？')) {
      return;
    }

    try {
      await quoteCollaborationService.removeCollaborator(slideId, collaboratorId);
      setCollaborators(collaborators.filter(c => c.id !== collaboratorId));

      await logsService.createLog({
        userId: 'current_user_id',
        userName: '当前用户',
        action: 'remove_collaborator',
        level: 'info',
        resourceId: slideId,
        resourceType: 'quote_collaboration',
        details: {
          collaboratorId
        }
      });

      toast.success('移除成功');
    } catch (error) {
      await logsService.createLog({
        userId: 'current_user_id',
        userName: '当前用户',
        action: 'remove_collaborator',
        level: 'error',
        resourceId: slideId,
        resourceType: 'quote_collaboration',
        details: {
          collaboratorId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      toast.error('移除协作者失败，请重试');
    }
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'admin':
        return <Settings className="h-4 w-4" />;
      case 'edit':
        return <Edit3 className="h-4 w-4" />;
      case 'view':
        return <Eye className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const getPermissionText = (permission: string) => {
    switch (permission) {
      case 'admin':
        return '管理员';
      case 'edit':
        return '可编辑';
      case 'view':
        return '仅查看';
      default:
        return '仅查看';
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* 主编辑区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部工具栏 */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">协作编辑</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{collaborators.length} 人协作中</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* 在线状态指示器 */}
              <div className="flex items-center space-x-2">
                {collaborators.filter(c => c.is_online).slice(0, 3).map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center relative"
                    title={collaborator.name}
                  >
                    <span className="text-xs font-medium text-primary-600">
                      {collaborator.name.charAt(0)}
                    </span>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                ))}
                {collaborators.filter(c => c.is_online).length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{collaborators.filter(c => c.is_online).length - 3}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                邀请协作者
              </button>
            </div>
          </div>
        </div>

        {/* 编辑画布区域 */}
        <div className="flex-1 bg-gray-100 flex items-center justify-center p-8">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl aspect-video flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">实时协作编辑区域</h3>
              <p className="text-sm">多人可以同时编辑此幻灯片</p>
            </div>
          </div>
        </div>

        {/* 底部状态栏 */}
        <div className="bg-white border-t border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>幻灯片 ID: {slideId}</div>
            <div>自动保存中...</div>
          </div>
        </div>
      </div>

      {/* 右侧协作面板 */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* 标签页 */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button className="flex-1 px-4 py-3 text-sm font-medium text-primary-600 border-b-2 border-primary-500">
              <Users className="h-4 w-4 inline mr-2" />
              协作者 ({collaborators.length})
            </button>
            <button className="flex-1 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">
              <MessageSquare className="h-4 w-4 inline mr-2" />
              评论 ({comments.length})
            </button>
          </div>
        </div>

        {/* 协作者列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {collaborators.map((collaborator) => (
              <div key={collaborator.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center relative">
                    <span className="text-sm font-medium text-primary-600">
                      {collaborator.name.charAt(0)}
                    </span>
                    {collaborator.is_online && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{collaborator.name}</div>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      {getPermissionIcon(collaborator.permission)}
                      <span>{getPermissionText(collaborator.permission)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveCollaborator(collaborator.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="移除协作者"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 评论输入框 */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="添加评论..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
            />
            <button
              onClick={handleSendComment}
              disabled={!newComment.trim()}
              className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 邀请协作者模态框 */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">邀请协作者</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  手机号
                </label>
                <input
                  type="tel"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="请输入手机号"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                  maxLength={11}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  权限级别
                </label>
                <select
                  value={invitePermission}
                  onChange={(e) => setInvitePermission(e.target.value as 'view' | 'edit')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="view">仅查看</option>
                  <option value="edit">可编辑</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleInviteCollaborator}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                发送邀请
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
