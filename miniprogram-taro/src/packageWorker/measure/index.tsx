import { View, Text, Input, Button, Image, ScrollView, Picker } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { taskService } from '@/services/task-service'
import './index.scss'

interface RoomMeasure {
  id: string;
  name: string;
  width: string;
  height: string;
  installType: string;
  note: string
}

export default function MeasurePage() {
  const [_taskId, setTaskId] = useState('')
  const [activePlan, setActivePlan] = useState(0) // 0: 方案一, 1: 方案二
  const [plans, setPlans] = useState([
    {
      id: 'P1',
      name: '常规方案',
      rooms: [{ id: 'r1', name: '主卧', width: '3.5', height: '2.8', installType: '顶装', note: '窗帘盒预留20cm' }]
    }
  ])
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [isCheckedIn, setIsCheckedIn] = useState(false)

  useLoad((params) => { setTaskId(params.taskId || 'T-2026-001') })

  const handleCheckIn = async () => {
    Taro.showLoading({ title: '定位打卡中...' })
    try {
      // 模拟获取定位并打卡
      await taskService.checkIn(_taskId, { latitude: 39.9, longitude: 116.4, address: '北京市朝阳区绿地云都会' })
      Taro.hideLoading()
      Taro.showToast({ title: '打卡成功', icon: 'success' })
      setIsCheckedIn(true)
    } catch (err: any) {
      Taro.hideLoading()
      Taro.showToast({ title: err.message || '打卡失败', icon: 'none' })
    }
  }

  const addPlan = () => {
    const newPlan = {
      id: `P${plans.length + 1}`,
      name: `备选方案${plans.length}`,
      rooms: [{ id: `r${Date.now()}`, name: '', width: '', height: '', installType: '顶装', note: '' }]
    }
    setPlans(prev => [...prev, newPlan])
    setActivePlan(plans.length)
  }

  const addRoom = () => {
    const newPlans = [...plans]
    newPlans[activePlan].rooms.push({ id: `r${Date.now()}`, name: '', width: '', height: '', installType: '顶装', note: '' })
    setPlans(newPlans)
  }

  const updateRoom = (rIndex: number, field: keyof RoomMeasure) => (e: any) => {
    const val = typeof e === 'string' ? e : e.detail.value
    const newPlans = [...plans]
    newPlans[activePlan].rooms[rIndex] = { ...newPlans[activePlan].rooms[rIndex], [field]: val }
    setPlans(newPlans)
  }

  const takePhoto = () => {
    Taro.chooseMedia({
      count: 9 - images.length,
      mediaType: ['image', 'video'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        setImages((prev) => [...prev, ...res.tempFiles.map(f => f.tempFilePath)].slice(0, 9))
      }
    })
  }

  const handleSubmit = async () => {
    if (!isCheckedIn) {
      Taro.showToast({ title: '请先完成上门打卡', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      await taskService.submitMeasureData(_taskId, { plans, images })
      setLoading(false)
      Taro.showToast({ title: '数据已回传报价单', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1500)
    } catch (err: any) {
      setLoading(false)
      Taro.showToast({ title: err.message || '提交失败', icon: 'none' })
    }
  }

  const installTypes = ['顶装', '侧装', '罗马杆', '轨道']

  return (
    <View className='worker-measure-page'>
      {/* 顶部打卡栏 */}
      <View className={`checkin-bar ${isCheckedIn ? 'checked' : ''}`}>
        <View className="info">
          <Text className="title">{isCheckedIn ? '打卡成功' : '到达客户现场'}</Text>
          <Text className="time">{isCheckedIn ? '14:05:32 (朝阳区绿地云都会)' : '请在客户家门口打卡'}</Text>
        </View>
        <Button className="btn" onClick={handleCheckIn} disabled={isCheckedIn}>
          {isCheckedIn ? '已打卡' : '实地打卡'}
        </Button>
      </View>

      {/* 方案切换 */}
      <View className="plan-tabs">
        <ScrollView scrollX className="tabs-scroll" showScrollbar={false}>
          {plans.map((p, idx) => (
            <View
              key={p.id}
              className={`tab-item ${activePlan === idx ? 'active' : ''}`}
              onClick={() => setActivePlan(idx)}
            >
              {p.name}
            </View>
          ))}
          <View className="tab-item add-btn" onClick={addPlan}>+ 新增方案</View>
        </ScrollView>
      </View>

      <ScrollView className="content-scroll" scrollY>
        {plans[activePlan].rooms.map((room, rIndex) => (
          <View key={room.id} className='room-card card'>
            <View className="card-header">
              <Text className='room-index'># 空间 {rIndex + 1}</Text>
            </View>

            <View className='form-section'>
              <Text className='form-label'>空间名称</Text>
              <Input className='form-input' placeholder='如：主卧、客厅' value={room.name} onInput={updateRoom(rIndex, 'name')} />
            </View>

            <View className='measure-row'>
              <View className='measure-field'>
                <Text className='form-label'>测量宽度(m)</Text>
                <Input className='form-input' type='digit' placeholder='0.00' value={room.width} onInput={updateRoom(rIndex, 'width')} />
              </View>
              <Text className='measure-x'>×</Text>
              <View className='measure-field'>
                <Text className='form-label'>测量高度(m)</Text>
                <Input className='form-input' type='digit' placeholder='0.00' value={room.height} onInput={updateRoom(rIndex, 'height')} />
              </View>
            </View>

            <View className='form-section'>
              <Text className='form-label'>安装方式</Text>
              <Picker mode='selector' range={installTypes} onChange={(e) => updateRoom(rIndex, 'installType')(installTypes[e.detail.value])}>
                <View className='picker-input'>
                  <Text>{room.installType || '请选择'}</Text>
                  <Text className="chevron">▼</Text>
                </View>
              </Picker>
            </View>

            <View className='form-section'>
              <Text className='form-label'>师傅特记备注</Text>
              <Input className='form-input' placeholder='发现窗户不方正等特殊情况说明' value={room.note} onInput={updateRoom(rIndex, 'note')} />
            </View>
          </View>
        ))}

        <View className='btn-add-room' onClick={addRoom}>
          <Text>+ 继续添加空间</Text>
        </View>

        {/* 现场素材录入 */}
        <View className='media-section'>
          <Text className='section-title'>录制现场素材</Text>
          <Text className='section-subtitle'>支持上传照片、环绕视频，助力销售成单</Text>

          <View className='images-grid'>
            {images.map((img, i) => (
              <View key={i} className="media-wrapper">
                <Image className='photo-thumb' src={img} mode='aspectFill' />
              </View>
            ))}
            {images.length < 9 && (
              <View className='photo-add' onClick={takePhoto}>
                <Text className='photo-add-icon'>📸 拍素材</Text>
              </View>
            )}
          </View>
        </View>

        <View className="safe-bottom-space"></View>
      </ScrollView>

      <View className='bottom-action-bar'>
        <Button className='btn-submit' loading={loading} disabled={loading} onClick={handleSubmit}>
          一键回传系统报价单
        </Button>
      </View>
    </View>
  )
}
