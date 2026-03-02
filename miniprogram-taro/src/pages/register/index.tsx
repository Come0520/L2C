import { View, Text, Input, Button, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import './index.scss'

const REGIONS = [
  '北京市', '上海市', '天津市', '重庆市', '浙江省', '江苏省', '广东省', '福建省', '山东省', '河南省', '河北省',
  '湖南省', '湖北省', '四川省', '安徽省', '辽宁省', '吉林省', '黑龙江省', '山西省', '陕西省', '甘肃省', '云南省',
  '贵州省', '江西省', '海南省', '青海省', '内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区'
]

export default function RegisterPage() {
  const [form, setForm] = useState({
    companyName: '',
    applicantName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    region: '',
    businessDescription: ''
  })
  const [loading, setLoading] = useState(false)

  const update = (field: keyof typeof form) => (e: any) =>
    setForm((prev) => ({ ...prev, [field]: e.detail.value }))

  const handleRegionChange = (e: any) => {
    setForm((prev) => ({ ...prev, region: REGIONS[e.detail.value] }))
  }

  const handleSubmit = async () => {
    if (!form.companyName || !form.applicantName || !form.phone || !form.password || !form.confirmPassword || !form.region) {
      Taro.showToast({ title: '请填写全部必填项', icon: 'none' }); return
    }
    if (form.password !== form.confirmPassword) {
      Taro.showToast({ title: '两次输入的密码不一致', icon: 'none' }); return
    }
    if (form.password.length < 8 || !/(?=.*[a-zA-Z])(?=.*\d)/.test(form.password)) {
      Taro.showToast({ title: '密码至少8位且包含字母和数字', icon: 'none' }); return
    }

    setLoading(true)
    try {
      // 提交到新对齐的租户小程式注册后端 API
      const res = await api.post('/miniprogram/tenant/register', { data: form })
      if (res.success) {
        Taro.navigateTo({ url: '/pages/status/index' })
      } else {
        Taro.showToast({ title: res.error || '申请失败', icon: 'none' })
      }
    } finally { setLoading(false) }
  }

  return (
    <View className='register-page'>
      <View className='page-header'>
        <Text className='page-title'>企业入驻</Text>
        <Text className='page-desc'>填写以下信息申请开通 L2C 智能销售管理系统。我们将为您初始化独立的业务企业租户。</Text>
      </View>

      <View className='form-group-title'><Text>基础信息</Text></View>
      <View className='form-group'>
        <View className='form-row'>
          <Text className='form-label'>企业名称</Text>
          <Input className='form-input' placeholder='请输入企业全称' placeholderClass='ph-color' value={form.companyName} onInput={update('companyName')} />
        </View>
        <View className='form-divider' />
        <View className='form-row'>
          <Text className='form-label'>联系人</Text>
          <Input className='form-input' placeholder='您的姓名' placeholderClass='ph-color' value={form.applicantName} onInput={update('applicantName')} />
        </View>
        <View className='form-divider' />
        <View className='form-row'>
          <Text className='form-label'>手机号</Text>
          <Input className='form-input' type='number' maxlength={11} placeholder='作为登录账号' placeholderClass='ph-color' value={form.phone} onInput={update('phone')} />
        </View>
        <View className='form-divider' />
        <View className='form-row'>
          <Text className='form-label'>所在地区</Text>
          <Picker className='form-input picker-input' mode='selector' range={REGIONS} onChange={handleRegionChange}>
            <View className={form.region ? '' : 'ph-color'}>
              {form.region || '请选择省份'}
            </View>
          </Picker>
        </View>
      </View>

      <View className='form-group-title'><Text>安全保护</Text></View>
      <View className='form-group'>
        <View className='form-row'>
          <Text className='form-label'>设置密码</Text>
          <Input className='form-input' password placeholder='至少8位含字母数字' placeholderClass='ph-color' value={form.password} onInput={update('password')} />
        </View>
        <View className='form-divider' />
        <View className='form-row'>
          <Text className='form-label'>确认密码</Text>
          <Input className='form-input' password placeholder='请再次输入密码' placeholderClass='ph-color' value={form.confirmPassword} onInput={update('confirmPassword')} />
        </View>
      </View>

      <View className='form-group-title'><Text>补充说明</Text></View>
      <View className='form-group'>
        <View className='form-row'>
          <Text className='form-label'>业务简介</Text>
          <Input className='form-input' placeholder='简要介绍主营业务 (选填)' placeholderClass='ph-color' value={form.businessDescription} onInput={update('businessDescription')} />
        </View>
      </View>

      <View className='form-footer'>
        <Button className='btn-submit' loading={loading} disabled={loading} onClick={handleSubmit}>
          提交入驻申请
        </Button>
      </View>
    </View>
  )
}
