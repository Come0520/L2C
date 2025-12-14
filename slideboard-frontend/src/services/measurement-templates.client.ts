// 测量模板客户端服务

import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';
import {
  MeasurementTemplate,
  CreateMeasurementTemplateRequest,
  UpdateMeasurementTemplateRequest,
  MeasurementTemplateFilters,
  CalculationFormula,
  QualityStandard
} from '@/types/measurement-template';

type MeasurementTemplateRow = Database['public']['Tables']['measurement_templates']['Row'];

// Helper function to map DB row to Frontend Type
function mapToMeasurementTemplate(row: MeasurementTemplateRow): MeasurementTemplate {
  const content = row.content as any || {};
  return {
    id: row.id,
    name: row.name,
    description: content.description || '',
    productCategory: content.product_category || '',
    totalArea: content.total_area || 0,
    rooms: content.rooms || [],
    isDefault: row.is_default || false,
    status: (row.status || 'active') as 'active' | 'inactive',
    version: content.version || '1.0',
    customFields: content.custom_fields || [],
    measurementRules: content.measurement_rules || [],
    calculationFormulas: content.calculation_formulas || [],
    qualityStandards: content.quality_standards || [],
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
      if (filters.productCategory) {
        query = query.ilike('content->product_category', `%${filters.productCategory}%`);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
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
    if (data.isDefault) {
      await supabase
        .from('measurement_templates')
        .update({ is_default: false })
        .eq('is_default', true);
    }

    const content = {
      description: data.description,
      product_category: data.productCategory,
      total_area: data.totalArea,
      rooms: data.rooms,
      version: data.version || '1.0',
      custom_fields: data.customFields || [],
      measurement_rules: data.measurementRules || [],
      calculation_formulas: data.calculationFormulas || [],
      quality_standards: data.qualityStandards || [],
      is_default: data.isDefault
    };

    const { data: newTemplate, error } = await supabase
      .from('measurement_templates')
      .insert({
        name: data.name,
        content: content,
        is_default: data.isDefault,
        status: data.status || 'active'
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
    // 如果设置为默认模板，先将其他模板设置为非默认
    if (data.isDefault) {
      await supabase
        .from('measurement_templates')
        .update({ is_default: false })
        .eq('is_default', true)
        .neq('id', id);
    }

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
      product_category: data.productCategory !== undefined ? data.productCategory : existing.productCategory,
      total_area: data.totalArea !== undefined ? data.totalArea : existing.totalArea,
      rooms: data.rooms !== undefined ? data.rooms : existing.rooms,
      version: data.version !== undefined ? data.version : existing.version,
      custom_fields: data.customFields !== undefined ? data.customFields : existing.customFields,
      measurement_rules: data.measurementRules !== undefined ? data.measurementRules : existing.measurementRules,
      calculation_formulas: data.calculationFormulas !== undefined ? data.calculationFormulas : existing.calculationFormulas,
      quality_standards: data.qualityStandards !== undefined ? data.qualityStandards : existing.qualityStandards,
      is_default: data.isDefault !== undefined ? data.isDefault : existing.isDefault
    };

    const { data: updatedTemplate, error } = await supabase
      .from('measurement_templates')
      .update({
        name: data.name || existing.name,
        content: content,
        is_default: data.isDefault !== undefined ? data.isDefault : existing.isDefault,
        status: data.status !== undefined ? data.status : existing.status,
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
    const { data, error } = await supabase
      .from('measurement_templates')
      .select('*')
      .eq('is_default', true);

    if (error) {
      throw new Error(`Failed to get default measurement template: ${error.message}`);
    }

    return data && data.length > 0 ? mapToMeasurementTemplate(data[0]) : null;
  }

  /**
   * 克隆测量模板
   * @param id 模板ID
   * @param newName 新模板名称
   * @returns 克隆的测量模板
   */
  static async cloneTemplate(id: string, newName: string): Promise<MeasurementTemplate> {
    const existing = await this.getTemplateById(id);
    if (!existing) {
      throw new Error('Failed to clone measurement template: Template not found');
    }

    const createRequest: CreateMeasurementTemplateRequest = {
      name: newName,
      description: `${existing.description} (克隆)`,
      productCategory: existing.productCategory,
      totalArea: existing.totalArea,
      rooms: existing.rooms,
      isDefault: false,
      status: existing.status,
      version: '1.0',
      customFields: existing.customFields,
      measurementRules: existing.measurementRules,
      calculationFormulas: existing.calculationFormulas,
      qualityStandards: existing.qualityStandards
    };

    return this.createTemplate(createRequest);
  }

  /**
   * 验证模板数据
   * @param template 模板数据
   * @returns 验证结果
   */
  static validateTemplate(template: Partial<MeasurementTemplate>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.name || template.name.trim() === '') {
      errors.push('模板名称不能为空');
    }

    if (!template.productCategory || template.productCategory.trim() === '') {
      errors.push('产品类别不能为空');
    }

    // 验证计算公式
    if (template.calculationFormulas) {
      for (const formula of template.calculationFormulas) {
        if (!formula.formula || formula.formula.trim() === '') {
          errors.push(`计算公式 "${formula.name}" 的公式内容不能为空`);
        }
        if (!formula.resultField || formula.resultField.trim() === '') {
          errors.push(`计算公式 "${formula.name}" 的结果字段不能为空`);
        }
      }
    }

    // 验证质量标准
    if (template.qualityStandards) {
      for (const standard of template.qualityStandards) {
        if (!standard.fieldName || standard.fieldName.trim() === '') {
          errors.push(`质量标准 "${standard.name}" 的关联字段不能为空`);
        }
        if (standard.minValue !== undefined && standard.maxValue !== undefined && standard.minValue > standard.maxValue) {
          errors.push(`质量标准 "${standard.name}" 的最小值不能大于最大值`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * 测量模板计算公式引擎
 */
export class CalculationEngine {
  /**
   * 执行计算公式
   * @param formula 计算公式
   * @param data 测量数据
   * @returns 计算结果
   */
  static executeFormula(formula: CalculationFormula, data: Record<string, any>): number {
    try {
      // 创建一个安全的执行上下文
      const context = {
        ...data,
        Math
      };

      // 简单的公式解析和执行
      // 注意：这是一个简化的实现，生产环境中应该使用更安全的表达式解析器
      const result = Function(...Object.keys(context), `return ${formula.formula}`)(...Object.values(context));
      return typeof result === 'number' ? result : 0;
    } catch (error) {
      console.error(`执行公式 "${formula.name}" 失败:`, error);
      return 0;
    }
  }

  /**
   * 执行所有启用的计算公式
   * @param formulas 计算公式列表
   * @param data 测量数据
   * @returns 更新后的测量数据
   */
  static executeAllFormulas(formulas: CalculationFormula[], data: Record<string, any>): Record<string, any> {
    const result = { ...data };
    
    // 按依赖关系排序
    const sortedFormulas = this.sortFormulasByDependencies(formulas);
    
    for (const formula of sortedFormulas) {
      if (formula.enabled) {
        result[formula.resultField] = this.executeFormula(formula, result);
      }
    }
    
    return result;
  }

  /**
   * 按依赖关系排序计算公式
   * @param formulas 计算公式列表
   * @returns 排序后的计算公式列表
   */
  private static sortFormulasByDependencies(formulas: CalculationFormula[]): CalculationFormula[] {
    const visited = new Set<string>();
    const result: CalculationFormula[] = [];
    
    const dfs = (formula: CalculationFormula) => {
      if (visited.has(formula.id)) return;
      visited.add(formula.id);
      
      // 先处理依赖的公式
      if (formula.dependencies) {
        for (const depId of formula.dependencies) {
          const depFormula = formulas.find(f => f.id === depId);
          if (depFormula) {
            dfs(depFormula);
          }
        }
      }
      
      result.push(formula);
    };
    
    for (const formula of formulas) {
      dfs(formula);
    }
    
    return result;
  }
}

/**
 * 测量质量检查器
 */
export class QualityChecker {
  /**
   * 检查测量数据是否符合质量标准
   * @param data 测量数据
   * @param standards 质量标准列表
   * @returns 检查结果
   */
  static checkQuality(data: Record<string, any>, standards: QualityStandard[]): Array<{
    standard: QualityStandard;
    passed: boolean;
    actualValue: any;
    message: string;
  }> {
    const results: Array<{
      standard: QualityStandard;
      passed: boolean;
      actualValue: any;
      message: string;
    }> = [];
    
    for (const standard of standards) {
      if (!data.hasOwnProperty(standard.fieldName)) continue;
      
      const actualValue = data[standard.fieldName];
      let passed = true;
      let message = '';
      
      if (standard.minValue !== undefined && actualValue < standard.minValue) {
        passed = false;
        message = `${standard.fieldName} 值 ${actualValue} 低于最小值 ${standard.minValue}`;
      }
      
      if (passed && standard.maxValue !== undefined && actualValue > standard.maxValue) {
        passed = false;
        message = `${standard.fieldName} 值 ${actualValue} 高于最大值 ${standard.maxValue}`;
      }
      
      if (passed && standard.tolerance !== undefined && typeof actualValue === 'number') {
        // 这里假设标准值是某个参考值，实际使用时可能需要调整
        const referenceValue = (standard.minValue + standard.maxValue) / 2;
        const deviation = Math.abs(actualValue - referenceValue);
        if (deviation > standard.tolerance) {
          passed = false;
          message = `${standard.fieldName} 值 ${actualValue} 与参考值 ${referenceValue} 的偏差 ${deviation} 超过容差 ${standard.tolerance}`;
        }
      }
      
      results.push({
        standard,
        passed,
        actualValue,
        message
      });
    }
    
    return results;
  }
}
