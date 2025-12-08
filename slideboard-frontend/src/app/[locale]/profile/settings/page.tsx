'use client';

import Image from 'next/image';
import { useState } from 'react';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperButton } from '@/components/ui/paper-button';
import PaperCard from '@/components/ui/paper-card';
import { toast } from '@/components/ui/toast';

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  department: string;
  position: string;
  avatar: string;
  bio: string;
  joinDate: string;
  lastLogin: string;
  status: 'active' | 'inactive';
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
  passwordLastChanged: string;
}

interface NotificationSettings {
  pushNotifications: boolean;
  smsNotifications: boolean;
  notificationTypes: {
    orders: boolean;
    approvals: boolean;
    system: boolean;
    reports: boolean;
  };
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Mock data
  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    name: '张三',
    phone: '13800138000',
    department: '销售部',
    position: '销售经理',
    avatar: '',
    bio: '专注于企业销售管理，致力于提升客户满意度。',
    joinDate: '2023-03-15',
    lastLogin: '2024-01-15 14:30',
    status: 'active'
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: true,
    loginAlerts: true,
    sessionTimeout: 30,
    passwordLastChanged: '2024-01-01'
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    pushNotifications: false,
    smsNotifications: true,
    notificationTypes: {
      orders: true,
      approvals: true,
      system: true,
      reports: false
    }
  });

  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const tabs = [
    { id: 'profile', label: '个人资料' },
    { id: 'security', label: '安全设置' },
    { id: 'notifications', label: '通知设置' },
    { id: 'privacy', label: '隐私设置' }
  ];

  const handleSaveProfile = () => {
    setProfile(editedProfile);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('新密码与确认密码不一致');
      return;
    }
    // 这里应该调用API来修改密码
    toast.success('密码修改成功');
    setShowPasswordModal(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleLogout = () => {
    // 这里应该调用API来登出
    window.location.href = '/login';
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-paper-ink">个人资料</h2>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <PaperButton variant="outline" onClick={handleCancelEdit}>取消</PaperButton>
              <PaperButton onClick={handleSaveProfile}>保存</PaperButton>
            </>
          ) : (
            <PaperButton onClick={() => setIsEditing(true)}>编辑资料</PaperButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PaperCard className="lg:col-span-1">
          <PaperCard.Header>
            <PaperCard.Title>头像设置</PaperCard.Title>
          </PaperCard.Header>
          <PaperCard.Content>
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto bg-paper-primary-light rounded-full flex items-center justify-center">
                {profile.avatar ? (
                  <Image src={profile.avatar} alt="头像" width={160} height={160} className="rounded-full object-cover" unoptimized />
                ) : (
                  <span className="text-2xl text-paper-primary font-medium">
                    {profile.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <PaperButton size="sm" variant="outline">更换头像</PaperButton>
                <p className="text-xs text-paper-ink-secondary mt-2">
                  支持 JPG、PNG 格式，最大 2MB
                </p>
              </div>
            </div>
          </PaperCard.Content>
        </PaperCard>

        <PaperCard className="lg:col-span-2">
          <PaperCard.Header>
            <PaperCard.Title>基本信息</PaperCard.Title>
          </PaperCard.Header>
          <PaperCard.Content>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-paper-ink-secondary mb-1">姓名</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.name}
                      onChange={(e) => setEditedProfile({...editedProfile, name: e.target.value})}
                      className="paper-input w-full"
                    />
                  ) : (
                    <p className="text-paper-ink">{profile.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-paper-ink-secondary mb-1">手机</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editedProfile.phone}
                      onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                      className="paper-input w-full"
                    />
                  ) : (
                    <p className="text-paper-ink">{profile.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-paper-ink-secondary mb-1">部门</label>
                  <p className="text-paper-ink">{profile.department}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-paper-ink-secondary mb-1">职位</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.position}
                      onChange={(e) => setEditedProfile({...editedProfile, position: e.target.value})}
                      className="paper-input w-full"
                    />
                  ) : (
                    <p className="text-paper-ink">{profile.position}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-paper-ink-secondary mb-1">入职时间</label>
                  <p className="text-paper-ink">{profile.joinDate}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-paper-ink-secondary mb-1">个人简介</label>
                {isEditing ? (
                  <textarea
                    value={editedProfile.bio}
                    onChange={(e) => setEditedProfile({...editedProfile, bio: e.target.value})}
                    rows={3}
                    className="paper-input w-full"
                  />
                ) : (
                  <p className="text-paper-ink">{profile.bio}</p>
                )}
              </div>
            </div>
          </PaperCard.Content>
        </PaperCard>
      </div>

      <PaperCard>
        <PaperCard.Header>
          <PaperCard.Title>账户状态</PaperCard.Title>
        </PaperCard.Header>
        <PaperCard.Content>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-paper-ink-secondary mb-1">账户状态</label>
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${
                  profile.status === 'active' ? 'bg-paper-success' : 'bg-paper-error'
                }`}></span>
                <span className="text-paper-ink">
                  {profile.status === 'active' ? '正常' : '已禁用'}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-paper-ink-secondary mb-1">最后登录</label>
              <p className="text-paper-ink">{profile.lastLogin}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-paper-ink-secondary mb-1">密码修改</label>
              <PaperButton size="sm" variant="outline" onClick={() => setShowPasswordModal(true)}>
                修改密码
              </PaperButton>
            </div>
          </div>
        </PaperCard.Content>
      </PaperCard>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-paper-ink">安全设置</h2>

      <PaperCard>
        <PaperCard.Header>
          <PaperCard.Title>登录安全</PaperCard.Title>
        </PaperCard.Header>
        <PaperCard.Content>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-paper-ink">双重认证</h4>
                <p className="text-sm text-paper-ink-secondary">使用手机验证码增强账户安全性</p>
              </div>
              <button
                onClick={() => setSecurity({...security, twoFactorEnabled: !security.twoFactorEnabled})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  security.twoFactorEnabled ? 'bg-paper-primary' : 'bg-paper-border'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-paper-ink-secondary mb-2">会话超时时间</label>
              <select 
                value={security.sessionTimeout}
                onChange={(e) => setSecurity({...security, sessionTimeout: parseInt(e.target.value)})}
                className="paper-input"
              >
                <option value={15}>15分钟</option>
                <option value={30}>30分钟</option>
                <option value={60}>1小时</option>
                <option value={120}>2小时</option>
              </select>
              <p className="text-xs text-paper-ink-secondary mt-1">超过设定时间无操作将自动登出</p>
            </div>
          </div>
        </PaperCard.Content>
      </PaperCard>

      <PaperCard>
        <PaperCard.Header>
          <PaperCard.Title>密码安全</PaperCard.Title>
        </PaperCard.Header>
        <PaperCard.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-paper-ink-secondary mb-1">最后修改时间</label>
              <p className="text-paper-ink">{security.passwordLastChanged}</p>
            </div>
            <div className="flex items-end">
              <PaperButton onClick={() => setShowPasswordModal(true)}>修改密码</PaperButton>
            </div>
          </div>
        </PaperCard.Content>
      </PaperCard>

      <PaperCard>
        <PaperCard.Header>
          <PaperCard.Title>登录历史</PaperCard.Title>
        </PaperCard.Header>
        <PaperCard.Content>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-paper-background rounded-lg">
              <div>
                <div className="font-medium text-paper-ink">当前会话</div>
                <div className="text-sm text-paper-ink-secondary">{profile.lastLogin}</div>
              </div>
              <span className="px-2 py-1 bg-paper-success-light text-paper-success rounded text-xs">活跃</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-paper-background rounded-lg">
              <div>
                <div className="font-medium text-paper-ink">Chrome - Windows</div>
                <div className="text-sm text-paper-ink-secondary">2024-01-15 09:30</div>
              </div>
              <button className="text-paper-error hover:text-paper-error-dark text-sm">踢出</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-paper-background rounded-lg">
              <div>
                <div className="font-medium text-paper-ink">Safari - iOS</div>
                <div className="text-sm text-paper-ink-secondary">2024-01-14 16:45</div>
              </div>
              <button className="text-paper-error hover:text-paper-error-dark text-sm">踢出</button>
            </div>
          </div>
        </PaperCard.Content>
      </PaperCard>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-paper-ink">通知设置</h2>

      <PaperCard>
        <PaperCard.Header>
          <PaperCard.Title>通知方式</PaperCard.Title>
        </PaperCard.Header>
        <PaperCard.Content>
          <div className="space-y-4">

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-paper-ink">推送通知</h4>
                <p className="text-sm text-paper-ink-secondary">浏览器推送通知</p>
              </div>
              <button
                onClick={() => setNotifications({...notifications, pushNotifications: !notifications.pushNotifications})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.pushNotifications ? 'bg-paper-primary' : 'bg-paper-border'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-paper-ink">短信通知</h4>
                <p className="text-sm text-paper-ink-secondary">重要事项短信提醒</p>
              </div>
              <button
                onClick={() => setNotifications({...notifications, smsNotifications: !notifications.smsNotifications})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.smsNotifications ? 'bg-paper-primary' : 'bg-paper-border'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </PaperCard.Content>
      </PaperCard>

      <PaperCard>
        <PaperCard.Header>
          <PaperCard.Title>通知类型</PaperCard.Title>
        </PaperCard.Header>
        <PaperCard.Content>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-paper-ink">订单通知</h4>
                <p className="text-sm text-paper-ink-secondary">新订单、订单状态变更等</p>
              </div>
              <button
                onClick={() => setNotifications({
                  ...notifications, 
                  notificationTypes: {
                    ...notifications.notificationTypes,
                    orders: !notifications.notificationTypes.orders
                  }
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.notificationTypes.orders ? 'bg-paper-primary' : 'bg-paper-border'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications.notificationTypes.orders ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-paper-ink">审批通知</h4>
                <p className="text-sm text-paper-ink-secondary">待审批事项、审批结果等</p>
              </div>
              <button
                onClick={() => setNotifications({
                  ...notifications, 
                  notificationTypes: {
                    ...notifications.notificationTypes,
                    approvals: !notifications.notificationTypes.approvals
                  }
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.notificationTypes.approvals ? 'bg-paper-primary' : 'bg-paper-border'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications.notificationTypes.approvals ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-paper-ink">系统通知</h4>
                <p className="text-sm text-paper-ink-secondary">系统维护、功能更新等</p>
              </div>
              <button
                onClick={() => setNotifications({
                  ...notifications, 
                  notificationTypes: {
                    ...notifications.notificationTypes,
                    system: !notifications.notificationTypes.system
                  }
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.notificationTypes.system ? 'bg-paper-primary' : 'bg-paper-border'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications.notificationTypes.system ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-paper-ink">报表通知</h4>
                <p className="text-sm text-paper-ink-secondary">定期报表、数据汇总等</p>
              </div>
              <button
                onClick={() => setNotifications({
                  ...notifications, 
                  notificationTypes: {
                    ...notifications.notificationTypes,
                    reports: !notifications.notificationTypes.reports
                  }
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.notificationTypes.reports ? 'bg-paper-primary' : 'bg-paper-border'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications.notificationTypes.reports ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </PaperCard.Content>
      </PaperCard>
    </div>
  );

  const renderPrivacyTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-paper-ink">隐私设置</h2>

      <PaperCard>
        <PaperCard.Header>
          <PaperCard.Title>数据隐私</PaperCard.Title>
        </PaperCard.Header>
        <PaperCard.Content>
          <div className="space-y-4">
            <div className="p-4 bg-paper-background rounded-lg">
              <h4 className="font-medium text-paper-ink mb-2">数据导出</h4>
              <p className="text-sm text-paper-ink-secondary mb-3">
                导出您的个人数据，包括个人资料、操作记录等
              </p>
              <PaperButton size="sm" variant="outline">导出数据</PaperButton>
            </div>
            <div className="p-4 bg-paper-background rounded-lg">
              <h4 className="font-medium text-paper-ink mb-2">账户注销</h4>
              <p className="text-sm text-paper-ink-secondary mb-3">
                永久删除您的账户和所有相关数据，此操作不可恢复
              </p>
              <PaperButton size="sm" variant="outline" className="text-paper-error hover:text-paper-error">
                申请注销账户
              </PaperButton>
            </div>
          </div>
        </PaperCard.Content>
      </PaperCard>

      <PaperCard>
        <PaperCard.Header>
          <PaperCard.Title>操作记录</PaperCard.Title>
        </PaperCard.Header>
        <PaperCard.Content>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-paper-background rounded-lg">
              <div>
                <div className="font-medium text-paper-ink">登录系统</div>
                <div className="text-sm text-paper-ink-secondary">2024-01-15 14:30</div>
              </div>
              <span className="text-xs text-paper-ink-secondary">IP: 192.168.1.100</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-paper-background rounded-lg">
              <div>
                <div className="font-medium text-paper-ink">修改个人资料</div>
                <div className="text-sm text-paper-ink-secondary">2024-01-14 16:20</div>
              </div>
              <span className="text-xs text-paper-ink-secondary">IP: 192.168.1.100</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-paper-background rounded-lg">
              <div>
                <div className="font-medium text-paper-ink">创建订单</div>
                <div className="text-sm text-paper-ink-secondary">2024-01-13 09:15</div>
              </div>
              <span className="text-xs text-paper-ink-secondary">IP: 192.168.1.100</span>
            </div>
          </div>
        </PaperCard.Content>
      </PaperCard>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-paper-ink mb-2">账户设置</h1>
            <p className="text-paper-ink-secondary">管理您的个人信息和账户安全</p>
          </div>
          <PaperButton variant="outline" onClick={() => setShowLogoutConfirm(true)}>
            退出登录
          </PaperButton>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-paper-border">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-paper-primary text-paper-primary'
                    : 'border-transparent text-paper-ink-secondary hover:text-paper-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'security' && renderSecurityTab()}
          {activeTab === 'notifications' && renderNotificationsTab()}
          {activeTab === 'privacy' && renderPrivacyTab()}
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <PaperCard className="w-full max-w-md">
              <PaperCard.Header>
                <PaperCard.Title>修改密码</PaperCard.Title>
              </PaperCard.Header>
              <PaperCard.Content>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-paper-ink-secondary mb-1">当前密码</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className="paper-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-paper-ink-secondary mb-1">新密码</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="paper-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-paper-ink-secondary mb-1">确认新密码</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="paper-input w-full"
                    />
                  </div>
                </div>
              </PaperCard.Content>
              <PaperCard.Footer>
                <div className="flex justify-end space-x-3">
                  <PaperButton variant="outline" onClick={() => setShowPasswordModal(false)}>取消</PaperButton>
                  <PaperButton onClick={handlePasswordChange}>确认修改</PaperButton>
                </div>
              </PaperCard.Footer>
            </PaperCard>
          </div>
        )}

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <PaperCard className="w-full max-w-md">
              <PaperCard.Header>
                <PaperCard.Title>确认退出登录</PaperCard.Title>
              </PaperCard.Header>
              <PaperCard.Content>
                <p className="text-paper-ink">您确定要退出登录吗？</p>
              </PaperCard.Content>
              <PaperCard.Footer>
                <div className="flex justify-end space-x-3">
                  <PaperButton variant="outline" onClick={() => setShowLogoutConfirm(false)}>取消</PaperButton>
                  <PaperButton onClick={handleLogout}>确认退出</PaperButton>
                </div>
              </PaperCard.Footer>
            </PaperCard>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
