import { env } from '@/config/env';

// 飞书多维表格服务
// 用于管理飞书多维表格的创建、数据录入和查询


// 飞书多维表格配置类型
export interface FeishuBitableConfig {
  appToken: string;
  tableId: string;
  folderToken?: string;
  timeZone?: string;
}

// 飞书多维表格字段属性类型
export interface BitableFieldProperty {
  date_formatter?: string;
  formatter?: 'currency' | 'percent' | 'number';
  currency_code?: string;
  precision?: number;
  options?: string[];
  [key: string]: any;
}

// 飞书多维表格字段类型
export interface BitableField {
  fieldName: string;
  type: number;
  uiType: string;
  property?: BitableFieldProperty;
}

// 飞书多维表格排序类型
export interface BitableSort {
  field_name: string;
  order: 'asc' | 'desc';
}

// 飞书多维表格过滤条件类型
export interface BitableFilterCondition {
  field_name: string;
  operator: string;
  value: any[];
}

// 飞书多维表格过滤类型
export interface BitableFilter {
  conditions: BitableFilterCondition[];
  conjunction: 'and' | 'or';
}

// 飞书多维表格记录类型
export interface BitableRecord {
  recordId?: string;
  fields: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

// 飞书经营数据类型
export interface FeishuBusinessData {
  日期: string;
  总销售额: number;
  总订单数: number;
  新增客户数: number;
  待处理订单数: number;
  已完成订单数: number;
  总线索数: number;
  合格线索数: number;
  线索转化率: number;
  平均订单价值: number;
  库存价值: number;
  低库存商品数: number;
  [key: string]: any;
}

export const feishuBitableService = {
  /**
   * 创建飞书多维表格应用
   */
  async createApp(name: string, folderToken?: string, timeZone: string = 'Asia/Shanghai') {
    try {
      // 这里使用飞书API创建应用
      // 实际实现中需要调用飞书开放平台API
      const response = await fetch('https://open.feishu.cn/open-apis/bitable/v1/apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.FEISHU_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          name,
          folder_token: folderToken,
          time_zone: timeZone
        })
      });

      const data = await response.json();
      if (data.code !== 0) {
        throw new Error(data.msg || '创建应用失败');
      }

      return data.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 创建飞书多维表格
   */
  async createTable(appToken: string, tableName: string, fields: BitableField[]) {
    try {
      // 这里使用飞书API创建表格
      const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.FEISHU_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          table: {
            name: tableName,
            default_view_name: '默认视图',
            fields
          }
        })
      });

      const data = await response.json();
      if (data.code !== 0) {
        throw new Error(data.msg || '创建表格失败');
      }

      return data.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 获取表格列表
   */
  async getTables(appToken: string) {
    try {
      const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables`, {
        headers: {
          'Authorization': `Bearer ${process.env.FEISHU_ACCESS_TOKEN}`
        }
      });

      const data = await response.json();
      if (data.code !== 0) {
        throw new Error(data.msg || '获取表格列表失败');
      }

      return data.data.items;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 向表格中插入记录
   */
  async createRecord<T extends Record<string, any>>(appToken: string, tableId: string, fields: T) {
    try {
      const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.FEISHU_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          fields
        })
      });

      const data = await response.json();
      if (data.code !== 0) {
        throw new Error(data.msg || '插入记录失败');
      }

      return data.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 批量插入记录
   */
  async batchCreateRecords<T extends Record<string, any>>(appToken: string, tableId: string, records: T[]) {
    try {
      // 飞书API支持批量插入，最多500条/次
      const batches = [];
      for (let i = 0; i < records.length; i += 500) {
        batches.push(records.slice(i, i + 500));
      }

      const results = [];
      for (const batch of batches) {
        const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.FEISHU_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            records: batch.map(fields => ({ fields }))
          })
        });

        const data = await response.json();
        if (data.code !== 0) {
          throw new Error(data.msg || '批量插入记录失败');
        }

        results.push(...data.data.records);
      }

      return results;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 查询表格记录
   */
  async searchRecords(appToken: string, tableId: string, filter?: BitableFilter, sort?: BitableSort[], pageSize: number = 100) {
    try {
      const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.FEISHU_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          filter,
          sort,
          page_size: pageSize
        })
      });

      const data = await response.json();
      if (data.code !== 0) {
        throw new Error(data.msg || '查询记录失败');
      }

      return data.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 更新表格记录
   */
  async updateRecord<T extends Record<string, any>>(appToken: string, tableId: string, recordId: string, fields: T) {
    try {
      const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.FEISHU_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          fields
        })
      });

      const data = await response.json();
      if (data.code !== 0) {
        throw new Error(data.msg || '更新记录失败');
      }

      return data.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 为经营数据创建飞书多维表格
   */
  async createBusinessDataTable(appToken: string, tableName: string = '经营数据日报') {
    // 定义经营数据表格字段
    const fields: BitableField[] = [
      {
        fieldName: '日期',
        type: 5,
        uiType: 'DateTime',
        property: {
          date_formatter: 'YYYY-MM-DD'
        }
      },
      {
        fieldName: '总销售额',
        type: 2,
        uiType: 'Number',
        property: {
          formatter: 'currency',
          currency_code: 'CNY'
        }
      },
      {
        fieldName: '总订单数',
        type: 2,
        uiType: 'Number'
      },
      {
        fieldName: '新增客户数',
        type: 2,
        uiType: 'Number'
      },
      {
        fieldName: '待处理订单数',
        type: 2,
        uiType: 'Number'
      },
      {
        fieldName: '已完成订单数',
        type: 2,
        uiType: 'Number'
      },
      {
        fieldName: '总线索数',
        type: 2,
        uiType: 'Number'
      },
      {
        fieldName: '合格线索数',
        type: 2,
        uiType: 'Number'
      },
      {
        fieldName: '线索转化率',
        type: 2,
        uiType: 'Number',
        property: {
          formatter: 'percent'
        }
      },
      {
        fieldName: '平均订单价值',
        type: 2,
        uiType: 'Number',
        property: {
          formatter: 'currency',
          currency_code: 'CNY'
        }
      },
      {
        fieldName: '库存价值',
        type: 2,
        uiType: 'Number',
        property: {
          formatter: 'currency',
          currency_code: 'CNY'
        }
      },
      {
        fieldName: '低库存商品数',
        type: 2,
        uiType: 'Number'
      }
    ];

    return this.createTable(appToken, tableName, fields);
  },

  /**
   * 向经营数据表格插入数据
   */
  async insertBusinessData(appToken: string, tableId: string, businessData: FeishuBusinessData) {
    return this.createRecord(appToken, tableId, businessData);
  },

  /**
   * 检查经营数据是否已存在
   */
  async checkBusinessDataExists(appToken: string, tableId: string, date: string) {
    const result = await this.searchRecords(appToken, tableId, {
      conditions: [
        {
          field_name: '日期',
          operator: 'is',
          value: [date]
        }
      ],
      conjunction: 'and'
    }, undefined, 1);

    return result.total > 0;
  }
}
