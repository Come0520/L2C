/**
 * 线索创建页
 */
import { View, Text, Input, Textarea, Button, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import { isValidPhone, isNotEmpty } from '@/utils/validate'
import './index.scss'

const INTENTION_LEVELS = [
  { label: '高意向', value: 'HIGH' },
  { label: '中意向', value: 'MEDIUM' },
  { label: '低意向', value: 'LOW' }
]

export default function LeadsCreatePage() {
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerWechat: '',
    source: '',
    community: '',
    houseType: '',
    address: '',
    remark: '',
    intentionLevel: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!isNotEmpty(form.customerName)) {
      Taro.showToast({ title: '请填写客户姓名', icon: 'none' })
      return
    }
    if (!isNotEmpty(form.customerPhone)) {
      Taro.showToast({ title: '请填写手机号', icon: 'none' })
      return
    }
    if (form.customerPhone && !isValidPhone(form.customerPhone)) {
      Taro.showToast({ title: '请输入正确的手机号码', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        // 这里模拟如果没有传复杂的渠道层级（sourceCategoryId），由后端兜底或传固定默认值
        // 但前端需如实上送这些字段避免 validation 失败。此处的 source 会被 Web API 作为 sourceDetail 或其他字段捕获
      }

      const res = await api.post('/leads', { data: payload })
      if (res.success) {
        Taro.showToast({ title: '创建成功', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 1500)
      } else {
        Taro.showToast({ title: res.error || '创建失败', icon: 'none' })
      }
    } finally {
      setLoading(false)
    }
  }

  const update = (field: keyof typeof form) => (e: any) =>
    setForm((prev) => ({ ...prev, [field]: e.detail.value }))

  const handleIntentionChange = (e: any) => {
    setForm((prev) => ({ ...prev, intentionLevel: INTENTION_LEVELS[e.detail.value].value }))
  }

  const currentIntentionLabel = INTENTION_LEVELS.find(lvl => lvl.value === form.intentionLevel)?.label || '请选择'

  return (
    <View className='create-page'>
      <View className='form-section'>
        <Text className='form-label'>客户姓名 *</Text>
        <Input className='form-input' placeholder='请输入' value={form.customerName} onInput={update('customerName')} />
      </View>
      <View className='form-section'>
        <Text className='form-label'>手机号 *</Text>
        <Input className='form-input' type='number' maxlength={11} placeholder='请输入' value={form.customerPhone} onInput={update('customerPhone')} />
      </View>
      <View className='form-section'>
        <Text className='form-label'>微信号</Text>
        <Input className='form-input' placeholder='微信号/同手机' value={form.customerWechat} onInput={update('customerWechat')} />
      </View>
      <View className='form-section'>
        <Text className='form-label'>意向等级</Text>
        <Picker mode='selector' range={INTENTION_LEVELS} rangeKey='label' onChange={handleIntentionChange}>
          <View className={`picker-value ${!form.intentionLevel ? 'placeholder' : ''}`}>
            {currentIntentionLabel}
          </View>
        </Picker>
      </View>
      <View className='form-section'>
        <Text className='form-label'>来源渠道（明细）</Text>
        <Input className='form-input' placeholder='如：门店到访、朋友介绍' value={form.source} onInput={update('source')} />
      </View>
      <View className='form-section'>
        <Text className='form-label'>小区</Text>
        <Input className='form-input' placeholder='所在小区' value={form.community} onInput={update('community')} />
      </View>
      <View className='form-section'>
        <Text className='form-label'>户型</Text>
        <Input className='form-input' placeholder='例如三室二厅' value={form.houseType} onInput={update('houseType')} />
      </View>
      <View className='form-section'>
        <Text className='form-label'>详细地址</Text>
        <Input className='form-input' placeholder='客户地址' value={form.address} onInput={update('address')} />
      </View>
      <View className='form-section'>
        <Text className='form-label'>备注</Text>
        <Textarea className='form-textarea' placeholder='备注信息' value={form.remark} onInput={update('remark')} />
      </View>
      <View className='form-footer'>
        <Button className='btn-submit' loading={loading} disabled={loading} onClick={handleSubmit}>
          提交线索
        </Button>
      </View>
    </View>
  )
}
