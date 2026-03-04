import { View, Text, Button, Image, Input, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import { isValidPhone, isNotEmpty } from '@/utils/validate'
import './index.scss'

export default function ReferLandingPage() {
    const [inviterId, setInviterId] = useState<string>('')
    const [tenantId, setTenantId] = useState<string>('')

    // 模拟品牌数据
    const brandInfo = {
        logo: 'https://via.placeholder.com/100x100/0071E3/FFFFFF?text=Logo',
        name: '云端精装',
        slogan: '为您打造理想中的家',
        cases: [
            { img: 'https://via.placeholder.com/400x300/E5E5EA/999999?text=Case1', title: '绿地云都会 120㎡ 现代简约' },
            { img: 'https://via.placeholder.com/400x300/E5E5EA/999999?text=Case2', title: '保利香槟 89㎡ 北欧风情' }
        ]
    }

    const [form, setForm] = useState({ name: '', phone: '', address: '' })
    const [loading, setLoading] = useState(false)

    useLoad((params) => {
        setInviterId(params.inviterId || '')
        setTenantId(params.tenantId || '')
    })

    const update = (field: keyof typeof form) => (e: any) =>
        setForm((prev) => ({ ...prev, [field]: e.detail.value }))

    const handleSubmit = async () => {
        if (!isNotEmpty(form.name)) {
            Taro.showToast({ title: '请输入您的称呼', icon: 'none' })
            return
        }
        if (!isValidPhone(form.phone)) {
            Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
            return
        }

        setLoading(true)
        try {
            // 模拟提交线索
            const payload = {
                ...form,
                inviterId,
                tenantId,
                source: 'REFERRAL'
            }
            // const res = await api.post('/leads', { data: payload })

            setTimeout(() => {
                setLoading(false)
                Taro.showToast({ title: '预约成功，客服将尽快联系您', icon: 'none', duration: 2500 })
                setForm({ name: '', phone: '', address: '' })
            }, 1000)
        } catch (err) {
            setLoading(false)
            Taro.showToast({ title: '网络错误，请重试', icon: 'none' })
        }
    }

    const handleGoHome = () => {
        Taro.switchTab({ url: '/pages/index/index' })
    }

    return (
        <View className="refer-landing-page">
            <ScrollView scrollY className="content-scroll">

                {/* 品牌头图与标题 */}
                <View className="hero-section">
                    <Image className="brand-logo" src={brandInfo.logo} mode="aspectFit" />
                    <Text className="brand-name">{brandInfo.name}</Text>
                    <Text className="brand-slogan">{brandInfo.slogan}</Text>
                </View>

                {/* 预约表单 */}
                <View className="form-card">
                    <Text className="card-title">预约免费量尺与设计</Text>

                    <View className="form-item">
                        <Text className="label">您的称呼</Text>
                        <Input
                            className="input-field"
                            placeholder="如：张先生 / 李女士"
                            value={form.name}
                            onInput={update('name')}
                        />
                    </View>

                    <View className="form-item">
                        <Text className="label">联系电话</Text>
                        <Input
                            className="input-field"
                            type="number"
                            maxlength={11}
                            placeholder="请输入手机号"
                            value={form.phone}
                            onInput={update('phone')}
                        />
                    </View>

                    <View className="form-item">
                        <Text className="label">房屋地址</Text>
                        <Input
                            className="input-field"
                            placeholder="如：北京市朝阳区绿地云都会"
                            value={form.address}
                            onInput={update('address')}
                        />
                    </View>

                    <Button
                        className="submit-btn"
                        loading={loading}
                        disabled={loading}
                        onClick={handleSubmit}
                    >
                        立即预约
                    </Button>

                    <Text className="privacy-text">
                        点击预约即表示您同意我们的《隐私协议》，我们将严格保护您的信息安全。
                    </Text>
                </View>

                {/* 精选案例展示 */}
                <View className="cases-section">
                    <Text className="section-title">精选案例</Text>
                    <View className="case-list">
                        {brandInfo.cases.map((item, idx) => (
                            <View key={idx} className="case-card">
                                <Image className="case-img" src={item.img} mode="aspectFill" />
                                <Text className="case-title">{item.title}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View className="safe-area-bottom" />
            </ScrollView>

            {/* 悬浮主页按钮 */}
            <View className="float-home-btn" onClick={handleGoHome}>
                <Text>返回首页</Text>
            </View>
        </View>
    )
}
