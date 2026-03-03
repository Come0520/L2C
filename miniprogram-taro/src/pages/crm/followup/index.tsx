/**
 * 跟进记录 — 添加页
 */
import { View, Text, Textarea, Button } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import { isNotEmpty } from '@/utils/validate'
import './index.scss'

const FOLLOW_TYPES = ['电话', '拜访', '微信', '其他']

export default function FollowupPage() {
  const [customerId, setCustomerId] = useState('')
  const [type, setType] = useState('电话')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  useLoad((params) => { setCustomerId(params.id) })

  const TYPE_MAPPING: Record<string, string> = {
    '电话': 'PHONE',
    '拜访': 'VISIT',
    '微信': 'WECHAT',
    '其他': 'OTHER'
  }

  const handleSubmit = async () => {
    if (!isNotEmpty(content)) { Taro.showToast({ title: '请填写跟进内容', icon: 'none' }); return }
    setLoading(true)
    try {
      // 核心修复 F-01 (content -> description) & F-02 (类型映射)
      const mappedType = TYPE_MAPPING[type] || 'OTHER'
      const res = await api.post('/crm/activities', {
        data: { customerId, type: mappedType, description: content }
      })
      if (res.success) { Taro.showToast({ title: '提交成功', icon: 'success' }); setTimeout(() => Taro.navigateBack(), 1500) }
      else { Taro.showToast({ title: res.error || '提交失败', icon: 'none' }) }
    } finally { setLoading(false) }
  }

  return (
    <View className='followup-page'>
      <View className='type-section'>
        <Text className='form-label'>跟进方式</Text>
        <View className='type-options'>
          {FOLLOW_TYPES.map((t) => (
            <View key={t}
              className={`type-option ${type === t ? 'type-option--active' : ''}`}
              onClick={() => setType(t)}>
              <Text>{t}</Text>
            </View>
          ))}
        </View>
      </View>
      <View className='content-section'>
        <Text className='form-label'>跟进内容 *</Text>
        <Textarea className='form-textarea' placeholder='请描述本次跟进情况...' value={content}
          onInput={(e) => setContent(e.detail.value)} maxlength={500} />
        <Text className='char-count'>{content.length}/500</Text>
      </View>
      <View className='form-footer'>
        <Button className='btn-submit' loading={loading} disabled={loading} onClick={handleSubmit}>提交跟进</Button>
      </View>
    </View>
  )
}
