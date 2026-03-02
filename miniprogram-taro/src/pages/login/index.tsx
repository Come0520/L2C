/**
 * 登录页
 *
 * @description 支持三种登录方式：账号密码 / 微信授权 / 手机号一键登录
 * 登录成功后根据用户角色跳转至对应落地页（ROLE_HOME）。
 */
import { View, Text, Input, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { useAuthStore, ROLE_HOME } from '@/stores/auth'
import { api } from '@/services/api'
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
    if (!phone || !password) {
      setError('请输入手机号和密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', {
        data: { phone, password },
      })
      if (res.success) {
        setLogin(res.data.token, res.data.userInfo)
        const home = ROLE_HOME[res.data.userInfo.role] || '/pages/workbench/index'
        Taro.switchTab({ url: home })
      } else {
        setError(res.error || '登录失败，请检查账号密码')
      }
    } finally {
      setLoading(false)
    }
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
        setLogin(res.data.token, res.data.userInfo)
        const home = ROLE_HOME[res.data.userInfo.role] || '/pages/workbench/index'
        Taro.switchTab({ url: home })
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
        <View className='login-form'>
          <View className='form-field'>
            <Input
              className='form-input'
              type='number'
              maxlength={11}
              placeholder='手机号'
              value={phone}
              onInput={(e) => setPhone(e.detail.value)}
            />
          </View>
          <View className='form-field'>
            <Input
              className='form-input'
              password
              placeholder='密码'
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
            />
          </View>

          {error && <Text className='error-text'>{error}</Text>}

          <Button
            className='btn-primary'
            loading={loading}
            disabled={loading}
            onClick={handlePasswordLogin}
          >
            登 录
          </Button>
        </View>
      )}

      {/* 微信一键登录 */}
      {activeTab === 'wechat' && (
        <View className='login-wechat'>
          <Button
            className='btn-wechat'
            loading={loading}
            disabled={loading}
            onClick={handleWechatLogin}
          >
            微信一键登录
          </Button>
          {error && <Text className='error-text'>{error}</Text>}
        </View>
      )}

      {/* 底部注册入口 */}
      <View className='login-footer'>
        <Text className='footer-text'>还没有账号？</Text>
        <Text className='footer-link' onClick={goRegister}>
          申请入驻
        </Text>
      </View>
    </View>
  )
}
