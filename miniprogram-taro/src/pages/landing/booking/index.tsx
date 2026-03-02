/**
 * 租户专属落地页 - 预约表单
 *
 * @description 客户在此填写的表单，直接成为该租户系统内的线索。
 */
import { View, Text, Input, Button, Picker } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { api } from '@/services/api'
import './index.scss'

export default function BookingPage() {
    const [tenantCode, setTenantCode] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    // 表单状态
    const [customerName, setCustomerName] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [region, setRegion] = useState('')
    const [detailAddress, setDetailAddress] = useState('')

    useLoad((options) => {
        if (options.tc) {
            setTenantCode(options.tc)
        } else {
            Taro.showToast({ title: '参数错误', icon: 'error' })
            setTimeout(() => Taro.navigateBack(), 1500)
        }
    })

    // 校验手机号
    const validatePhone = (phone: string) => /^1\d{10}$/.test(phone)

    /** 提交预约表单 */
    const handleSubmit = useCallback(async () => {
        if (!customerName.trim()) return Taro.showToast({ title: '请输入姓名', icon: 'none' })
        if (!validatePhone(customerPhone)) return Taro.showToast({ title: '手机号格式错误', icon: 'none' })
        if (!region) return Taro.showToast({ title: '请选择所在地区', icon: 'none' })

        setLoading(true)
        Taro.showLoading({ title: '提交中...', mask: true })

        try {
            const res = await api.post('/miniprogram/tenant/public-booking', {
                data: {
                    tenantCode,
                    customerName,
                    customerPhone,
                    region,
                    detailAddress,
                },
            })

            Taro.hideLoading()
            if (res.success) {
                setSubmitted(true)
                Taro.showToast({ title: '预约成功', icon: 'success' })
            } else {
                Taro.showToast({ title: res.error || '提交失败', icon: 'none' })
            }
        } catch (e: any) {
            Taro.hideLoading()
            Taro.showToast({ title: e.message || '网络异常', icon: 'none' })
        } finally {
            setLoading(false)
        }
    }, [tenantCode, customerName, customerPhone, region, detailAddress])

    const goBack = () => Taro.navigateBack()

    if (submitted) {
        return (
            <View className='booking-page success-view'>
                <View className='success-icon'>🎉</View>
                <Text className='success-title'>预约成功</Text>
                <Text className='success-desc'>您的信息已提交，我们的专属顾问会尽快与您联系！</Text>
                <Button className='btn-primary mt-xl' onClick={goBack}>
                    返回首页
                </Button>
            </View>
        )
    }

    return (
        <View className='booking-page'>
            <View className='booking-header'>
                <Text className='header-title'>专属预约登记</Text>
                <Text className='header-desc'>留下您的联系方式，体验专业窗帘定制服务</Text>
            </View>

            <View className='form-card'>
                <View className='form-item'>
                    <Text className='form-label'>您的姓名 <Text className='required'>*</Text></Text>
                    <Input
                        className='form-input'
                        placeholder='请输入您的称呼'
                        value={customerName}
                        onInput={(e) => setCustomerName(e.detail.value)}
                    />
                </View>

                <View className='form-item'>
                    <Text className='form-label'>联系电话 <Text className='required'>*</Text></Text>
                    <Input
                        className='form-input'
                        type='number'
                        maxlength={11}
                        placeholder='请输入11位手机号码'
                        value={customerPhone}
                        onInput={(e) => setCustomerPhone(e.detail.value)}
                    />
                </View>

                <View className='form-item'>
                    <Text className='form-label'>所在地区 <Text className='required'>*</Text></Text>
                    <Picker
                        mode='region'
                        onChange={(e) => {
                            // 微信原生 region picker 返回的是 ['省', '市', '区'] 数组
                            setRegion(e.detail.value.join(' '))
                        }}
                    >
                        <View className={`form-input picker-value ${!region ? 'placeholder' : ''}`}>
                            {region || '请选择省/市/区'}
                        </View>
                    </Picker>
                </View>

                <View className='form-item'>
                    <Text className='form-label'>详细地址/小区</Text>
                    <Input
                        className='form-input'
                        placeholder='如：某某小区X栋X单元（选填）'
                        value={detailAddress}
                        onInput={(e) => setDetailAddress(e.detail.value)}
                    />
                </View>
            </View>

            <View className='booking-actions'>
                <Button
                    className='btn-primary'
                    loading={loading}
                    disabled={loading || !customerName || !customerPhone || !region}
                    onClick={handleSubmit}
                >
                    立即提交预约
                </Button>
            </View>
        </View>
    )
}
