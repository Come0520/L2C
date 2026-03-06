import { View, Text, Input, Button, Image, ScrollView, Picker } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { taskService } from '@/services/task-service'
import { useUploadQueue } from '@/hooks/useUploadQueue'
import { useAudioRecord } from '@/hooks/useAudioRecord'
import { api } from '@/services/api'
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
  const [activePlan, setActivePlan] = useState(0)
  const [plans, setPlans] = useState([
    {
      id: 'P1',
      name: '常规方案',
      rooms: [{ id: 'r1', name: '主卧', width: '3.5', height: '2.8', installType: '顶装', note: '窗帘盒预留20cm' }]
    }
  ])
  const [images, setImages] = useState<string[]>([])
  const [videos, setVideos] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  // 是否有历史报价单（需要强校验）
  const [hasExistingQuote, setHasExistingQuote] = useState(false)

  // ── 存储配额 ──────────────────────────────────────
  const [quota, setQuota] = useState<{ usedMB: number; totalMB: number; usagePercent: number } | null>(null)

  // ── 离线上传队列 + 录音 ────────────────────────────
  const uploadQueue = useUploadQueue()
  const audioRecord = useAudioRecord()

  useLoad((params) => {
    setTaskId(params.taskId || 'T-2026-001')
    setHasExistingQuote(params.hasExistingQuote === '1' || String(params.taskId).includes('quote'))
  })

  // 页面加载时拉取存储配额
  useEffect(() => {
    api.get<{ usedMB: number; totalMB: number; usagePercent: number }>('/storage/quota')
      .then(res => { if (res?.data) setQuota(res.data) })
      .catch(() => { /* 静默失败，配额信息非核心功能 */ })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 队列有 pending 项时自动 flush（网络良好时上传）
  useEffect(() => {
    const pendingCount = uploadQueue.items.filter(i => i.status === 'pending').length
    if (pendingCount > 0) {
      uploadQueue.flush()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadQueue.items.length])

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

  // 拍照：压缩模式，加入上传队列
  const takePhoto = () => {
    Taro.chooseMedia({
      count: 9 - images.length,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const newPaths = res.tempFiles.map(f => f.tempFilePath)
        setImages((prev) => [...prev, ...newPaths].slice(0, 9))
        // 加入离线上传队列
        newPaths.forEach(path => {
          uploadQueue.enqueue({ localPath: path, uploadUrl: '/upload', type: 'image' })
        })
      }
    })
  }

  // 录像：最长30秒，最多3段，加入队列
  const takeVideo = () => {
    if (videos.length >= 3) return
    Taro.chooseMedia({
      count: 3 - videos.length,
      mediaType: ['video'],
      maxDuration: 30,
      sourceType: ['camera', 'album'],
      success: (res) => {
        const newPaths = res.tempFiles.map(f => f.tempFilePath)
        setVideos((prev) => [...prev, ...newPaths].slice(0, 3))
        newPaths.forEach(path => {
          uploadQueue.enqueue({ localPath: path, uploadUrl: '/upload', type: 'video' })
        })
      }
    })
  }

  // 录音：开始/停止，完成后加入队列
  const handleAudioToggle = () => {
    if (audioRecord.isRecording) {
      audioRecord.stop()
    } else {
      audioRecord.start()
    }
  }

  // 监听录音完成 → 加入上传队列
  useEffect(() => {
    if (audioRecord.audioPath) {
      uploadQueue.enqueue({
        localPath: audioRecord.audioPath,
        uploadUrl: '/upload',
        type: 'audio',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioRecord.audioPath])

  const handleSubmit = async () => {
    if (!isCheckedIn) {
      Taro.showToast({ title: '请先完成上门打卡', icon: 'none' })
      return
    }
    // 有历史报价单时，强制校验每个空间的备注、安装方式和照片
    if (hasExistingQuote) {
      const currentRooms = plans[activePlan].rooms
      const allNotesFilled = currentRooms.every(r => r.note && r.note.trim() !== '')
      const allInstallFilled = currentRooms.every(r => r.installType && r.installType.trim() !== '')
      if (!allNotesFilled || !allInstallFilled || images.length === 0) {
        Taro.showToast({ title: '有历史报价单，请填写完整备注、安装方式并上传至少1张照片', icon: 'none' })
        return
      }
    }
    setLoading(true)
    try {
      await taskService.submitMeasureData(_taskId, { plans, images, videos })
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

      {/* 存储配额进度条 */}
      {quota && (
        <View className="storage-bar">
          <View className="storage-info-row">
            <Text className="storage-label">📦 存储空间</Text>
            <Text className="storage-text">{quota.usedMB} / {quota.totalMB} MB</Text>
            <Text className={`storage-percent ${quota.usagePercent > 80 ? 'danger' : ''}`}>
              {quota.usagePercent}%
            </Text>
          </View>
          <View className="storage-track">
            <View
              className={`storage-fill ${quota.usagePercent > 80 ? 'danger' : quota.usagePercent > 60 ? 'warn' : ''}`}
              style={{ width: `${Math.min(quota.usagePercent, 100)}%` }}
            />
          </View>
        </View>
      )}

      {/* 上传队列状态提示 */}
      {uploadQueue.items.length > 0 && (() => {
        const pending = uploadQueue.items.filter(i => i.status === 'pending').length
        const uploading = uploadQueue.items.filter(i => i.status === 'uploading').length
        const failed = uploadQueue.items.filter(i => i.status === 'failed').length
        const uploaded = uploadQueue.items.filter(i => i.status === 'uploaded').length
        return (
          <View className="upload-status-bar">
            {(uploading > 0 || pending > 0) && (
              <Text className="upload-hint syncing">↑ 上传中 {uploading + pending} 个文件...</Text>
            )}
            {uploaded > 0 && pending === 0 && uploading === 0 && failed === 0 && (
              <Text className="upload-hint success">✓ 全部上传完成 ({uploaded} 个)</Text>
            )}
            {failed > 0 && (
              <View className="upload-failed-row">
                <Text className="upload-hint fail">⚠ {failed} 个上传失败</Text>
                <Text className="retry-btn" onClick={uploadQueue.retryFailed}>重试</Text>
              </View>
            )}
          </View>
        )
      })()}

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
          <Text className='section-subtitle'>照片必选，视频选填（≤30秒/段，最多3段）</Text>

          {/* 照片区 */}
          <View className='images-grid'>
            {images.map((img, i) => (
              <View key={i} className="media-wrapper">
                <Image className='photo-thumb' src={img} mode='aspectFill' />
              </View>
            ))}
            {images.length < 9 && (
              <View className='photo-add' onClick={takePhoto}>
                <Text className='photo-add-icon'>📸 拍照</Text>
              </View>
            )}
          </View>

          {/* 录像区 */}
          <View className='media-actions'>
            {videos.length < 3 && (
              <View className='video-add' onClick={takeVideo}>
                <Text className='video-add-icon'>🎬 录像</Text>
              </View>
            )}
            {videos.map((_vid, i) => (
              <View key={i} className="media-wrapper">
                <Text className='video-label'>视频 {i + 1}</Text>
              </View>
            ))}
          </View>

          {/* 录音区 — 语音备注 */}
          <View className="audio-section">
            <Text className="section-title-small">🎤 语音备注（≤180秒）</Text>
            <Button
              className={`audio-btn ${audioRecord.isRecording ? 'recording' : ''}`}
              onClick={handleAudioToggle}
            >
              {audioRecord.isRecording
                ? `⏹ 停止录音（${audioRecord.duration}s）`
                : '▶ 开始录音'}
            </Button>
            {audioRecord.audioPath && !audioRecord.isRecording && (
              <Text className="audio-done">✓ 录音完成（{audioRecord.duration}秒），已加入上传队列</Text>
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
