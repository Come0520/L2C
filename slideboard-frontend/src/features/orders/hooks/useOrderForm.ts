import { useState, useEffect } from 'react';

import { useOrderCalculation } from '@/hooks/useOrderCalculation';
import { useOrderItems } from '@/hooks/useOrderItems';
import { useOrderPersistence } from '@/hooks/useOrderPersistence';
import { OrderFormData, PackageDefinition, AVAILABLE_PACKAGES } from '@/shared/types/order';

interface UseOrderFormProps {
  initialLeadId?: string | null;
  initialOrderData?: OrderFormData;
  mode?: 'create' | 'edit';
  orderId?: string;
}

export function useOrderForm({
  initialLeadId,
  initialOrderData,
  mode = 'create',
  orderId,
}: UseOrderFormProps) {
  // 表单状态
  const [formData, setFormData] = useState<OrderFormData>(initialOrderData || {
    // 客户基础信息
    leadId: initialLeadId || 'LL2024010001',
    leadNumber: 'LL2024010001',
    customerName: '张三',
    customerPhone: '138****8888',
    projectAddress: '北京市朝阳区某某小区1号楼101',

    // 订单信息
    designer: '',
    salesPerson: '',
    createTime: new Date().toISOString().split('T')[0] || '',
    expectedDeliveryTime: '',

    // 套餐信息 (按空间)
    spacePackages: {},

    // 兼容旧字段
    packageUsage: { cloth: 0, gauze: 0, track: 0 },

    // 商品列表
    curtains: [],
    wallcoverings: [],
    backgroundWalls: [],
    windowCushions: [],
    standardProducts: [],

    // 金额汇总
    subtotals: {
      curtain: 0,
      wallcovering: 0,
      'background-wall': 0,
      'window-cushion': 0,
      'standard-product': 0
    },
    packageAmount: 0,
    packageExcessAmount: 0,
    upgradeAmount: 0,
    totalAmount: 0
  });

  // 选中的全局套餐 (用于窗帘)
  const [selectedPackage, setSelectedPackage] = useState<PackageDefinition | undefined>();

  // 1. 计算逻辑
  const amounts = useOrderCalculation(formData);

  // 2. 持久化
  const { saveDraft, loadDraft, submitOrder, isSaving, isSubmitting } =
    useOrderPersistence(formData.leadId, orderId);

  // 3. 商品操作
  const { addItem, updateItem, deleteItem } = useOrderItems(formData, setFormData);

  // ========== 更新表单数据 ==========
  const updateFormData = (updates: Partial<OrderFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // 同步计算结果到 formData
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...amounts
    }));
  }, [amounts]);

  // ========== 套餐管理 ==========
  const handleGlobalPackageChange = (packageId: string) => {
    const pkg = AVAILABLE_PACKAGES.find(p => p.id === packageId);
    setSelectedPackage(pkg);

    setFormData(prevData => {
      // 获取当前所有有窗帘的空间
      const spaces = Array.from(new Set(prevData.curtains.map(item => item.space).filter(Boolean)));

      const newSpacePackages = { ...prevData.spacePackages };

      // 为所有空间应用此套餐
      spaces.forEach(space => {
        if (packageId) {
          newSpacePackages[space] = packageId;
        } else {
          delete newSpacePackages[space];
        }
      });

      // 更新商品状态
      const newCurtains = prevData.curtains.map(item => {
        const isPackage = !!packageId && !!item.packageTag;
        return {
          ...item,
          isPackageItem: isPackage,
          packageType: isPackage && !item.packageType ? 'cloth' : item.packageType
        };
      });

      return {
        ...prevData,
        spacePackages: newSpacePackages,
        curtains: newCurtains
      };
    });
  };

  // ========== 加载草稿 ==========
  useEffect(() => {
    if (mode === 'create' && initialLeadId) {
      const draft = loadDraft();
      if (draft) {
        setFormData(draft);

        // 恢复选中的套餐状态
        const firstSpacePackage = Object.values(draft.spacePackages || {})[0];
        if (firstSpacePackage) {
          const pkg = AVAILABLE_PACKAGES.find(p => p.id === firstSpacePackage);
          setSelectedPackage(pkg);
        }
      }
    }
  }, [initialLeadId, loadDraft, mode]);

  // If in edit mode and initialOrderData provided, ensure selectedPackage is set
  useEffect(() => {
    if (mode === 'edit' && initialOrderData) {
      const firstSpacePackage = Object.values(initialOrderData.spacePackages || {})[0];
      if (firstSpacePackage) {
        const pkg = AVAILABLE_PACKAGES.find(p => p.id === firstSpacePackage);
        setSelectedPackage(pkg);
      }
    }
  }, [mode, initialOrderData]);

  return {
    formData,
    updateFormData,
    selectedPackage,
    handleGlobalPackageChange,
    addItem,
    updateItem,
    deleteItem,
    saveDraft,
    submitOrder,
    isSaving,
    isSubmitting
  };
}
