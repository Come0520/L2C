// 测量模板钩子

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { MeasurementTemplatesClient } from '@/services/measurement-templates.client';
import { 
  MeasurementTemplate, 
  CreateMeasurementTemplateRequest, 
  UpdateMeasurementTemplateRequest 
} from '@/types/measurement-template';

/**
 * 使用测量模板钩子
 */
export function useMeasurementTemplates() {
  const queryClient = useQueryClient();

  // 查询键
  const templatesQueryKey = ['measurementTemplates'];

  /**
   * 获取测量模板列表
   */
  const { 
    data: templates, 
    isLoading: isLoadingTemplates, 
    error: templatesError, 
    refetch: refetchTemplates 
  } = useQuery<MeasurementTemplate[]>({
    queryKey: templatesQueryKey,
    queryFn: () => MeasurementTemplatesClient.getTemplates(),
    staleTime: 5 * 60 * 1000, // 5分钟
  });

  useRealtimeSubscription({
    table: 'measurement_templates',
    event: '*',
    channelName: 'measurement_templates:list',
    handler: () => {
      queryClient.invalidateQueries({ queryKey: templatesQueryKey })
    }
  })

  // 移除getTemplate方法，因为在非Hook函数中使用useQuery违反Hooks规则
  // 建议创建一个单独的useMeasurementTemplate(id)钩子来获取单个模板

  /**
   * 创建测量模板
   */
  const createTemplateMutation = useMutation<MeasurementTemplate, Error, CreateMeasurementTemplateRequest>({
    mutationFn: (data) => MeasurementTemplatesClient.createTemplate(data),
    onSuccess: () => {
      // 无效化模板列表缓存
      queryClient.invalidateQueries({ queryKey: templatesQueryKey });
    },
  });

  /**
   * 更新测量模板
   */
  const updateTemplateMutation = useMutation<MeasurementTemplate, Error, { id: string; data: UpdateMeasurementTemplateRequest }>({
    mutationFn: ({ id, data }) => MeasurementTemplatesClient.updateTemplate(id, data),
    onSuccess: () => {
      // 无效化模板列表和单个模板缓存
      queryClient.invalidateQueries({ queryKey: templatesQueryKey });
    },
  });

  /**
   * 删除测量模板
   */
  const deleteTemplateMutation = useMutation<boolean, Error, string>({
    mutationFn: (id) => MeasurementTemplatesClient.deleteTemplate(id),
    onSuccess: () => {
      // 无效化模板列表缓存
      queryClient.invalidateQueries({ queryKey: templatesQueryKey });
    },
  });

  /**
   * 获取默认测量模板
   */
  const { 
    data: defaultTemplate, 
    isLoading: isLoadingDefaultTemplate, 
    error: defaultTemplateError 
  } = useQuery<MeasurementTemplate | null>({
    queryKey: [...templatesQueryKey, 'default'],
    queryFn: () => MeasurementTemplatesClient.getDefaultTemplate(),
    staleTime: 5 * 60 * 1000, // 5分钟
  });

  useRealtimeSubscription({
    table: 'measurement_templates',
    event: '*',
    channelName: 'measurement_templates:default',
    handler: () => {
      queryClient.invalidateQueries({ queryKey: [...templatesQueryKey, 'default'] })
    }
  })

  return {
    // 模板列表
    templates,
    isLoadingTemplates,
    templatesError,
    refetchTemplates,
    
    // 创建模板
    createTemplate: createTemplateMutation.mutateAsync,
    isCreatingTemplate: createTemplateMutation.isPending,
    createTemplateError: createTemplateMutation.error,
    
    // 更新模板
    updateTemplate: updateTemplateMutation.mutateAsync,
    isUpdatingTemplate: updateTemplateMutation.isPending,
    updateTemplateError: updateTemplateMutation.error,
    
    // 删除模板
    deleteTemplate: deleteTemplateMutation.mutateAsync,
    isDeletingTemplate: deleteTemplateMutation.isPending,
    deleteTemplateError: deleteTemplateMutation.error,
    
    // 默认模板
    defaultTemplate,
    isLoadingDefaultTemplate,
    defaultTemplateError
  };
}
import { useRealtimeSubscription } from './useRealtimeSubscription'
