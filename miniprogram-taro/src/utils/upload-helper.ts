/**
 * upload-helper — 图片选择与批量上传工具
 *
 * @description 封装"选媒体 → 批量上传 → 返回 URL 数组"完整流程，供所有页面复用。
 */
import Taro from '@tarojs/taro'
import { api } from '@/services/api'

/** 上传选项 */
export interface UploadOptions {
    /** 最多选几张（默认 9） */
    maxCount?: number
    /** 允许的媒体类型（默认 ['image']） */
    mediaType?: ('image' | 'video')[]
    /** 上传接口路径（默认 '/upload'） */
    uploadUrl?: string
    /** 图片 formData 字段名（默认 'file'） */
    fieldName?: string
    /** 是否显示上传进度 Loading（默认 true）*/
    showLoading?: boolean
}

/** 上传结果 */
export interface UploadResult {
    /** 成功上传的图片 OSS URL 数组 */
    urls: string[]
    /** 失败的临时路径（可展示错误） */
    failedPaths: string[]
}

/**
 * 选择图片并批量上传到 OSS
 *
 * @param options 上传选项
 * @returns 已上传图片的 URL 列表和失败列表
 */
export async function chooseAndUploadImages(
    options?: UploadOptions
): Promise<UploadResult> {
    const {
        maxCount = 9,
        mediaType = ['image'],
        uploadUrl = '/upload',
        fieldName = 'file',
        showLoading: _showLoading = true,
    } = options ?? {}

    // 1. 调用 Taro.chooseMedia 选择图片
    const tempFiles = await new Promise<{ tempFilePath: string }[]>((resolve) => {
        Taro.chooseMedia({
            count: maxCount,
            mediaType,
            sourceType: ['camera', 'album'],
            success: (res) => {
                resolve(res.tempFiles as { tempFilePath: string }[])
            },
            fail: () => {
                // 用户取消或失败，返回空列表
                resolve([])
            },
        })
    })

    if (tempFiles.length === 0) {
        return { urls: [], failedPaths: [] }
    }

    // 2. 逐个上传，收集成功 URL 和失败路径
    const urls: string[] = []
    const failedPaths: string[] = []

    await Promise.all(
        tempFiles.map(async ({ tempFilePath }) => {
            try {
                const res = await api.upload(uploadUrl, tempFilePath, fieldName)
                if (res?.data?.url) {
                    urls.push(res.data.url)
                } else {
                    failedPaths.push(tempFilePath)
                }
            } catch {
                failedPaths.push(tempFilePath)
            }
        })
    )

    return { urls, failedPaths }
}
