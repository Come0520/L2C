'use client';

import { useState, useEffect, useMemo } from 'react';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperButton } from '@/components/ui/paper-button';
import PaperCard from '@/components/ui/paper-card';
import PaperTable from '@/components/ui/paper-table';
import { configService, SystemConfig } from '@/services/config.client';
import { permissionsService, Role } from '@/services/permissions.client';
import { workflowService, WorkflowRule } from '@/services/workflow.client';

interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  permissions: string[];
  createdAt: string;
}

export default function SystemPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<SystemConfig | null>(null);


  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [systemConfigs, setSystemConfigs] = useState<SystemConfig[]>([]);
  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock data for users (to be replaced with actual API call)
  const mockUsers: User[] = useMemo(() => ([
    {
      id: '1',
      name: '张三',
      phone: '13800138000',
      role: '系统管理员',
      department: 'IT部门',
      status: 'active',
      lastLogin: '2024-01-15 14:30',
      permissions: ['用户管理', '系统配置', '审批管理'],
      createdAt: '2023-01-01 00:00:00'
    },
    {
      id: '2',
      name: '李四',
      phone: '13900139000',
      role: '销售经理',
      department: '销售部',
      status: 'active',
      lastLogin: '2024-01-15 16:45',
      permissions: ['客户管理', '订单管理', '报表查看'],
      createdAt: '2023-02-01 00:00:00'
    },
    {
      id: '3',
      name: '王五',
      phone: '13700137000',
      role: '财务主管',
      department: '财务部',
      status: 'inactive',
      lastLogin: '2024-01-10 09:15',
      permissions: ['财务管理', '发票管理', '报表查看'],
      createdAt: '2023-03-01 00:00:00'
    }
  ]), []);

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

        // Load workflow rules
        const workflowData = await workflowService.getWorkflowRules();
        setWorkflowRules(workflowData);

        // Set users from mock data (to be replaced with API call)
        setUsers(mockUsers);
      } catch (error) {
        console.error('Failed to load system data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [mockUsers]);

  const tabs = [
    { id: 'users', label: '用户管理', count: users.length },
    { id: 'roles', label: '角色权限', count: roles.length },
    { id: 'config', label: '系统配置', count: systemConfigs.length },
    { id: 'workflow', label: '状态流转', count: workflowRules.length }
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
              <PaperTable.Cell>{user.department}</PaperTable.Cell>
              <PaperTable.Cell>
                <span className={`px-2 py-1 rounded-full text-xs ${user.status === 'active'
                  ? 'bg-paper-success-light text-paper-success'
                  : 'bg-paper-error-light text-paper-error'
                  }`}>
                  {user.status === 'active' ? '活跃' : '禁用'}
                </span>
              </PaperTable.Cell>
              <PaperTable.Cell>{user.lastLogin}</PaperTable.Cell>
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
                    <p className="text-paper-ink">{selectedUser.department}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-paper-ink-secondary mb-1">状态</label>
                    <p className="text-paper-ink">{selectedUser.status === 'active' ? '活跃' : '禁用'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-paper-ink-secondary mb-1">最后登录</label>
                    <p className="text-paper-ink">{selectedUser.lastLogin}</p>
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
        <PaperButton>新增配置</PaperButton>
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
                    <button className="text-paper-warning hover:text-paper-warning-dark text-sm">
                      编辑
                    </button>
                  </div>
                </PaperTable.Cell>
              </PaperTable.Row>
            ))}
          </PaperTable.Body>
        </PaperTable>
      )}

      {selectedConfig && (
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
                <PaperButton>编辑配置</PaperButton>
              </div>
            </PaperCard.Footer>
          </PaperCard>
        </div>
      )}
    </div>
  );

  const renderWorkflowRules = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-paper-ink">状态流转规则</h2>
        <PaperButton>新增规则</PaperButton>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-paper-ink-secondary">加载中...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {workflowRules.map((rule) => (
            <PaperCard key={rule.id} className="hover:shadow-paper-lg transition-shadow">
              <PaperCard.Header>
                <div className="flex justify-between items-start">
                  <div>
                    <PaperCard.Title>{rule.name}</PaperCard.Title>
                    <PaperCard.Description>{rule.description}</PaperCard.Description>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${rule.isActive
                      ? 'bg-paper-success-light text-paper-success'
                      : 'bg-paper-error-light text-paper-error'
                      }`}>
                      {rule.isActive ? '启用' : '禁用'}
                    </span>
                  </div>
                </div>
              </PaperCard.Header>
              <PaperCard.Content>
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-sm text-paper-ink-secondary">起始状态</div>
                      <div className="px-3 py-1 bg-paper-primary-light text-paper-primary rounded font-medium">
                        {rule.fromStatus}
                      </div>
                    </div>
                    <div className="text-paper-ink-secondary">→</div>
                    <div className="text-center">
                      <div className="text-sm text-paper-ink-secondary">目标状态</div>
                      <div className="px-3 py-1 bg-paper-success-light text-paper-success rounded font-medium">
                        {rule.toStatus}
                      </div>
                    </div>
                  </div>

                  {rule.conditions && rule.conditions.length > 0 && (
                    <div>
                      <div className="text-sm text-paper-ink-secondary mb-2">流转条件：</div>
                      <div className="space-y-1">
                        {rule.conditions.map((condition, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-paper-warning rounded-full"></span>
                            <span className="text-sm text-paper-ink">{condition}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {rule.approvers && rule.approvers.length > 0 && (
                    <div>
                      <div className="text-sm text-paper-ink-secondary mb-2">审批人：</div>
                      <div className="flex flex-wrap gap-2">
                        {rule.approvers.map((approver) => (
                          <span key={approver} className="px-2 py-1 bg-paper-info-light text-paper-info rounded text-xs">
                            {approver}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </PaperCard.Content>
              <PaperCard.Footer>
                <div className="flex justify-between">
                  <PaperButton
                    variant="outline"
                    size="sm"
                  >
                    查看详情
                  </PaperButton>
                  <div className="flex space-x-2">
                    <PaperButton size="sm">{rule.isActive ? '禁用' : '启用'}</PaperButton>
                    <PaperButton size="sm" variant="outline">编辑</PaperButton>
                    <PaperButton size="sm" variant="outline">删除</PaperButton>
                  </div>
                </div>
              </PaperCard.Footer>
            </PaperCard>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
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
    </DashboardLayout>
  );
}
