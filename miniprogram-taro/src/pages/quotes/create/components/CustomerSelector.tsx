import { View, Text, Picker } from '@tarojs/components'
import { useState } from 'react'
import { api } from '@/services/api'
import { useLoad } from '@tarojs/taro'
import './CustomerSelector.scss'

interface Customer {
    id: string
    name: string
    phone?: string
}

interface Props {
    value?: string
    name?: string
    onChange: (customer: Customer) => void
}

export default function CustomerSelector({ value, name, onChange }: Props) {
    const [customers, setCustomers] = useState<Customer[]>([])

    // 简单实现：初始化加载客户列表 (TODO: 后续可以改为支持搜索的分页列表或者专门的选择页)
    useLoad(async () => {
        try {
            const res = await api.get('/crm/customers', { data: { page: 1, limit: 100 } })
            if (res.success) {
                setCustomers(res.data.items || [])
            }
        } catch (e) {
            console.error('加载客户失败', e)
        }
    })

    const handleChange = (e: any) => {
        const idx = e.detail.value
        if (customers[idx]) {
            onChange(customers[idx])
        }
    }

    // 计算当前显示的文本
    const displayText = name || (value ? '已选择客户' : '请选择客户')

    return (
        <Picker mode='selector' range={customers} rangeKey='name' onChange={handleChange}>
            <View className={`customer-selector ${!value ? 'placeholder' : ''}`}>
                <Text>{displayText}</Text>
            </View>
        </Picker>
    )
}
