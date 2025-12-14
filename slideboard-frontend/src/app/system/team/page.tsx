import { Plus, Settings, Crown } from 'lucide-react';
import Image from 'next/image';

import { getUserTeams } from '@/services/teams.server';

import TeamManagementClient from './TeamManagementClient';

export default async function TeamPage() {
  const teams = await getUserTeams();
  const initialTeam = teams.length > 0 ? teams[0] : null;

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
                {teams.map((team: any) => (
                  <div key={team.id} className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${initialTeam?.id === team.id ? 'bg-primary-50 border-r-2 border-primary-500' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{team.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{team.member_count} 名成员</p>
                      </div>
                      {team.owner_id && (
                        <span className="inline-flex" aria-label="团队所有者">
                          <Crown className="h-4 w-4 text-yellow-500" />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 团队详情 */}
          {initialTeam && (
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm">
                {/* 团队信息头部 */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{initialTeam.name}</h2>
                      {initialTeam.description && (
                        <p className="text-sm text-gray-600 mt-1">{initialTeam.description}</p>
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
                    团队成员 ({initialTeam.members?.length || 0})
                  </h3>
                  <div className="space-y-4">
                    {(initialTeam.members || []).map((member: any) => (
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
                            defaultValue={member.role}
                            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            disabled
                          >
                            <option value="member">成员</option>
                            <option value="admin">管理员</option>
                          </select>
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

      {/* 客户端交互组件 */}
      <TeamManagementClient initialTeams={teams} initialSelectedTeam={initialTeam} />
    </div>
  );
}
