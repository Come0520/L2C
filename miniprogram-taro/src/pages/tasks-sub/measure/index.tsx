/**
 * 量尺记录页（Worker 专属）
 */
import { View, Text, Input, Textarea, Button, Image } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import './index.scss'

interface RoomMeasure { name: string; width: string; height: string; note: string }

export default function MeasurePage() {
  const [taskId, setTaskId] = useState('')
  const [rooms, setRooms] = useState<RoomMeasure[]>([{ name: '', width: '', height: '', note: '' }])
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useLoad((params) => { setTaskId(params.taskId || '') })

  const addRoom = () => setRooms((prev) => [...prev, { name: '', width: '', height: '', note: '' }])

  const updateRoom = (index: number, field: keyof RoomMeasure) => (e: any) => {
    const val = e.detail.value
    setRooms((prev) => prev.map((r, i) => i === index ? { ...r, [field]: val } : r))
  }

  const takePhoto = () => {
    Taro.chooseImage({
      count: 9 - images.length, sizeType: ['compressed'], sourceType: ['camera', 'album'],
      success: (res) => setImages((prev) => [...prev, ...res.tempFilePaths].slice(0, 9)),
    })
  }

  const handleSubmit = async () => {
    if (rooms.some((r) => !r.name || !r.width || !r.height)) {
      Taro.showToast({ title: '请填写完整量尺数据', icon: 'none' }); return
    }
    setLoading(true)
    try {
      const res = await api.post(`/tasks/${taskId}/measure`, { data: { rooms, images } })
      if (res.success) {
        Taro.showToast({ title: '提交成功', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 1500)
      } else { Taro.showToast({ title: res.error || '提交失败', icon: 'none' }) }
    } finally { setLoading(false) }
  }

  return (
    <View className='measure-page'>
      <Text className='page-hint'>请逐个房间录入窗帘尺寸数据</Text>
      {rooms.map((room, i) => (
        <View key={i} className='room-card card'>
          <Text className='room-index'>房间 {i + 1}</Text>
          <View className='form-section'><Text className='form-label'>房间名称</Text>
            <Input className='form-input' placeholder='如：主卧、客厅' value={room.name} onInput={updateRoom(i, 'name')} /></View>
          <View className='measure-row'>
            <View className='measure-field'><Text className='form-label'>宽度(m)</Text>
              <Input className='form-input' type='digit' placeholder='0.00' value={room.width} onInput={updateRoom(i, 'width')} /></View>
            <Text className='measure-x'>×</Text>
            <View className='measure-field'><Text className='form-label'>高度(m)</Text>
              <Input className='form-input' type='digit' placeholder='0.00' value={room.height} onInput={updateRoom(i, 'height')} /></View>
          </View>
          <View className='form-section'><Text className='form-label'>备注</Text>
            <Input className='form-input' placeholder='特殊情况说明' value={room.note} onInput={updateRoom(i, 'note')} /></View>
        </View>
      ))}
      <View className='btn-add-room' onClick={addRoom}><Text>+ 添加房间</Text></View>

      {/* 拍照 */}
      <View className='photo-section'>
        <Text className='section-title'>现场照片</Text>
        <View className='images-grid'>
          {images.map((img, i) => (<Image key={i} className='photo-thumb' src={img} mode='aspectFill' />))}
          {images.length < 9 && (
            <View className='photo-add' onClick={takePhoto}><Text className='photo-add-icon'>📷</Text></View>
          )}
        </View>
      </View>

      <View className='form-footer'>
        <Button className='btn-submit' loading={loading} disabled={loading} onClick={handleSubmit}>提交量尺数据</Button>
      </View>
    </View>
  )
}
