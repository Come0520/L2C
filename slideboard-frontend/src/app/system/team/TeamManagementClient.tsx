'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { toast } from '@/components/ui/toast';
import { teamService } from '@/services/teams.client';
import { Team } from '@/types/teams';

interface TeamManagementClientProps {
  initialTeams: Team[];
  initialSelectedTeam: Team | null;
}

const TeamManagementClient = ({ initialTeams, initialSelectedTeam }: TeamManagementClientProps) => {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(initialSelectedTeam);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowCreateModal(false);
      }
    };

    if (showCreateModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCreateModal]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error('请输入团队名称');
      return;
    }

    try {
      const newTeam = await teamService.createTeam(newTeamName, newTeamDescription);

      setTeams([...teams, newTeam]);
      setSelectedTeam(newTeam);
      setShowCreateModal(false);
      setNewTeamName('');
      setNewTeamDescription('');

      toast.success('团队创建成功');
    } catch (error) {
      toast.error('创建团队失败，请重试');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('确定要移除该成员吗？')) {
      return;
    }

    if (!selectedTeam) return;

    try {
      await teamService.removeMember(selectedTeam.id, memberId);

      const updatedTeam = {
        ...selectedTeam,
        member_count: (selectedTeam.member_count || 0) - 1,
        members: (selectedTeam.members || []).filter(member => member.id !== memberId),
      };

      setTeams(teams.map(team =>
        team.id === selectedTeam.id ? updatedTeam : team
      ));
      setSelectedTeam(updatedTeam);

      toast.success('移除成功');
    } catch (error) {
      toast.error('移除成员失败，请重试');
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: 'member' | 'admin') => {
    if (!selectedTeam) return;

    try {
      await teamService.updateMemberRole(selectedTeam.id, memberId, newRole);

      const updatedTeam = {
        ...selectedTeam,
        members: (selectedTeam.members || []).map(member =>
          member.id === memberId ? { ...member, role: newRole } : member
        ),
      };

      setTeams(teams.map(team =>
        team.id === selectedTeam.id ? updatedTeam : team
      ));
      setSelectedTeam(updatedTeam);

      toast.success('角色更新成功');
    } catch (error) {
      toast.error('更新成员角色失败，请重试');
    }
  };

  return (
    <>
      {/* 创建团队按钮 */}
      <div className="fixed bottom-8 right-8 z-40">
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-primary-600 hover:bg-primary-700 shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          创建团队
        </button>
      </div>

      {/* 创建团队模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={modalRef} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">创建新团队</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  团队名称 *
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="输入团队名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  团队描述
                </label>
                <textarea
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  placeholder="输入团队描述（可选）"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCreateTeam}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                创建团队
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 成员管理交互 */}
      <div className="fixed inset-0 pointer-events-none z-30">
        {/* 这部分内容是透明的，仅用于处理客户端交互事件 */}
        {/* 实际的成员管理操作通过API调用实现，状态更新通过useState管理 */}
      </div>
    </>
  );
};

export default TeamManagementClient;
