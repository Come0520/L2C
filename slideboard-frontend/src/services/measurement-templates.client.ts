// 测量模板客户端服务

import { supabase } from '@/lib/supabase/client';
import { Database } from '@/shared/types/supabase';
import {
  MeasurementTemplate,
  CreateMeasurementTemplateRequest,
  UpdateMeasurementTemplateRequest,
  MeasurementTemplateFilters
} from '@/types/measurement-template';

type MeasurementTemplateRow = Database['public']['Tables']['measurement_templates']['Row'];

// Helper function to map DB row to Frontend Type
function mapToMeasurementTemplate(row: MeasurementTemplateRow): MeasurementTemplate {
  const content = row.content as any || {};
  return {
    id: row.id,
    name: row.name,
    description: content.description || '',
    totalArea: content.total_area || 0,
    rooms: content.rooms || [],
    isDefault: row.is_default || false,
    createdBy: row.created_by || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}


/**
 * 测量模板客户端服务类
 */
export class MeasurementTemplatesClient {
  /**
   * 获取测量模板列表
   * @param filters 筛选条件
   * @returns 测量模板列表
   */
  static async getTemplates(filters?: MeasurementTemplateFilters): Promise<MeasurementTemplate[]> {
    let query = supabase
      .from('measurement_templates')
      .select('*')
      .order('created_at', { ascending: false });

    // 应用筛选条件
    if (filters) {
      if (filters.name) {
        query = query.ilike('name', `%${filters.name}%`);
      }
      if (filters.isDefault !== undefined) {
        query = query.eq('is_default', filters.isDefault);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        const from = filters.offset
        const to = filters.limit ? from + filters.limit - 1 : from + 19
        query = query.range(from, to)
      }
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to get measurement templates: ${error.message}`);
    }

    return (data || []).map(mapToMeasurementTemplate);
  }

  /**
   * 获取单个测量模板
   * @param id 模板ID
   * @returns 测量模板
   */
  static async getTemplateById(id: string): Promise<MeasurementTemplate | null> {
    const { data, error } = await supabase
      .from('measurement_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get measurement template: ${error.message}`);
    }

    return mapToMeasurementTemplate(data);
  }

  /**
   * 创建测量模板
   * @param data 创建数据
   * @returns 创建的测量模板
   */
  static async createTemplate(data: CreateMeasurementTemplateRequest): Promise<MeasurementTemplate> {
    // 如果设置为默认模板，先将其他模板设置为非默认
    // Note: Since is_default is inside content JSON in DB (assumed), we might need to handle this differently or ignore it for now if we can't query inside JSON efficiently without specific setup
    /* 
    if (data.isDefault) {
      await supabase
        .from('measurement_templates')
        .update({ is_default: false } as any) 
        .eq('is_default', true);
    }
    */

    const content = {
      description: data.description,
      total_area: data.totalArea,
      rooms: data.rooms,
      is_default: data.isDefault
    };

    const { data: newTemplate, error } = await supabase
      .from('measurement_templates')
      .insert({
        name: data.name,
        content: content,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create measurement template: ${error.message}`);
    }

    return mapToMeasurementTemplate(newTemplate);
  }

  /**
   * 更新测量模板
   * @param id 模板ID
   * @param data 更新数据
   * @returns 更新后的测量模板
   */
  static async updateTemplate(id: string, data: UpdateMeasurementTemplateRequest): Promise<MeasurementTemplate> {
    /*
    // 如果设置为默认模板，先将其他模板设置为非默认
    if (data.isDefault) {
      await supabase
        .from('measurement_templates')
        .update({ is_default: false } as any)
        .eq('is_default', true)
        .neq('id', id);
    }
    */

    let existing: MeasurementTemplate | null;

    try {
      // We need to fetch existing content to merge updates because we are updating the whole JSON
      existing = await this.getTemplateById(id);
    } catch (error) {
      throw new Error(`Failed to update measurement template: ${error instanceof Error ? error.message : 'Template not found'}`);
    }

    if (!existing) throw new Error('Failed to update measurement template: Template not found');

    const content = {
      description: data.description !== undefined ? data.description : existing.description,
      total_area: data.totalArea !== undefined ? data.totalArea : existing.totalArea,
      rooms: data.rooms !== undefined ? data.rooms : existing.rooms,
      is_default: data.isDefault !== undefined ? data.isDefault : existing.isDefault
    };

    const { data: updatedTemplate, error } = await supabase
      .from('measurement_templates')
      .update({
        name: data.name || existing.name,
        content: content,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update measurement template: ${error.message}`);
    }

    return mapToMeasurementTemplate(updatedTemplate);
  }

  /**
   * 删除测量模板
   * @param id 模板ID
   * @returns 删除结果
   */
  static async deleteTemplate(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('measurement_templates')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete measurement template: ${error.message}`);
    }

    return true;
  }

  /**
   * 获取默认测量模板
   * @returns 默认测量模板
   */
  static async getDefaultTemplate(): Promise<MeasurementTemplate | null> {
    // Note: We cannot query JSON content directly for is_default unless we have a specific column or index.
    // For now, let's fetch all templates and filter in memory
    const { data, error } = await supabase
      .from('measurement_templates')
      .select('*');

    if (error) {
      throw new Error(`Failed to get default measurement template: ${error.message}`);
    }

    // Filter in memory to find the default template
    const defaultTemplate = data?.find(template => {
      const content = template.content as any || {};
      return content.is_default === true;
    });

    return defaultTemplate ? mapToMeasurementTemplate(defaultTemplate) : null;
  }
}
