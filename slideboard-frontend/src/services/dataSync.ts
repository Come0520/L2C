import { env } from '@/config/env'

import { businessDataService } from './businessData.client'
import { feishuBitableService } from './feishuBitable'

// 数据同步配置类型
export interface DataSyncConfig {
  feishuAppToken: string;
  feishuTableId: string;
  syncTime: string; // 每天同步时间，格式：HH:MM
  enabled: boolean;
}

// 数据同步日志类型
export interface DataSyncLog {
  id: string;
  syncDate: string;
  status: 'success' | 'failed';
  message: string;
  startTime: string;
  endTime: string;
  dataCount: number;
}

export const dataSyncService = {
  /**
   * 执行经营数据同步到飞书多维表格
   */
  async syncBusinessDataToFeishu(
    feishuAppToken: string,
    feishuTableId: string,
    date?: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // 1. 获取格式化的经营数据
      const businessData = await businessDataService.getFormattedBusinessData(date)

      // 2. 检查数据是否已存在
      const exists = await feishuBitableService.checkBusinessDataExists(
        feishuAppToken,
        feishuTableId,
        businessData.日期
      )

      let result;
      if (exists) {
        // 数据已存在，跳过或更新

        return {
          success: true,
          message: `经营数据 ${businessData.日期} 已存在，跳过同步`
        };
      } else {
        // 3. 插入新数据
        result = await feishuBitableService.insertBusinessData(
          feishuAppToken,
          feishuTableId,
          businessData
        )
      }

      return {
        success: true,
        message: `经营数据 ${businessData.日期} 同步成功`,
        data: result
      };
    } catch (error: any) {

      return {
        success: false,
        message: `经营数据同步失败: ${error.message}`
      };
    }
  },

  /**
   * 批量同步经营数据到飞书多维表格
   */
  async batchSyncBusinessDataToFeishu(
    feishuAppToken: string,
    feishuTableId: string,
    startDate: string,
    endDate: string
  ) {
    try {
      // 计算日期范围
      const dates = this.getDateRange(startDate, endDate)
      const results = []

      // 遍历日期范围，逐个同步数据
      for (const date of dates) {
        const result = await this.syncBusinessDataToFeishu(
          feishuAppToken,
          feishuTableId,
          date
        )
        results.push({ date, ...result })
      }

      return {
        success: true,
        message: `批量同步完成，共处理 ${dates.length} 天数据`,
        results
      };
    } catch (error: any) {

      return {
        success: false,
        message: `批量经营数据同步失败: ${error.message}`
      };
    }
  },

  /**
   * 创建飞书多维表格并初始化经营数据
   */
  async setupBusinessDataSync(
    feishuAppToken: string,
    tableName: string = '经营数据日报'
  ) {
    try {
      // 1. 创建经营数据表格
      const tableResult = await feishuBitableService.createBusinessDataTable(
        feishuAppToken,
        tableName
      )

      // 2. 同步当天数据
      const syncResult = await this.syncBusinessDataToFeishu(
        feishuAppToken,
        tableResult.table.id
      )

      return {
        success: true,
        message: '经营数据同步设置完成',
        tableId: tableResult.table.id,
        syncResult
      };
    } catch (error: any) {

      return {
        success: false,
        message: `经营数据同步设置失败: ${error.message}`
      };
    }
  },

  /**
   * 计算日期范围
   */
  getDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    const current = new Date(start)
    while (current <= end) {
      dates.push(current.toISOString().substring(0, 10))
      current.setDate(current.getDate() + 1)
    }

    return dates
  },

  /**
   * 获取同步配置
   */
  async getSyncConfig() {
    // 实际实现中，应该从数据库或配置文件中获取配置
    // 这里返回默认配置
    return {
      feishuAppToken: env.FEISHU_BUSINESS_DATA_APP_TOKEN || '',
      feishuTableId: env.FEISHU_BUSINESS_DATA_TABLE_ID || '',
      syncTime: '08:00', // 默认每天早上8点同步
      enabled: true
    } as DataSyncConfig
  },

  /**
   * 更新同步配置
   */
  async updateSyncConfig(config: Partial<DataSyncConfig>) {
    // 实际实现中，应该将配置保存到数据库或配置文件中
    // 这里使用内存存储模拟，实际项目中应该使用数据库
    const currentConfig = await this.getSyncConfig()
    const updatedConfig = { ...currentConfig, ...config }
    
    // 这里应该保存到数据库，例如：
    // await configService.updateSystemConfig('data_sync', JSON.stringify(updatedConfig))
    
    return { success: true, message: '同步配置更新成功', config: updatedConfig }
  }
}
