'use client';

import { Plus, Trash2, Edit2, Save, X, MoveUp, MoveDown } from 'lucide-react';
import React, { useState } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card';
import { PaperCheckbox } from '@/components/ui/paper-checkbox';
import { PaperInput } from '@/components/ui/paper-input';
import { PaperModal } from '@/components/ui/paper-modal';
import { PaperSelect } from '@/components/ui/paper-select';
import { PaperTextarea } from '@/components/ui/paper-textarea';
import { toast } from '@/components/ui/toast';
import {
  MeasurementTemplate,
  CreateMeasurementTemplateRequest,
  UpdateMeasurementTemplateRequest,
  CustomMeasurementField,
  CalculationFormula,
  QualityStandard
} from '@/types/measurement-template';

interface MeasurementTemplateEditorProps {
  template?: MeasurementTemplate;
  onSave: (data: CreateMeasurementTemplateRequest | UpdateMeasurementTemplateRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * 测量模板编辑器组件
 * 用于创建和编辑测量模板
 */
export const MeasurementTemplateEditor: React.FC<MeasurementTemplateEditorProps> = ({
  template,
  onSave,
  onCancel,
  isLoading = false
}) => {
  // 基本信息
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [productCategory, setProductCategory] = useState(template?.productCategory || '');
  const [totalArea, setTotalArea] = useState(template?.totalArea || 0);
  const [isDefault, setIsDefault] = useState(template?.isDefault || false);
  const [status, setStatus] = useState<MeasurementTemplate['status']>(template?.status || 'active');
  const [version, setVersion] = useState(template?.version || '1.0');

  // 自定义测量字段
  const [customFields, setCustomFields] = useState<CustomMeasurementField[]>(template?.customFields || []);
  
  // 计算公式
  const [calculationFormulas, setCalculationFormulas] = useState<CalculationFormula[]>(template?.calculationFormulas || []);
  
  // 质量标准
  const [qualityStandards, setQualityStandards] = useState<QualityStandard[]>(template?.qualityStandards || []);

  // 模态框状态
  const [activeTab, setActiveTab] = useState<'basic' | 'fields' | 'formulas' | 'quality'>('basic');
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomMeasurementField | null>(null);
  const [editingFormula, setEditingFormula] = useState<CalculationFormula | null>(null);
  const [editingQuality, setEditingQuality] = useState<QualityStandard | null>(null);

  // 产品类别选项
  const productCategories = [
    { value: 'curtain', label: '窗帘' },
    { value: 'wallpaper', label: '壁纸' },
    { value: 'wall_panel', label: '墙板' },
    { value: 'floor', label: '地板' },
    { value: 'ceiling', label: '天花板' },
    { value: 'other', label: '其他' }
  ];

  // 字段类型选项
  const fieldTypes = [
    { value: 'number', label: '数字' },
    { value: 'string', label: '文本' },
    { value: 'boolean', label: '布尔值' },
    { value: 'select', label: '单选' },
    { value: 'multiselect', label: '多选' }
  ];

  // 严重程度选项
  const severityOptions = [
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' }
  ];

  // 处理保存
  const handleSave = async () => {
    try {
      const data = {
        name,
        description,
        productCategory,
        totalArea,
        rooms: template?.rooms || [],
        isDefault,
        status,
        version,
        customFields,
        calculationFormulas,
        qualityStandards
      } as CreateMeasurementTemplateRequest | UpdateMeasurementTemplateRequest;

      await onSave(data);
      toast.success(template ? '模板更新成功' : '模板创建成功');
    } catch (error) {
      toast.error((error as Error).message || '保存失败');
    }
  };

  // 处理添加/编辑自定义字段
  const handleFieldSave = () => {
    if (!editingField) return;

    if (editingField.id) {
      // 更新现有字段
      setCustomFields(customFields.map(field => 
        field.id === editingField.id ? editingField : field
      ));
    } else {
      // 添加新字段
      const newField: CustomMeasurementField = {
        ...editingField,
        id: `field_${Date.now()}`,
        order: customFields.length + 1
      };
      setCustomFields([...customFields, newField]);
    }

    setEditingField(null);
    setShowFieldModal(false);
  };

  // 处理删除自定义字段
  const handleDeleteField = (id: string) => {
    setCustomFields(customFields.filter(field => field.id !== id));
  };

  // 处理移动字段
  const handleMoveField = (id: string, direction: 'up' | 'down') => {
    const index = customFields.findIndex(field => field.id === id);
    if (index === -1) return;

    const newFields = [...customFields];
    if (direction === 'up' && index > 0) {
      // 向上移动
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    } else if (direction === 'down' && index < newFields.length - 1) {
      // 向下移动
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    }

    // 更新order属性
    const updatedFields = newFields.map((field, idx) => ({
      ...field,
      order: idx + 1
    }));

    setCustomFields(updatedFields);
  };

  // 处理添加/编辑计算公式
  const handleFormulaSave = () => {
    if (!editingFormula) return;

    if (editingFormula.id) {
      // 更新现有公式
      setCalculationFormulas(calculationFormulas.map(formula => 
        formula.id === editingFormula.id ? editingFormula : formula
      ));
    } else {
      // 添加新公式
      const newFormula: CalculationFormula = {
        ...editingFormula,
        id: `formula_${Date.now()}`
      };
      setCalculationFormulas([...calculationFormulas, newFormula]);
    }

    setEditingFormula(null);
    setShowFormulaModal(false);
  };

  // 处理删除计算公式
  const handleDeleteFormula = (id: string) => {
    setCalculationFormulas(calculationFormulas.filter(formula => formula.id !== id));
  };

  // 处理添加/编辑质量标准
  const handleQualitySave = () => {
    if (!editingQuality) return;

    if (editingQuality.id) {
      // 更新现有标准
      setQualityStandards(qualityStandards.map(standard => 
        standard.id === editingQuality.id ? editingQuality : standard
      ));
    } else {
      // 添加新标准
      const newStandard: QualityStandard = {
        ...editingQuality,
        id: `quality_${Date.now()}`
      };
      setQualityStandards([...qualityStandards, newStandard]);
    }

    setEditingQuality(null);
    setShowQualityModal(false);
  };

  // 处理删除质量标准
  const handleDeleteQuality = (id: string) => {
    setQualityStandards(qualityStandards.filter(standard => standard.id !== id));
  };

  // 初始化编辑字段
  const initEditField = (field?: CustomMeasurementField) => {
    if (field) {
      setEditingField({ ...field });
    } else {
      setEditingField({
        id: '',
        name: '',
        label: '',
        type: 'number',
        required: false,
        order: customFields.length + 1
      });
    }
    setShowFieldModal(true);
  };

  // 初始化编辑公式
  const initEditFormula = (formula?: CalculationFormula) => {
    if (formula) {
      setEditingFormula({ ...formula });
    } else {
      setEditingFormula({
        id: '',
        name: '',
        formula: '',
        resultField: '',
        enabled: true
      });
    }
    setShowFormulaModal(true);
  };

  // 初始化编辑质量标准
  const initEditQuality = (standard?: QualityStandard) => {
    if (standard) {
      setEditingQuality({ ...standard });
    } else {
      setEditingQuality({
        id: '',
        name: '',
        fieldName: '',
        severity: 'medium'
      });
    }
    setShowQualityModal(true);
  };

  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <PaperCard>
        <PaperCardHeader>
          <PaperCardTitle>基本信息</PaperCardTitle>
        </PaperCardHeader>
        <PaperCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PaperInput
              label="模板名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入模板名称"
              required
            />
            
            <PaperSelect
              label="产品类别"
              value={productCategory}
              onChange={(value) => setProductCategory(value)}
              options={productCategories}
              placeholder="请选择产品类别"
              required
            />
            
            <PaperTextarea
              label="描述"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入模板描述"
              rows={3}
            />
            
            <PaperInput
              label="总面积 (m²)"
              type="number"
              value={totalArea.toString()}
              onChange={(e) => setTotalArea(parseFloat(e.target.value) || 0)}
              placeholder="请输入总面积"
              step="0.01"
            />
            
            <PaperInput
              label="版本"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="请输入版本号"
            />
            
            <div className="flex items-center gap-4 pt-2">
              <PaperCheckbox
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked || false)}
              >
                默认模板
              </PaperCheckbox>
              
              <PaperSelect
                label="状态"
                value={status}
                onChange={(value) => setStatus(value as 'active' | 'inactive')}
                options={[
                  { value: 'active', label: '启用' },
                  { value: 'inactive', label: '禁用' }
                ]}
              />
            </div>
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* 自定义测量字段 */}
      <PaperCard>
        <PaperCardHeader>
          <PaperCardTitle className="flex items-center justify-between">
            <span>自定义测量字段</span>
            <PaperButton
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => initEditField()}
            >
              添加字段
            </PaperButton>
          </PaperCardTitle>
        </PaperCardHeader>
        <PaperCardContent>
          {customFields.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              暂无自定义测量字段，点击上方按钮添加
            </div>
          ) : (
            <div className="space-y-3">
              {customFields.map((field) => (
                <div key={field.id} className="border rounded p-3 flex items-center justify-between bg-gray-50">
                  <div className="flex-1">
                    <div className="font-medium">{field.label}</div>
                    <div className="text-sm text-gray-600">
                      {field.name} ({field.type})
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                      {field.unit && <span className="ml-1">{field.unit}</span>}
                    </div>
                    {field.description && (
                      <div className="text-xs text-gray-500 mt-1">{field.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <PaperButton
                      variant="ghost"
                      size="sm"
                      leftIcon={<MoveUp className="h-4 w-4" />}
                      onClick={() => handleMoveField(field.id, 'up')}
                      disabled={field.order === 1}
                    />
                    <PaperButton
                      variant="ghost"
                      size="sm"
                      leftIcon={<MoveDown className="h-4 w-4" />}
                      onClick={() => handleMoveField(field.id, 'down')}
                      disabled={field.order === customFields.length}
                    />
                    <PaperButton
                      variant="ghost"
                      size="sm"
                      leftIcon={<Edit2 className="h-4 w-4" />}
                      onClick={() => initEditField(field)}
                    >
                      编辑
                    </PaperButton>
                    <PaperButton
                      variant="ghost"
                      size="sm"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => handleDeleteField(field.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      删除
                    </PaperButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PaperCardContent>
      </PaperCard>

      {/* 计算公式 */}
      <PaperCard>
        <PaperCardHeader>
          <PaperCardTitle className="flex items-center justify-between">
            <span>计算公式</span>
            <PaperButton
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => initEditFormula()}
            >
              添加公式
            </PaperButton>
          </PaperCardTitle>
        </PaperCardHeader>
        <PaperCardContent>
          {calculationFormulas.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              暂无计算公式，点击上方按钮添加
            </div>
          ) : (
            <div className="space-y-3">
              {calculationFormulas.map((formula) => (
                <div key={formula.id} className="border rounded p-3 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{formula.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <strong>公式:</strong> {formula.formula}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <strong>结果字段:</strong> {formula.resultField}
                      </div>
                      {formula.description && (
                        <div className="text-xs text-gray-500 mt-1">{formula.description}</div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <PaperCheckbox
                          checked={formula.enabled}
                          onCheckedChange={(checked) => {
                            setCalculationFormulas(calculationFormulas.map(f => 
                              f.id === formula.id ? { ...f, enabled: checked || false } : f
                            ));
                          }}
                        >
                          启用
                        </PaperCheckbox>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PaperButton
                        variant="ghost"
                        size="sm"
                        leftIcon={<Edit2 className="h-4 w-4" />}
                        onClick={() => initEditFormula(formula)}
                      >
                        编辑
                      </PaperButton>
                      <PaperButton
                        variant="ghost"
                        size="sm"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        onClick={() => handleDeleteFormula(formula.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        删除
                      </PaperButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PaperCardContent>
      </PaperCard>

      {/* 质量标准 */}
      <PaperCard>
        <PaperCardHeader>
          <PaperCardTitle className="flex items-center justify-between">
            <span>质量标准</span>
            <PaperButton
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => initEditQuality()}
            >
              添加标准
            </PaperButton>
          </PaperCardTitle>
        </PaperCardHeader>
        <PaperCardContent>
          {qualityStandards.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              暂无质量标准，点击上方按钮添加
            </div>
          ) : (
            <div className="space-y-3">
              {qualityStandards.map((standard) => (
                <div key={standard.id} className="border rounded p-3 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{standard.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <strong>关联字段:</strong> {standard.fieldName}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <strong>严重程度:</strong> 
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${standard.severity === 'low' ? 'bg-green-100 text-green-800' : standard.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {standard.severity === 'low' ? '低' : standard.severity === 'medium' ? '中' : '高'}
                        </span>
                      </div>
                      {standard.minValue !== undefined && standard.maxValue !== undefined && (
                        <div className="text-sm text-gray-600 mt-1">
                          <strong>取值范围:</strong> {standard.minValue} - {standard.maxValue}
                          {standard.tolerance && <span className="ml-1">（容差: {standard.tolerance}）</span>}
                        </div>
                      )}
                      {standard.description && (
                        <div className="text-xs text-gray-500 mt-1">{standard.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <PaperButton
                        variant="ghost"
                        size="sm"
                        leftIcon={<Edit2 className="h-4 w-4" />}
                        onClick={() => initEditQuality(standard)}
                      >
                        编辑
                      </PaperButton>
                      <PaperButton
                        variant="ghost"
                        size="sm"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        onClick={() => handleDeleteQuality(standard.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        删除
                      </PaperButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PaperCardContent>
      </PaperCard>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-3 pt-4">
        <PaperButton variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" /> 取消
        </PaperButton>
        <PaperButton variant="primary" onClick={handleSave} disabled={isLoading}>
          <Save className="h-4 w-4 mr-1" /> {isLoading ? '保存中...' : '保存'}
        </PaperButton>
      </div>

      {/* 自定义字段编辑模态框 */}
      <PaperModal
        isOpen={showFieldModal}
        onClose={() => {
          setShowFieldModal(false);
          setEditingField(null);
        }}
        title={editingField?.id ? '编辑自定义字段' : '添加自定义字段'}
      >
        <div className="space-y-4">
          <PaperInput
            label="字段名称"
            value={editingField?.name || ''}
            onChange={(e) => setEditingField(prev => ({ ...prev!, name: e.target.value }))}
            placeholder="请输入字段名称"
            required
          />
          
          <PaperInput
            label="显示标签"
            value={editingField?.label || ''}
            onChange={(e) => setEditingField(prev => ({ ...prev!, label: e.target.value }))}
            placeholder="请输入显示标签"
            required
          />
          
          <PaperSelect
            label="字段类型"
            value={editingField?.type || 'number'}
            onChange={(value) => setEditingField(prev => ({ ...prev!, type: value as any }))}
            options={fieldTypes}
            required
          />
          
          <PaperInput
            label="单位"
            value={editingField?.unit || ''}
            onChange={(e) => setEditingField(prev => ({ ...prev!, unit: e.target.value }))}
            placeholder="请输入单位（如：m、cm、kg等）"
          />
          
          <PaperTextarea
            label="描述"
            value={editingField?.description || ''}
            onChange={(e) => setEditingField(prev => ({ ...prev!, description: e.target.value }))}
            placeholder="请输入字段描述"
            rows={3}
          />
          
          <PaperCheckbox
            checked={editingField?.required || false}
            onCheckedChange={(checked) => setEditingField(prev => ({ ...prev!, required: checked || false }))}
          >
            必填字段
          </PaperCheckbox>
          
          <div className="flex justify-end gap-2 pt-2">
            <PaperButton variant="outline" onClick={() => {
              setShowFieldModal(false);
              setEditingField(null);
            }}>
              取消
            </PaperButton>
            <PaperButton variant="primary" onClick={handleFieldSave}>
              保存
            </PaperButton>
          </div>
        </div>
      </PaperModal>

      {/* 计算公式编辑模态框 */}
      <PaperModal
        isOpen={showFormulaModal}
        onClose={() => {
          setShowFormulaModal(false);
          setEditingFormula(null);
        }}
        title={editingFormula?.id ? '编辑计算公式' : '添加计算公式'}
      >
        <div className="space-y-4">
          <PaperInput
            label="公式名称"
            value={editingFormula?.name || ''}
            onChange={(e) => setEditingFormula(prev => ({ ...prev!, name: e.target.value }))}
            placeholder="请输入公式名称"
            required
          />
          
          <PaperInput
            label="公式内容"
            value={editingFormula?.formula || ''}
            onChange={(e) => setEditingFormula(prev => ({ ...prev!, formula: e.target.value }))}
            placeholder="请输入计算公式（如：length * width）"
            required
          />
          
          <PaperInput
            label="结果字段名称"
            value={editingFormula?.resultField || ''}
            onChange={(e) => setEditingFormula(prev => ({ ...prev!, resultField: e.target.value }))}
            placeholder="请输入结果字段名称"
            required
          />
          
          <PaperTextarea
            label="描述"
            value={editingFormula?.description || ''}
            onChange={(e) => setEditingFormula(prev => ({ ...prev!, description: e.target.value }))}
            placeholder="请输入公式描述"
            rows={3}
          />
          
          <PaperCheckbox
            checked={editingFormula?.enabled || false}
            onCheckedChange={(checked) => setEditingFormula(prev => ({ ...prev!, enabled: checked || false }))}
          >
            启用公式
          </PaperCheckbox>
          
          <div className="flex justify-end gap-2 pt-2">
            <PaperButton variant="outline" onClick={() => {
              setShowFormulaModal(false);
              setEditingFormula(null);
            }}>
              取消
            </PaperButton>
            <PaperButton variant="primary" onClick={handleFormulaSave}>
              保存
            </PaperButton>
          </div>
        </div>
      </PaperModal>

      {/* 质量标准编辑模态框 */}
      <PaperModal
        isOpen={showQualityModal}
        onClose={() => {
          setShowQualityModal(false);
          setEditingQuality(null);
        }}
        title={editingQuality?.id ? '编辑质量标准' : '添加质量标准'}
      >
        <div className="space-y-4">
          <PaperInput
            label="标准名称"
            value={editingQuality?.name || ''}
            onChange={(e) => setEditingQuality(prev => ({ ...prev!, name: e.target.value }))}
            placeholder="请输入标准名称"
            required
          />
          
          <PaperInput
            label="关联字段名称"
            value={editingQuality?.fieldName || ''}
            onChange={(e) => setEditingQuality(prev => ({ ...prev!, fieldName: e.target.value }))}
            placeholder="请输入关联字段名称"
            required
          />
          
          <PaperSelect
            label="严重程度"
            value={editingQuality?.severity || 'medium'}
            onChange={(value) => setEditingQuality(prev => ({ ...prev!, severity: value as 'low' | 'medium' | 'high' }))}
            options={severityOptions}
            required
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PaperInput
              label="最小值"
              type="number"
              value={editingQuality?.minValue?.toString() || ''}
              onChange={(e) => setEditingQuality(prev => ({ ...prev!, minValue: parseFloat(e.target.value) || undefined }))}
              placeholder="请输入最小值"
            />
            
            <PaperInput
              label="最大值"
              type="number"
              value={editingQuality?.maxValue?.toString() || ''}
              onChange={(e) => setEditingQuality(prev => ({ ...prev!, maxValue: parseFloat(e.target.value) || undefined }))}
              placeholder="请输入最大值"
            />
            
            <PaperInput
              label="容差"
              type="number"
              value={editingQuality?.tolerance?.toString() || ''}
              onChange={(e) => setEditingQuality(prev => ({ ...prev!, tolerance: parseFloat(e.target.value) || undefined }))}
              placeholder="请输入容差"
            />
          </div>
          
          <PaperTextarea
            label="描述"
            value={editingQuality?.description || ''}
            onChange={(e) => setEditingQuality(prev => ({ ...prev!, description: e.target.value }))}
            placeholder="请输入标准描述"
            rows={3}
          />
          
          <div className="flex justify-end gap-2 pt-2">
            <PaperButton variant="outline" onClick={() => {
              setShowQualityModal(false);
              setEditingQuality(null);
            }}>
              取消
            </PaperButton>
            <PaperButton variant="primary" onClick={handleQualitySave}>
              保存
            </PaperButton>
          </div>
        </div>
      </PaperModal>
    </div>
);
}
