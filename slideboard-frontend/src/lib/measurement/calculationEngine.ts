/**
 * 测量计算公式引擎
 * 用于解析和执行测量数据的计算公式
 */

import { CalculationFormula } from '@/types/measurement-template';

/**
 * 计算引擎选项
 */
export interface CalculationEngineOptions {
  /**
   * 是否启用调试模式
   */
  debug?: boolean;
  /**
   * 最大执行时间（毫秒）
   */
  maxExecutionTime?: number;
}

/**
 * 计算结果
 */
export interface CalculationResult {
  /**
   * 计算是否成功
   */
  success: boolean;
  /**
   * 计算结果
   */
  result?: any;
  /**
   * 错误信息
   */
  error?: string;
  /**
   * 执行时间（毫秒）
   */
  executionTime?: number;
  /**
   * 依赖的字段列表
   */
  dependencies?: string[];
}

/**
 * 测量计算公式引擎类
 */
export class CalculationEngine {
  private options: CalculationEngineOptions;

  constructor(options: CalculationEngineOptions = {}) {
    this.options = {
      debug: false,
      maxExecutionTime: 1000, // 默认最大执行时间1秒
      ...options
    };
  }

  /**
   * 解析计算公式，提取依赖字段
   * @param formula 计算公式
   * @returns 依赖字段列表
   */
  public parseFormulaDependencies(formula: string): string[] {
    // 简单的依赖提取，匹配所有可能的字段名
    // 注意：这是一个简化的实现，生产环境应该使用更复杂的解析器
    const variableRegex = /[a-zA-Z_][a-zA-Z0-9_]*/g;
    const matches = formula.match(variableRegex) || [];
    
    // 过滤掉数学函数和常量
    const mathKeywords = new Set([
      'Math', 'abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp',
      'floor', 'log', 'max', 'min', 'pow', 'random', 'round', 'sin', 'sqrt', 'tan',
      'PI', 'E', 'LN2', 'LN10', 'LOG2E', 'LOG10E', 'SQRT1_2', 'SQRT2',
      'true', 'false', 'undefined', 'null', 'NaN', 'Infinity'
    ]);
    
    return Array.from(new Set(matches.filter(match => !mathKeywords.has(match))));
  }

  /**
   * 执行单个计算公式
   * @param formula 计算公式
   * @param data 测量数据
   * @returns 计算结果
   */
  public executeFormula(formula: string, data: Record<string, any>): CalculationResult {
    const startTime = Date.now();
    
    try {
      // 检查执行时间
      if (this.options.maxExecutionTime && Date.now() - startTime > this.options.maxExecutionTime) {
        return {
          success: false,
          error: '计算公式执行超时',
          executionTime: Date.now() - startTime
        };
      }

      // 创建安全的执行上下文
      const context = {
        ...data,
        Math,
        // 添加常用数学函数作为全局函数
        abs: Math.abs,
        acos: Math.acos,
        asin: Math.asin,
        atan: Math.atan,
        atan2: Math.atan2,
        ceil: Math.ceil,
        cos: Math.cos,
        exp: Math.exp,
        floor: Math.floor,
        log: Math.log,
        log10: Math.log10,
        max: Math.max,
        min: Math.min,
        pow: Math.pow,
        random: Math.random,
        round: Math.round,
        sin: Math.sin,
        sqrt: Math.sqrt,
        tan: Math.tan,
        PI: Math.PI,
        E: Math.E
      };

      // 提取依赖字段
      const dependencies = this.parseFormulaDependencies(formula);

      // 验证所有依赖字段都存在
      const missingDependencies = dependencies.filter(dep => data[dep] === undefined && !formula.includes(`(${dep}`));
      if (missingDependencies.length > 0) {
        return {
          success: false,
          error: `缺少依赖字段: ${missingDependencies.join(', ')}`,
          executionTime: Date.now() - startTime,
          dependencies
        };
      }

      // 执行公式
      // 注意：这里使用Function构造函数，在生产环境中应该使用更安全的表达式解析器
      const result = Function(...Object.keys(context), `return ${formula}`)(...Object.values(context));

      return {
        success: true,
        result,
        executionTime: Date.now() - startTime,
        dependencies
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '计算公式执行错误',
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * 执行条件逻辑
   * @param condition 条件表达式
   * @param data 测量数据
   * @returns 条件结果
   */
  public executeCondition(condition: string, data: Record<string, any>): boolean {
    try {
      // 创建安全的执行上下文
      const context = {
        ...data,
        Math
      };

      // 执行条件表达式
      const result = Function(...Object.keys(context), `return ${condition}`)(...Object.values(context));
      return Boolean(result);
    } catch (error) {
      console.error('条件执行错误:', error);
      return false;
    }
  }

  /**
   * 执行所有启用的计算公式
   * @param formulas 计算公式列表
   * @param data 测量数据
   * @returns 更新后的测量数据
   */
  public executeAllFormulas(formulas: CalculationFormula[], data: Record<string, any>): Record<string, any> {
    const result = { ...data };
    
    // 按依赖关系排序
    const sortedFormulas = this.sortFormulasByDependencies(formulas);
    
    for (const formula of sortedFormulas) {
      if (formula.enabled) {
        const executionResult = this.executeFormula(formula.formula, result);
        if (executionResult.success && executionResult.result !== undefined) {
          result[formula.resultField] = executionResult.result;
        } else if (this.options.debug) {
          console.error(`公式 "${formula.name}" 执行失败:`, executionResult.error);
        }
      }
    }
    
    return result;
  }

  /**
   * 按依赖关系排序计算公式
   * @param formulas 计算公式列表
   * @returns 排序后的计算公式列表
   */
  private sortFormulasByDependencies(formulas: CalculationFormula[]): CalculationFormula[] {
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
      } else {
        // 自动计算依赖关系
        const dependencies = this.parseFormulaDependencies(formula.formula);
        for (const depField of dependencies) {
          const depFormula = formulas.find(f => f.resultField === depField);
          if (depFormula && depFormula.id !== formula.id) {
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

  /**
   * 验证计算公式语法
   * @param formula 计算公式
   * @returns 验证结果
   */
  public validateFormulaSyntax(formula: string): { isValid: boolean; error?: string } {
    try {
      // 创建一个安全的函数来验证语法
      Function(`"use strict"; return ${formula}`);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : '语法错误'
      };
    }
  }

  /**
   * 生成计算公式预览
   * @param formula 计算公式
   * @param data 示例数据
   * @returns 预览结果
   */
  public generateFormulaPreview(formula: string, data: Record<string, any>): string {
    try {
      const result = this.executeFormula(formula, data);
      if (result.success) {
        return `结果: ${result.result}`;
      } else {
        return `错误: ${result.error}`;
      }
    } catch (error) {
      return `预览错误: ${error instanceof Error ? error.message : '未知错误'}`;
    }
  }
}

/**
 * 测量规则引擎
 * 用于处理测量数据的条件规则
 */
export class MeasurementRuleEngine {
  private calculationEngine: CalculationEngine;

  constructor(options: CalculationEngineOptions = {}) {
    this.calculationEngine = new CalculationEngine(options);
  }

  /**
   * 执行测量规则
   * @param rule 测量规则
   * @param data 测量数据
   * @returns 规则执行结果
   */
  public executeRule(rule: any, data: Record<string, any>): boolean {
    return this.calculationEngine.executeCondition(rule.condition, data);
  }

  /**
   * 执行所有启用的测量规则
   * @param rules 测量规则列表
   * @param data 测量数据
   * @returns 规则执行结果映射
   */
  public executeAllRules(rules: any[], data: Record<string, any>): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    
    for (const rule of rules) {
      if (rule.enabled) {
        result[rule.id] = this.executeRule(rule, data);
      }
    }
    
    return result;
  }

  /**
   * 根据规则执行操作
   * @param rules 测量规则列表
   * @param data 测量数据
   * @returns 更新后的测量数据
   */
  public executeRuleActions(rules: any[], data: Record<string, any>): Record<string, any> {
    const result = { ...data };
    
    for (const rule of rules) {
      if (rule.enabled) {
        const conditionResult = this.executeRule(rule, data);
        if (conditionResult) {
          // 执行规则操作
          if (rule.actionType === 'setField') {
            result[rule.fieldName] = this.parseActionValue(rule.actionValue, data);
          } else if (rule.actionType === 'calculateField') {
            const calcResult = this.calculationEngine.executeFormula(rule.actionValue, data);
            if (calcResult.success) {
              result[rule.fieldName] = calcResult.result;
            }
          }
        }
      }
    }
    
    return result;
  }

  /**
   * 解析操作值
   * @param value 操作值
   * @param data 测量数据
   * @returns 解析后的值
   */
  private parseActionValue(value: any, data: Record<string, any>): any {
    if (typeof value === 'string' && value.startsWith('=')) {
      // 计算表达式
      const calcResult = this.calculationEngine.executeFormula(value.substring(1), data);
      return calcResult.success ? calcResult.result : value;
    }
    return value;
  }
}

/**
 * 创建计算引擎实例
 */
export const calculationEngine = new CalculationEngine();

export const measurementRuleEngine = new MeasurementRuleEngine();
