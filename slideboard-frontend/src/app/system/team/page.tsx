'use client';

import { Plus, Settings, Crown, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';

import { toast } from '@/components/ui/toast';
import { logsService } from '@/services/logs.client';
import { teamService } from '@/services/teams.client';
import { Team } from '@/types/teams';

export default function TeamPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  useEffect(() => {
    // Load user teams from database
    const loadTeams = async () => {
      try {
        const userTeams = await teamService.getUserTeams();
        setTeams(userTeams);

        if (userTeams.length > 0) {
          setSelectedTeam(userTeams[0]!);
        }
      } catch (error) {
        await logsService.createLog({
          userId: 'current_user_id',
          userName: '当前用户',
          action: 'load_teams',
          level: 'error',
          resourceType: 'team',
          details: {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          }
        });
        toast.error('加载团队列表失败');
      }
    };

    loadTeams();
  }, []);

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

      await logsService.createLog({
        userId: 'current_user_id',
        userName: '当前用户',
        action: 'create_team',
        level: 'info',
        resourceId: newTeam.id,
        resourceType: 'team',
        details: {
          teamName: newTeamName,
          teamDescription: newTeamDescription
        }
      });
      toast.success('团队创建成功');
    } catch (error) {
      await logsService.createLog({
        userId: 'current_user_id',
        userName: '当前用户',
        action: 'create_team',
        level: 'error',
        resourceType: 'team',
        details: {
          teamName: newTeamName,
          teamDescription: newTeamDescription,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }
      });
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

      await logsService.createLog({
        userId: 'current_user_id',
        userName: '当前用户',
        action: 'remove_team_member',
        level: 'info',
        resourceId: selectedTeam.id,
        resourceType: 'team',
        details: {
          memberId
        }
      });

      toast.success('移除成功');
    } catch (error) {
      await logsService.createLog({
        userId: 'current_user_id',
        userName: '当前用户',
        action: 'remove_team_member',
        level: 'error',
        resourceId: selectedTeam.id,
        resourceType: 'team',
        details: {
          memberId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }
      });
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

      await logsService.createLog({
        userId: 'current_user_id',
        userName: '当前用户',
        action: 'update_team_member_role',
        level: 'info',
        resourceId: selectedTeam.id,
        resourceType: 'team',
        details: {
          memberId,
          newRole
        }
      });

      toast.success('角色更新成功');
    } catch (error) {
      await logsService.createLog({
        userId: 'current_user_id',
        userName: '当前用户',
        action: 'update_team_member_role',
        level: 'error',
        resourceId: selectedTeam.id,
        resourceType: 'team',
        details: {
          memberId,
          newRole,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      toast.error('更新成员角色失败，请重试');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">团队管理</h1>
              <p className="text-sm text-gray-600 mt-1">管理您的团队和成员</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              创建团队
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* 团队列表 */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">我的团队</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedTeam?.id === team.id ? 'bg-primary-50 border-r-2 border-primary-500' : ''
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{team.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{team.member_count} 名成员</p>
                      </div>
                      {team.owner_id === 'current_user_id' && (
                        <span className="inline-flex" aria-label="团队所有者">
                          <Crown className="h-4 w-4 text-yellow-500" />
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 团队详情 */}
          {selectedTeam && (
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm">
                {/* 团队信息头部 */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedTeam.name}</h2>
                      {selectedTeam.description && (
                        <p className="text-sm text-gray-600 mt-1">{selectedTeam.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <Settings className="h-5 w-5" />
                </button>
              </div>
                  </div>
                </div>

                {/* 成员列表 */}
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    团队成员 ({selectedTeam.members?.length || 0})
                  </h3>
                  <div className="space-y-4">
                    {(selectedTeam.members || []).map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            {member.avatar_url ? (
                              <Image src={member.avatar_url} alt={member.name || 'User'} width={40} height={40} className="rounded-full" unoptimized />
                            ) : (
                              <span className="text-sm font-medium text-primary-600">
                                {(member.name || 'U').charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-medium text-gray-900">{member.name || 'Unknown User'}</h4>
                              {member.role === 'admin' && (
                                <span className="px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">
                                  管理员
                                </span>
                              )}
                              {member.is_online && (
                                <div className="w-2 h-2 bg-green-500 rounded-full" title="在线"></div>
                              )}
                            </div>

                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateMemberRole(member.id, e.target.value as 'member' | 'admin')}
                            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            disabled={member.id === 'current_user_id'}
                          >
                            <option value="member">成员</option>
                            <option value="admin">管理员</option>
                          </select>

                          {member.id !== 'current_user_id' && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="移除成员"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 创建团队模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">创建新团队</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
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


    </div>
  );
}
