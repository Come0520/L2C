'use client';

import { Camera, Image as ImageIcon, Trash2, Tag, Move, Check, AlertCircle } from 'lucide-react';
import React, { useState, useRef } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card';
import { PaperFileUpload } from '@/components/ui/paper-file-upload';
import { PaperInput } from '@/components/ui/paper-input';
import { PaperModal } from '@/components/ui/paper-modal';
import { PaperSelect } from '@/components/ui/paper-select';
import { toast } from '@/components/ui/toast';

/**
 * 照片类型枚举
 */
export type PhotoType = 'room_overview' | 'detail' | 'problem' | 'before' | 'after' | 'other';

/**
 * 测量照片接口
 */
export interface MeasurementPhoto {
  /**
   * 照片ID
   */
  id?: string;
  /**
   * 文件名
   */
  filename: string;
  /**
   * 原始文件名
   */
  originalName: string;
  /**
   * 文件URL
   */
  url: string;
  /**
   * 缩略图URL
   */
  thumbnailUrl?: string;
  /**
   * 照片类型
   */
  photoType: PhotoType;
  /**
   * 房间名称
   */
  roomName: string;
  /**
   * 描述
   */
  description?: string;
  /**
   * 拍摄位置
   */
  location?: string;
  /**
   * 拍摄时间
   */
  takenAt?: string;
  /**
   * 尺寸（像素）
   */
  dimensions?: { width: number; height: number };
  /**
   * 文件大小（字节）
   */
  size: number;
  /**
   * 是否已上传到服务器
   */
  isUploaded?: boolean;
  /**
   * 标注信息
   */
  annotations?: Array<{
    id: string;
    type: 'text' | 'rectangle' | 'arrow';
    content: string;
    position: { x: number; y: number };
    color: string;
  }>;
}

/**
 * 测量照片上传器属性
 */
interface MeasurementPhotoUploaderProps {
  /**
   * 当前照片列表
   */
  photos: MeasurementPhoto[];
  /**
   * 照片变化回调
   */
  onPhotosChange: (photos: MeasurementPhoto[]) => void;
  /**
   * 房间列表
   */
  rooms: string[];
  /**
   * 最大文件大小（MB）
   */
  maxFileSizeMB?: number;
  /**
   * 最大照片数量
   */
  maxPhotos?: number;
  /**
   * 上传中状态
   */
  isUploading?: boolean;
  /**
   * 上传进度
   */
  uploadProgress?: number;
  /**
   * 上传完成回调
   */
  onUploadComplete?: (photos: MeasurementPhoto[]) => void;
}

/**
 * 照片类型选项
 */
const PHOTO_TYPE_OPTIONS = [
  { value: 'room_overview', label: '房间全景', icon: <Camera className="h-4 w-4" /> },
  { value: 'detail', label: '细节照片', icon: <ImageIcon className="h-4 w-4" /> },
  { value: 'problem', label: '问题照片', icon: <AlertCircle className="h-4 w-4" /> },
  { value: 'before', label: '施工前', icon: <ImageIcon className="h-4 w-4" /> },
  { value: 'after', label: '施工后', icon: <ImageIcon className="h-4 w-4" /> },
  { value: 'other', label: '其他', icon: <ImageIcon className="h-4 w-4" /> }
];

/**
 * 测量照片上传器组件
 * 用于上传和管理测量照片，支持房间分类、照片类型、压缩和标注功能
 */
export const MeasurementPhotoUploader: React.FC<MeasurementPhotoUploaderProps> = ({
  photos = [],
  onPhotosChange,
  rooms = [],
  maxFileSizeMB = 5,
  maxPhotos = 50,
  isUploading = false,
  uploadProgress = 0,
  onUploadComplete
}) => {
  // 状态管理
  const [selectedRoom, setSelectedRoom] = useState(rooms[0] || '');
  const [selectedPhotoType, setSelectedPhotoType] = useState<PhotoType>('room_overview');
  const [description, setDescription] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<MeasurementPhoto | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [currentAnnotationPhoto, setCurrentAnnotationPhoto] = useState<MeasurementPhoto | null>(null);
  const [annotations, setAnnotations] = useState<Array<{
    id: string;
    type: 'text' | 'rectangle' | 'arrow';
    content: string;
    position: { x: number; y: number };
    color: string;
  }>>([]);
  const [sorting, setSorting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 压缩图片
   */
  const compressImage = async (file: File, quality = 0.8, maxWidth = 1920, maxHeight = 1080): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          // 计算压缩后的尺寸，保持宽高比
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          
          // 创建Canvas并绘制压缩后的图片
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法创建Canvas上下文'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // 转换为Blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('图片压缩失败'));
                return;
              }
              
              // 创建压缩后的文件
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            },
            file.type,
            quality
          );
        };
        img.onerror = () => {
          reject(new Error('图片加载失败'));
        };
      };
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
    });
  };

  /**
   * 照片文件转测量照片对象
   */
  const fileToMeasurementPhoto = (file: File, roomName: string, photoType: PhotoType): MeasurementPhoto => {
    return {
      filename: file.name,
      originalName: file.name,
      url: URL.createObjectURL(file),
      photoType,
      roomName,
      size: file.size,
      takenAt: new Date().toISOString(),
      isUploaded: false
    };
  };

  /**
   * 处理照片上传
   */
  const handlePhotoUpload = async (files: File[]) => {
    if (photos.length + files.length > maxPhotos) {
      toast.error(`最多只能上传 ${maxPhotos} 张照片`);
      return;
    }

    try {
      // 处理每个文件，进行自动压缩
      const newPhotos: MeasurementPhoto[] = await Promise.all(
        files.map(async (file) => {
          // 自动压缩图片
          let processedFile = file;
          // 只压缩大于1MB的图片
          if (file.size > 1024 * 1024) {
            processedFile = await compressImage(file, 0.7, 1280, 720);
          } else if (file.size > 512 * 1024) {
            processedFile = await compressImage(file, 0.8, 1920, 1080);
          }
          
          return fileToMeasurementPhoto(processedFile, selectedRoom, selectedPhotoType);
        })
      );

      // 更新照片列表
      const updatedPhotos = [...photos, ...newPhotos];
      onPhotosChange(updatedPhotos);

      // 清空表单
      setSelectedRoom(rooms[0] || '');
      setSelectedPhotoType('room_overview');
      setDescription('');

      toast.success(`成功添加 ${newPhotos.length} 张照片，已自动压缩`);
    } catch (error) {
      console.error('处理照片失败:', error);
      toast.error('处理照片失败，请重试');
    }
  };

  /**
   * 处理照片删除
   */
  const handlePhotoDelete = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(updatedPhotos);
    toast.success('照片已删除');
  };

  /**
   * 处理照片类型更改
   */
  const handlePhotoTypeChange = (index: number, photoType: PhotoType) => {
    const updatedPhotos = [...photos];
    updatedPhotos[index].photoType = photoType;
    onPhotosChange(updatedPhotos);
  };

  /**
   * 处理房间更改
   */
  const handleRoomChange = (index: number, roomName: string) => {
    const updatedPhotos = [...photos];
    updatedPhotos[index].roomName = roomName;
    onPhotosChange(updatedPhotos);
  };

  /**
   * 处理照片描述更改
   */
  const handleDescriptionChange = (index: number, description: string) => {
    const updatedPhotos = [...photos];
    updatedPhotos[index].description = description;
    onPhotosChange(updatedPhotos);
  };

  /**
   * 处理照片预览
   */
  const handlePhotoPreview = (photo: MeasurementPhoto) => {
    setPreviewPhoto(photo);
    setShowPreview(true);
  };

  /**
   * 处理照片标注
   */
  const handlePhotoAnnotation = (photo: MeasurementPhoto) => {
    setCurrentAnnotationPhoto(photo);
    setAnnotations(photo.annotations || []);
    setShowAnnotationModal(true);
  };

  /**
   * 保存标注
   */
  const saveAnnotations = () => {
    if (!currentAnnotationPhoto) return;

    const updatedPhotos = photos.map(photo => 
      photo.id === currentAnnotationPhoto.id || photo.url === currentAnnotationPhoto.url
        ? { ...photo, annotations }
        : photo
    );

    onPhotosChange(updatedPhotos);
    setShowAnnotationModal(false);
    setCurrentAnnotationPhoto(null);
    setAnnotations([]);
    toast.success('标注已保存');
  };

  /**
   * 处理照片拖拽开始
   */
  const handleDragStart = (index: number) => {
    setSorting(true);
    setDraggedIndex(index);
  };

  /**
   * 处理照片拖拽结束
   */
  const handleDragEnd = () => {
    setSorting(false);
    setDraggedIndex(null);
  };

  /**
   * 处理照片拖拽放置
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  /**
   * 处理照片拖拽进入
   */
  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updatedPhotos = [...photos];
    const draggedPhoto = updatedPhotos[draggedIndex];
    updatedPhotos.splice(draggedIndex, 1);
    updatedPhotos.splice(index, 0, draggedPhoto);
    onPhotosChange(updatedPhotos);
    setDraggedIndex(index);
  };

  /**
   * 按房间分组照片
   */
  const groupPhotosByRoom = () => {
    return photos.reduce<Record<string, MeasurementPhoto[]>>((groups, photo) => {
      const roomName = photo.roomName || '未分类';
      if (!groups[roomName]) {
        groups[roomName] = [];
      }
      groups[roomName].push(photo);
      return groups;
    }, {});
  };

  /**
   * 获取照片类型显示名称
   */
  const getPhotoTypeLabel = (type: PhotoType) => {
    return PHOTO_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type;
  };

  // 按房间分组的照片
  const photosByRoom = groupPhotosByRoom();
  const roomNames = Object.keys(photosByRoom).sort();

  return (
    <div className="space-y-6">
      {/* 上传区域 */}
      <PaperCard>
        <PaperCardHeader>
          <PaperCardTitle className="text-lg">上传测量照片</PaperCardTitle>
        </PaperCardHeader>
        <PaperCardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <PaperSelect
              label="房间"
              value={selectedRoom}
              onChange={(value) => setSelectedRoom(value)}
              options={rooms.map(room => ({ value: room, label: room }))}
              placeholder="请选择房间"
              required
            />
            
            <PaperSelect
              label="照片类型"
              value={selectedPhotoType}
              onChange={(value) => setSelectedPhotoType(value as PhotoType)}
              options={PHOTO_TYPE_OPTIONS}
              placeholder="请选择照片类型"
              required
            />
            
            <PaperInput
              label="描述（可选）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入照片描述"
            />
          </div>

          <PaperFileUpload
            onUpload={handlePhotoUpload}
            attachmentType="image"
            accept="image/jpeg,image/png,image/jpg"
            maxSizeMB={maxFileSizeMB}
            maxFiles={maxPhotos - photos.length}
            label="选择照片"
            multiple
            onValidateError={(errors) => {
              errors.forEach(error => toast.error(error));
            }}
          />

          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>上传进度</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </PaperCardContent>
      </PaperCard>

      {/* 照片管理区域 */}
      {Object.keys(photosByRoom).length > 0 && (
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle className="text-lg flex items-center justify-between">
              <span>已上传照片 ({photos.length}/{maxPhotos})</span>
              <PaperButton
                variant="outline"
                size="sm"
                onClick={() => setSorting(!sorting)}
                disabled={photos.length < 2}
              >
                <Move className="h-4 w-4 mr-1" />
                {sorting ? '完成排序' : '排序照片'}
              </PaperButton>
            </PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            {/* 按房间分组显示照片 */}
            {roomNames.map(roomName => {
              const roomPhotos = photosByRoom[roomName];
              return (
                <div key={roomName} className="mb-6">
                  <h3 className="text-md font-semibold mb-3 text-gray-700">
                    {roomName} ({roomPhotos.length} 张)
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {roomPhotos.map((photo, index) => (
                      <div
                        key={photo.id || photo.url}
                        className={`relative group border rounded-lg overflow-hidden bg-gray-50 transition-all duration-200 hover:shadow-md ${sorting ? 'cursor-move' : ''} ${draggedIndex === index ? 'opacity-50 border-dashed border-blue-500' : ''}`}
                        draggable={sorting}
                        onDragStart={() => handleDragStart(photos.findIndex(p => p.id === photo.id || p.url === photo.url))}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDragEnter={(e) => handleDragEnter(e, photos.findIndex(p => p.id === photo.id || p.url === photo.url))}
                      >
                        {/* 照片预览 */}
                        <div className="relative aspect-square overflow-hidden">
                          <img
                            src={photo.url}
                            alt={photo.filename}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onClick={() => handlePhotoPreview(photo)}
                          />
                          
                          {/* 照片类型标签 */}
                          <div className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                            {getPhotoTypeLabel(photo.photoType)}
                          </div>
                          
                          {/* 照片尺寸信息 */}
                          <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                            {Math.round(photo.size / 1024)} KB
                          </div>
                          
                          {/* 上传状态 */}
                          {!photo.isUploaded && (
                            <div className="absolute top-1 left-1 bg-yellow-600 text-white text-xs px-2 py-0.5 rounded">
                              待上传
                            </div>
                          )}
                          
                          {/* 标注图标 */}
                          {photo.annotations && photo.annotations.length > 0 && (
                            <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {photo.annotations.length}
                            </div>
                          )}
                        </div>
                        
                        {/* 操作按钮 */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-2">
                          <PaperButton
                            variant="primary"
                            size="sm"
                            leftIcon={<Tag className="h-3 w-3" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePhotoAnnotation(photo);
                            }}
                          >
                            标注
                          </PaperButton>
                          <PaperButton
                            variant="destructive"
                            size="sm"
                            leftIcon={<Trash2 className="h-3 w-3" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePhotoDelete(photos.findIndex(p => p.id === photo.id || p.url === photo.url));
                            }}
                          >
                            删除
                          </PaperButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </PaperCardContent>
        </PaperCard>
      )}

      {/* 照片预览模态框 */}
      <PaperModal
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setPreviewPhoto(null);
        }}
        title="照片预览"
        size="lg"
      >
        {previewPhoto && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.filename}
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">{previewPhoto.filename}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">房间:</span> {previewPhoto.roomName}
                </div>
                <div>
                  <span className="font-medium">类型:</span> {getPhotoTypeLabel(previewPhoto.photoType)}
                </div>
                <div>
                  <span className="font-medium">大小:</span> {Math.round(previewPhoto.size / 1024)} KB
                </div>
                <div>
                  <span className="font-medium">拍摄时间:</span> {new Date(previewPhoto.takenAt || '').toLocaleString('zh-CN')}
                </div>
                {previewPhoto.description && (
                  <div className="col-span-2">
                    <span className="font-medium">描述:</span> {previewPhoto.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </PaperModal>

      {/* 照片标注模态框 */}
      <PaperModal
        isOpen={showAnnotationModal}
        onClose={() => {
          setShowAnnotationModal(false);
          setCurrentAnnotationPhoto(null);
          setAnnotations([]);
        }}
        title="照片标注"
        size="xl"
      >
        {currentAnnotationPhoto && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img
                src={currentAnnotationPhoto.url}
                alt={currentAnnotationPhoto.filename}
                className="max-w-full max-h-[60vh] object-contain rounded"
              />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">标注工具</h3>
              <div className="flex gap-2 flex-wrap">
                <PaperButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newAnnotation = {
                      id: `anno_${Date.now()}`,
                      type: 'text' as const,
                      content: '新标注',
                      position: { x: 100, y: 100 },
                      color: '#FF4500'
                    };
                    setAnnotations([...annotations, newAnnotation]);
                  }}
                >
                  <Tag className="h-4 w-4 mr-1" /> 添加文本标注
                </PaperButton>
              </div>
              
              {/* 标注列表 */}
              {annotations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-md font-medium">标注列表</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {annotations.map((anno, index) => (
                      <div key={anno.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: anno.color }}></div>
                        <PaperInput
                          type="text"
                          value={anno.content}
                          onChange={(e) => {
                            const updatedAnnotations = [...annotations];
                            updatedAnnotations[index].content = e.target.value;
                            setAnnotations(updatedAnnotations);
                          }}
                          className="flex-1"
                          fullWidth={false}
                        />
                        <PaperButton
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setAnnotations(annotations.filter(a => a.id !== anno.id));
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </PaperButton>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <PaperButton variant="outline" onClick={() => {
                  setShowAnnotationModal(false);
                  setCurrentAnnotationPhoto(null);
                  setAnnotations([]);
                }}>
                  取消
                </PaperButton>
                <PaperButton variant="primary" onClick={saveAnnotations}>
                  <Check className="h-4 w-4 mr-1" /> 保存标注
                </PaperButton>
              </div>
            </div>
          </div>
        )}
      </PaperModal>
    </div>
  );
};
