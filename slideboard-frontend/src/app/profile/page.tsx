'use client';

import { User, Settings, Bell, Shield, CreditCard, FileText } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/shared/types/user';

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
  planExpiresAt?: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'notifications' | 'security' | 'billing'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    avatarUrl: '',
    phone: '',
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        // Map user from context (which is already camelCase User type) to local UserProfile
        const mockProfile: UserProfile = {
          id: user!.id,
          name: user!.name,
          phone: user!.phone,
          avatarUrl: user!.avatarUrl,
          role: user!.role,
          createdAt: user!.createdAt,
          planExpiresAt: '2024-12-31T23:59:59Z',
        };

        setProfile(mockProfile);
        setFormData({
          name: mockProfile.name,
          avatarUrl: mockProfile.avatarUrl || '',
          phone: mockProfile.phone || '',
        });
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: formData.name,
          avatar_url: formData.avatarUrl || null,
        })
        .eq('id', user!.id);

      if (updateError) {
        throw updateError;
      }

      // 更新本地profile状态
      setProfile(prev => prev ? {
        ...prev,
        name: formData.name,
        avatarUrl: formData.avatarUrl,
      } : null);

      setSuccess('资料保存成功!');
      setIsEditing(false);

      // 3秒后清除成功消息
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('保存失败,请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        avatarUrl: profile.avatarUrl || '',
        phone: profile.phone || '',
      });
      setIsEditing(false);
    }
  };

  const handleAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }

    // 验证文件大小 (最大5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过5MB');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const supabase = createClient();

      // 生成唯一文件名
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // 上传到Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // 获取公开URL
      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      // 更新formData
      setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
      setSuccess('头像上传成功!');

      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError('上传失败,请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: '个人资料', icon: User },
    { id: 'settings', name: '账户设置', icon: Settings },
    { id: 'notifications', name: '通知设置', icon: Bell },
    { id: 'security', name: '安全设置', icon: Shield },
    { id: 'billing', name: '账单管理', icon: CreditCard },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">加载用户资料失败</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">个人中心</h1>
              <p className="text-sm text-gray-600 mt-1">管理您的账户和个人信息</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{profile.name}</div>
                <div className="text-xs text-gray-500">{profile.role === 'pro' ? 'Pro用户' : '普通用户'}</div>
              </div>
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                {profile.avatarUrl ? (
                  <Image src={profile.avatarUrl} alt={profile.name} width={40} height={40} className="rounded-full" unoptimized />
                ) : (
                  <User className="h-5 w-5 text-primary-600" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* 侧边栏 */}
          <div className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm p-4">
              <ul className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <li key={tab.id}>
                      <button
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        {tab.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* 主内容 */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">个人资料</h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
                    >
                      编辑资料
                    </button>
                  )}
                </div>

                {/* 错误和成功消息 */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                    {success}
                  </div>
                )}

                <div className="space-y-6">
                  {/* 隐藏的文件输入 */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* 头像 */}
                  <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                      {profile.avatarUrl ? (
                        <Image src={profile.avatarUrl} alt={profile.name} width={80} height={80} className="rounded-full" unoptimized />
                      ) : (
                        <User className="h-8 w-8 text-primary-600" />
                      )}
                    </div>
                    {isEditing && (
                      <button
                        onClick={handleAvatarUpload}
                        disabled={isUploading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploading ? '上传中...' : '更换头像'}
                      </button>
                    )}
                  </div>

                  {/* 基本信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">{profile.name}</div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">手机号</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">{profile.phone}</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">账户类型</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                        {profile.role === 'pro' ? 'Pro用户' : '普通用户'}
                      </div>
                    </div>
                  </div>

                  {/* 注册时间 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">注册时间</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                      {new Date(profile.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  {isEditing && (
                    <div className="flex space-x-4">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? '保存中...' : '保存更改'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        取消
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">账户设置</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">语言设置</h3>
                      <p className="text-sm text-gray-600 mt-1">选择您的首选语言</p>
                    </div>
                    <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500">
                      <option value="zh-CN">简体中文</option>
                      <option value="en-US">English</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">时区设置</h3>
                      <p className="text-sm text-gray-600 mt-1">设置您的时区</p>
                    </div>
                    <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500">
                      <option value="Asia/Shanghai">北京时间 (UTC+8)</option>
                      <option value="UTC">协调世界时 (UTC)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">删除账户</h3>
                      <p className="text-sm text-gray-600 mt-1">永久删除您的账户和所有数据</p>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50">
                      删除账户
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">通知设置</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">邮件通知</h3>
                      <p className="text-sm text-gray-600 mt-1">接收重要更新和通知</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">协作通知</h3>
                      <p className="text-sm text-gray-600 mt-1">当有人协作您的幻灯片时通知您</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">营销邮件</h3>
                      <p className="text-sm text-gray-600 mt-1">接收产品更新和优惠信息</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">安全设置</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">修改密码</h3>
                      <p className="text-sm text-gray-600 mt-1">更新您的登录密码</p>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100">
                      修改密码
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">两步验证</h3>
                      <p className="text-sm text-gray-600 mt-1">为您的账户添加额外的安全保护</p>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100">
                      启用
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">登录历史</h3>
                      <p className="text-sm text-gray-600 mt-1">查看您的账户登录记录</p>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100">
                      查看记录
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">账单管理</h2>
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">当前计划</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {profile.role === 'pro' ? 'Pro计划' : '免费计划'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {profile.role === 'pro' ? '¥99/月' : '免费'}
                        </div>
                        {profile.planExpiresAt && (
                          <div className="text-xs text-gray-500">
                            到期时间: {new Date(profile.planExpiresAt).toLocaleDateString('zh-CN')}
                          </div>
                        )}
                      </div>
                    </div>
                    {profile.role !== 'pro' && (
                      <button className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">
                        升级到Pro
                      </button>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">账单历史</h3>
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>暂无账单记录</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
