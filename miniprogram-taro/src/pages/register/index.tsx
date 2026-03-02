import { View, Text, Input, Button, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import './index.scss'

/** 完全与 Web 端 REGIONS 保持一致 */
const REGIONS = [
  '北京市', '天津市', '上海市', '重庆市', '河北省', '山西省', '辽宁省', '吉林省',
  '黑龙江省', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省',
  '湖北省', '湖南省', '广东省', '海南省', '四川省', '贵州省', '云南省', '陕西省',
  '甘肃省', '青海省', '内蒙古自治区', '广西壮族自治区', '西藏自治区',
  '宁夏回族自治区', '新疆维吾尔自治区', '香港特别行政区', '澳门特别行政区', '台湾省'
]

/**
 * 密码强度计算（与 Web 端保持一致的评分规则）
 * 0: 空/不合格
 * 1: 长度 >= 8
 * 2: 含字母+数字
 * 3: 含特殊字符或长度 >= 12
 */
const calcStrength = (pwd: string): 0 | 1 | 2 | 3 => {
  if (!pwd) return 0
  let score = 0
  if (pwd.length >= 8) score += 1
  if (/(?=.*[a-zA-Z])(?=.*\d)/.test(pwd)) score += 1
  if (/(?=.*[!@#$%^&*])/.test(pwd) || pwd.length >= 12) score += 1
  return score as 0 | 1 | 2 | 3
}

/** 与 Web 端保持一致的强度文案 */
const STRENGTH_TEXT = ['', '较弱 (请混合字母和数字)', '中等 (符合注册要求)', '高强度']
/** 强度条颜色 */
const STRENGTH_COLORS = ['transparent', '#EF4444', '#EAB308', '#22C55E']

export default function RegisterPage() {
  // 与 Web 端 formData 字段完全一致
  const [formData, setFormData] = useState({
    companyName: '',
    applicantName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    region: '',
    businessDescription: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /** 通用字段更新 */
  const update = (field: keyof typeof formData) => (e: any) => {
    setFormData((prev) => ({ ...prev, [field]: e.detail.value }))
    setError('')
  }

  /** 地区 Picker 回调 */
  const handleRegionChange = (e: any) => {
    setFormData((prev) => ({ ...prev, region: REGIONS[e.detail.value] }))
    setError('')
  }

  const strength = calcStrength(formData.password)

  /** 提交逻辑：与 Web 端相同的验证规则 */
  const handleSubmit = async () => {
    if (!formData.companyName) { setError('请填写企业名称'); return }
    if (!formData.applicantName) { setError('请填写联系人姓名'); return }
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) { setError('手机号格式不正确'); return }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('请填写正确的邮箱地址'); return
    }
    if (formData.password.length < 8) { setError('密码至少8位'); return }
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      setError('密码需包含字母和数字'); return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致'); return
    }
    if (!formData.region) { setError('请选择地区'); return }

    setLoading(true)
    setError('')
    try {
      const res = await api.post('/miniprogram/tenant/register', {
        data: {
          companyName: formData.companyName,
          applicantName: formData.applicantName,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          region: formData.region,
          businessDescription: formData.businessDescription || undefined,
        }
      })
      if (res.success) {
        Taro.navigateTo({ url: '/pages/status/index' })
      } else {
        setError(res.error || '提交失败，请稍后重试')
      }
    } catch {
      setError('网络异常，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='register-page'>
      {/* 页面标题 */}
      <View className='page-header'>
        <Text className='page-title'>企业入驻申请</Text>
        <Text className='page-desc'>填写以下信息申请开通 L2C 销售管理系统</Text>
      </View>

      {/* ── 第一组：企业信息 ── */}
      <Text className='form-group-title'>企业信息</Text>
      <View className='form-group'>
        <View className='apple-list-row'>
          <Text className='form-label'>企业名称 <Text className='required'>*</Text></Text>
          <Input className='form-input' placeholder='请输入企业全称' placeholderClass='ph-color'
            value={formData.companyName} onInput={update('companyName')} />
        </View>
      </View>

      {/* ── 第二组：联系人信息 ── */}
      <Text className='form-group-title'>联系人信息</Text>
      <View className='form-group'>
        <View className='apple-list-row'>
          <Text className='form-label'>联系人 <Text className='required'>*</Text></Text>
          <Input className='form-input' placeholder='您的姓名' placeholderClass='ph-color'
            value={formData.applicantName} onInput={update('applicantName')} />
        </View>
        <View className='apple-list-row'>
          <Text className='form-label'>手机号 <Text className='required'>*</Text></Text>
          <Input className='form-input' type='number' maxlength={11} placeholder='11位手机号'
            placeholderClass='ph-color' value={formData.phone} onInput={update('phone')} />
        </View>
        <View className='apple-list-row'>
          <Text className='form-label'>邮箱 <Text className='required'>*</Text></Text>
          <Input className='form-input' type='text' placeholder='用于接收审核通知'
            placeholderClass='ph-color' value={formData.email} onInput={update('email')} />
        </View>
        <View className='apple-list-row'>
          <Text className='form-label'>所在地区 <Text className='required'>*</Text></Text>
          <Picker className='form-input picker-input' mode='selector' range={REGIONS} onChange={handleRegionChange}>
            <View className={formData.region ? 'picker-value' : 'picker-value ph-color'}>
              {formData.region || '请选择省份'}
            </View>
          </Picker>
        </View>
      </View>

      {/* ── 第三组：账号安全 ── */}
      <Text className='form-group-title'>账号安全</Text>
      <View className='form-group'>
        <View className='apple-list-row'>
          <Text className='form-label'>设置密码 <Text className='required'>*</Text></Text>
          <Input className='form-input' password placeholder='至少8位且包含字母和数字'
            placeholderClass='ph-color' value={formData.password} onInput={update('password')} />
        </View>
        {/* 密码强度指示条 */}
        {formData.password.length > 0 && (
          <View className='strength-bar-wrap'>
            <View className='strength-bar-bg'>
              <View className='strength-bar-fill'
                style={{ width: `${(strength / 3) * 100}%`, backgroundColor: STRENGTH_COLORS[strength] }} />
            </View>
            <Text className='strength-text' style={{ color: STRENGTH_COLORS[strength] }}>
              {STRENGTH_TEXT[strength]}
            </Text>
          </View>
        )}
        <View className='apple-list-row'>
          <Text className='form-label'>确认密码 <Text className='required'>*</Text></Text>
          <Input className='form-input' password placeholder='再次输入密码'
            placeholderClass='ph-color' value={formData.confirmPassword} onInput={update('confirmPassword')} />
        </View>
      </View>

      {/* ── 第四组：业务简介（选填） ── */}
      <Text className='form-group-title'>业务简介 <Text className='optional'>（选填）</Text></Text>
      <View className='form-group'>
        <View className='apple-list-row textarea-row'>
          <Input className='form-input textarea-input' placeholder='请简要介绍您的主营业务...'
            placeholderClass='ph-color' value={formData.businessDescription} onInput={update('businessDescription')} />
        </View>
      </View>

      {/* 错误提示 */}
      {error ? (
        <View className='error-box'>
          <Text className='error-text'>{error}</Text>
        </View>
      ) : null}

      {/* 提交按钮 */}
      <View className='form-footer'>
        <Button className='apple-btn-primary' loading={loading} disabled={loading} onClick={handleSubmit}>
          提交入驻申请
        </Button>
        <View style={{ height: 16 }} />
        <Button className='apple-btn-ghost' onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}>
          已有账号？返回登录
        </Button>
      </View>
    </View>
  )
}
