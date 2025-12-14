'use client';

import { useState, useEffect, useMemo } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import PaperCard from '@/components/ui/paper-card';
import PaperTable from '@/components/ui/paper-table';
import { SystemConfigEditModal } from '@/features/system/components/config/SystemConfigEditModal';
import { StatusList } from '@/features/system/components/workflow/StatusList';
import { TransitionManagement } from '@/features/system/components/workflow/TransitionManagement';
import { SystemConfigFormValues } from '@/features/system/schemas/config';
import { useWorkflow } from '@/hooks/useWorkflow';
import { configService, SystemConfig } from '@/services/config.client';
import { permissionsService, Role } from '@/services/permissions.client';
import { usersService, SystemUser } from '@/services/users.client';

export default function SystemPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<SystemConfig | null>(null);
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  
  // Workflow hook
  const { config: workflowConfig } = useWorkflow();


  // Data states
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [systemConfigs, setSystemConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load roles and permissions
        const rolesData = await permissionsService.getRoles();
        setRoles(rolesData);

        // Load system configs
        const configsData = await configService.getSystemConfigs();
        setSystemConfigs(configsData);

        // Load users
        const usersData = await usersService.getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Failed to load system data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSaveConfig = async (data: SystemConfigFormValues) => {
    setIsSavingConfig(true);
    try {
      if (selectedConfig) {
        // Update
        await configService.updateSystemConfig(selectedConfig.id, {
          value: data.value,
          description: data.description,
          category: data.category,
        });
      } else {
        // Create
        await configService.createSystemConfig(
          data.key,
          data.value,
          data.category,
          data.description
        );
      }

      // Reload configs
      const configsData = await configService.getSystemConfigs();
      setSystemConfigs(configsData);

      setIsEditingConfig(false);
      setSelectedConfig(null);
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const tabs = [
    { id: 'users', label: '用户管理', count: users.length },
    { id: 'roles', label: '角色权限', count: roles.length },
    { id: 'config', label: '系统配置', count: systemConfigs.length },
    { id: 'workflow', label: '工作流设置', count: (workflowConfig?.definitions?.length || 0) + (workflowConfig?.transitions?.length || 0) }
  ];

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-paper-ink">用户管理</h2>
        <PaperButton>新增用户</PaperButton>
      </div>

      <PaperTable>
        <PaperTable.Header>
          <PaperTable.HeaderCell>姓名</PaperTable.HeaderCell>
          <PaperTable.HeaderCell>手机号</PaperTable.HeaderCell>
          <PaperTable.HeaderCell>角色</PaperTable.HeaderCell>
          <PaperTable.HeaderCell>部门</PaperTable.HeaderCell>
          <PaperTable.HeaderCell>状态</PaperTable.HeaderCell>
          <PaperTable.HeaderCell>最后登录</PaperTable.HeaderCell>
          <PaperTable.HeaderCell>操作</PaperTable.HeaderCell>
        </PaperTable.Header>
        <PaperTable.Body>
          {users.map((user) => (
            <PaperTable.Row key={user.id}>
              <PaperTable.Cell>{user.name}</PaperTable.Cell>
              <PaperTable.Cell>{user.phone}</PaperTable.Cell>
              <PaperTable.Cell>{user.role}</PaperTable.Cell>
              <PaperTable.Cell>{user.department || '-'}</PaperTable.Cell>
              <PaperTable.Cell>
                <span className={`px-2 py-1 rounded-full text-xs ${user.status === 'active'
                  ? 'bg-paper-success-light text-paper-success'
                  : 'bg-paper-error-light text-paper-error'
                  }`}>
                  {user.status === 'active' ? '活跃' : '禁用'}
                </span>
              </PaperTable.Cell>
              <PaperTable.Cell>{user.lastLogin || '-'}</PaperTable.Cell>
              <PaperTable.Cell>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="text-paper-primary hover:text-paper-primary-dark text-sm"
                  >
                    详情
                  </button>
                  <button className="text-paper-warning hover:text-paper-warning-dark text-sm">
                    编辑
                  </button>
                  <button className="text-paper-error hover:text-paper-error-dark text-sm">
                    删除
                  </button>
                </div>
              </PaperTable.Cell>
            </PaperTable.Row>
          ))}
        </PaperTable.Body>
      </PaperTable>

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <PaperCard className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <PaperCard.Header>
              <PaperCard.Title>用户详情</PaperCard.Title>
            </PaperCard.Header>
            <PaperCard.Content>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-paper-ink-secondary mb-1">姓名</label>
                    <p className="text-paper-ink">{selectedUser.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-paper-ink-secondary mb-1">手机号</label>
                    <p className="text-paper-ink">{selectedUser.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-paper-ink-secondary mb-1">角色</label>
                    <p className="text-paper-ink">{selectedUser.role}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-paper-ink-secondary mb-1">部门</label>
                    <p className="text-paper-ink">{selectedUser.department || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-paper-ink-secondary mb-1">状态</label>
                    <p className="text-paper-ink">{selectedUser.status === 'active' ? '活跃' : '禁用'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-paper-ink-secondary mb-1">最后登录</label>
                    <p className="text-paper-ink">{selectedUser.lastLogin || '-'}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-paper-ink-secondary mb-2">权限列表</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.permissions.map((permission) => (
                      <span key={permission} className="px-2 py-1 bg-paper-primary-light text-paper-primary rounded text-sm">
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </PaperCard.Content>
            <PaperCard.Footer>
              <div className="flex justify-end space-x-3">
                <PaperButton variant="outline" onClick={() => setSelectedUser(null)}>关闭</PaperButton>
                <PaperButton>编辑用户</PaperButton>
              </div>
            </PaperCard.Footer>
          </PaperCard>
        </div>
      )}
    </div>
  );

  const renderRoleManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-paper-ink">角色权限管理</h2>
        <PaperButton>新增角色</PaperButton>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-paper-ink-secondary">加载中...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <PaperCard key={role.id} className="hover:shadow-paper-lg transition-shadow">
              <PaperCard.Header>
                <PaperCard.Title>{role.name}</PaperCard.Title>
                <PaperCard.Description>{role.description}</PaperCard.Description>
              </PaperCard.Header>
              <PaperCard.Content>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-paper-ink-secondary">用户数：</span>
                    <span className="text-paper-ink">{role.user_count}</span>
                  </div>
                  <div>
                    <span className="text-sm text-paper-ink-secondary">权限列表：</span>
                    <div className="mt-2 space-y-1">
                      {role.permissions.map((permission) => (
                        <div key={permission} className="text-xs text-paper-ink bg-paper-primary-light px-2 py-1 rounded">
                          {permission}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </PaperCard.Content>
              <PaperCard.Footer>
                <div className="flex justify-between">
                  <PaperButton
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRole(role)}
                  >
                    查看详情
                  </PaperButton>
                  <div className="flex space-x-2">
                    <PaperButton size="sm">编辑</PaperButton>
                    <PaperButton size="sm" variant="outline">删除</PaperButton>
                  </div>
                </div>
              </PaperCard.Footer>
            </PaperCard>
          ))}
        </div>
      )}

      {selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <PaperCard className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <PaperCard.Header>
              <PaperCard.Title>角色详情</PaperCard.Title>
            </PaperCard.Header>
            <PaperCard.Content>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-paper-ink-secondary mb-1">角色名称</label>
                  <p className="text-paper-ink">{selectedRole.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-paper-ink-secondary mb-1">描述</label>
                  <p className="text-paper-ink">{selectedRole.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-paper-ink-secondary mb-1">用户数量</label>
                  <p className="text-paper-ink">{selectedRole.user_count} 人</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-paper-ink-secondary mb-2">权限详情</label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedRole.permissions.map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <input type="checkbox" checked readOnly className="rounded border-paper-border" />
                        <span className="text-paper-ink text-sm">{permission}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PaperCard.Content>
            <PaperCard.Footer>
              <div className="flex justify-end space-x-3">
                <PaperButton variant="outline" onClick={() => setSelectedRole(null)}>关闭</PaperButton>
                <PaperButton>编辑角色</PaperButton>
              </div>
            </PaperCard.Footer>
          </PaperCard>
        </div>
      )}
    </div>
  );

  const renderSystemConfig = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-paper-ink">系统配置</h2>
        <PaperButton onClick={() => {
          setSelectedConfig(null);
          setIsEditingConfig(true);
        }}>新增配置</PaperButton>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-paper-ink-secondary">加载中...</div>
        </div>
      ) : (
        <PaperTable>
          <PaperTable.Header>
            <PaperTable.HeaderCell>配置项</PaperTable.HeaderCell>
            <PaperTable.HeaderCell>配置值</PaperTable.HeaderCell>
            <PaperTable.HeaderCell>描述</PaperTable.HeaderCell>
            <PaperTable.HeaderCell>分类</PaperTable.HeaderCell>
            <PaperTable.HeaderCell>最后修改</PaperTable.HeaderCell>
            <PaperTable.HeaderCell>操作</PaperTable.HeaderCell>
          </PaperTable.Header>
          <PaperTable.Body>
            {systemConfigs.map((config) => (
              <PaperTable.Row key={config.id}>
                <PaperTable.Cell className="font-medium">{config.key}</PaperTable.Cell>
                <PaperTable.Cell>{config.value}</PaperTable.Cell>
                <PaperTable.Cell>{config.description}</PaperTable.Cell>
                <PaperTable.Cell>
                  <span className="px-2 py-1 bg-paper-info-light text-paper-info rounded text-xs">
                    {config.category}
                  </span>
                </PaperTable.Cell>
                <PaperTable.Cell>{config.updated_at}</PaperTable.Cell>
                <PaperTable.Cell>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedConfig(config)}
                      className="text-paper-primary hover:text-paper-primary-dark text-sm"
                    >
                      查看
                    </button>
                    <button
                      onClick={() => {
                        setSelectedConfig(config);
                        setIsEditingConfig(true);
                      }}
                      className="text-paper-warning hover:text-paper-warning-dark text-sm"
                    >
                      编辑
                    </button>
                  </div>
                </PaperTable.Cell>
              </PaperTable.Row>
            ))}
          </PaperTable.Body>
        </PaperTable>
      )}

      {selectedConfig && !isEditingConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <PaperCard className="w-full max-w-lg">
            <PaperCard.Header>
              <PaperCard.Title>配置详情</PaperCard.Title>
            </PaperCard.Header>
            <PaperCard.Content>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-paper-ink-secondary mb-1">配置项</label>
                  <p className="text-paper-ink font-mono">{selectedConfig.key}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-paper-ink-secondary mb-1">配置值</label>
                  <p className="text-paper-ink">{selectedConfig.value}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-paper-ink-secondary mb-1">描述</label>
                  <p className="text-paper-ink">{selectedConfig.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-paper-ink-secondary mb-1">分类</label>
                  <p className="text-paper-ink">{selectedConfig.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-paper-ink-secondary mb-1">最后修改时间</label>
                  <p className="text-paper-ink">{selectedConfig.updated_at}</p>
                </div>
              </div>
            </PaperCard.Content>
            <PaperCard.Footer>
              <div className="flex justify-end space-x-3">
                <PaperButton variant="outline" onClick={() => setSelectedConfig(null)}>关闭</PaperButton>
                <PaperButton onClick={() => setIsEditingConfig(true)}>编辑配置</PaperButton>
              </div>
            </PaperCard.Footer>
          </PaperCard>
        </div>
      )}

      <SystemConfigEditModal
        open={isEditingConfig}
        config={selectedConfig}
        onClose={() => {
          setIsEditingConfig(false);
          if (!selectedConfig) {
             // If we were creating, clear selection. If editing, we keep selection (maybe to show detail again?)
             // Actually if we cancel edit, we might want to return to detail view if we started from there?
             // But my logic `selectedConfig && !isEditingConfig` handles that. 
             // If I cancel edit, `isEditingConfig` becomes false. If `selectedConfig` is still there, Detail Modal shows up.
             // If I was creating, `selectedConfig` was null, so nothing shows up. Correct.
          }
        }}
        onSave={handleSaveConfig}
        isSaving={isSavingConfig}
      />
    </div>
  );

  const renderWorkflowRules = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-paper-ink mb-4">状态定义</h2>
        <StatusList />
      </div>
      
      <div className="border-t border-paper-border pt-8">
        <h2 className="text-xl font-semibold text-paper-ink mb-4">流转规则管理</h2>
        <TransitionManagement />
      </div>
    </div>
  );

  return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-paper-ink mb-2">系统管理</h1>
          <p className="text-paper-ink-secondary">管理系统用户、角色权限、配置参数和业务流程</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-paper-border">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                  ? 'border-paper-primary text-paper-primary'
                  : 'border-transparent text-paper-ink-secondary hover:text-paper-ink'
                  }`}
              >
                {tab.label}
                <span className="ml-2 bg-paper-primary-light text-paper-primary px-2 py-0.5 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'users' && renderUserManagement()}
          {activeTab === 'roles' && renderRoleManagement()}
          {activeTab === 'config' && renderSystemConfig()}
          {activeTab === 'workflow' && renderWorkflowRules()}
        </div>
      </div>
  );
}
