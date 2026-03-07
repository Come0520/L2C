/**
 * 登录页
 *
 * @description 支持三种登录方式：账号密码 / 微信授权 / 手机号一键登录
 * 登录成功后根据用户角色跳转至对应落地页（ROLE_HOME）。
 */
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { useAuthStore, ROLE_HOME } from '@/stores/auth'
import { api } from '@/services/api'
import { isValidPhone, isNotEmpty, isValidLength } from '@/utils/validate'
import './index.scss'

/** 当前选中的登录 Tab */
type LoginTab = 'password' | 'wechat' | 'phone'

export default function LoginPage() {
  const { setLogin } = useAuthStore()
  const [activeTab, setActiveTab] = useState<LoginTab>('password')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /** 账号密码登录 */
  const handlePasswordLogin = async () => {
    // === 开发者测试后门：直接绕过网络请求，无需输入正确账号密码 ===
    setLogin('dev-mock-token-xyz', {
      id: 'dev-admin',
      name: '研发体验官',
      role: 'manager',
      tenantId: 'tenant-0000',
      tenantName: 'L2C 体验中心',
    })
    Taro.switchTab({ url: '/pages/workbench/index' })
    // ========================================================
  }

  /** 微信授权登录 */
  const handleWechatLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const loginRes = await Taro.login()
      const res = await api.post('/auth/wx-login', {
        data: { code: loginRes.code },
      })
      if (res.success) {
        setLogin(res.data.token, res.data.user)
        const home = ROLE_HOME[res.data.user.role] || '/pages/workbench/index'
        try {
          await Taro.switchTab({ url: home })
        } catch (err) {
          console.warn('[Wechat] switchTab 失败，尝试 reLaunch', err)
          await Taro.reLaunch({ url: home })
        }
      } else {
        setError(res.error || '微信登录失败')
      }
    } catch (e) {
      setError('微信授权失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  /** 前往注册/入驻申请 */
  const goRegister = () => {
    Taro.navigateTo({ url: '/pages/register/index' })
  }

  return (
    <View className='login-page'>
      {/* 顶部 Logo */}
      <View className='login-header'>
        <Text className='login-logo'>L2C</Text>
        <Text className='login-subtitle'>窗帘全流程管理大师</Text>
      </View>

      {/* 登录方式 Tab */}
      <View className='login-tabs'>
        <View
          className={`login-tab ${activeTab === 'password' ? 'login-tab--active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          <Text>账号登录</Text>
        </View>
        <View
          className={`login-tab ${activeTab === 'wechat' ? 'login-tab--active' : ''}`}
          onClick={() => setActiveTab('wechat')}
        >
          <Text>微信登录</Text>
        </View>
      </View>

      {/* 账号密码登录表单 */}
      {activeTab === 'password' && (
        <View className='login-form-container'>
          <View className='apple-list-row'>
            <Text className='apple-list-label'>手机号</Text>
            <Input
              className='apple-list-input'
              type='number'
              maxlength={11}
              placeholder='请输入手机号码'
              placeholder-class='ph-color'
              value={phone}
              onInput={(e) => setPhone(e.detail.value)}
            />
          </View>
          <View className='apple-list-row'>
            <Text className='apple-list-label'>安全密码</Text>
            <Input
              className='apple-list-input'
              password
              placeholder='请输入密码'
              placeholder-class='ph-color'
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
            />
          </View>
        </View>
      )}

      {/* 提交按钮区域 */}
      <View className='login-actions'>
        {error && <Text className='error-text'>{error}</Text>}

        {activeTab === 'password' ? (
          <Button
            className='apple-btn-primary'
            loading={loading}
            disabled={loading}
            onClick={handlePasswordLogin}
          >
            登 录
          </Button>
        ) : (
          <Button
            className='apple-btn-primary'
            style={{ backgroundColor: '#21C042' }} // WeChat Green
            loading={loading}
            disabled={loading}
            onClick={handleWechatLogin}
          >
            微信一键登录
          </Button>
        )}
      </View>

      {/* 底部注册入口 */}
      <View className='login-footer'>
        <Text className='footer-text'>还没有账号？</Text>
        <Text className='footer-link' onClick={goRegister}>
          申请入驻
        </Text>
        <Text style={{ margin: '0 10px', color: '#ccc' }}>|</Text>
        <Text
          className='footer-link'
          style={{ color: '#FF3B30', fontWeight: 'bold' }}
          onClick={() => {
            setLogin('dev-mock-token-xyz', {
              id: 'dev-admin',
              name: '研发体验官',
              role: 'manager',
              tenantId: 'tenant-0000',
              tenantName: 'L2C 体验中心'
            });
            Taro.switchTab({ url: '/pages/workbench/index' });
          }}
        >
          免密入场
        </Text>
      </View>
    </View>
  )
}
