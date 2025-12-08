'use client'

import React, { useState, useEffect } from 'react'

import { CurtainPackageSelector } from '@/features/orders/components/curtain-package-selector'
import { CustomerInfoSection } from '@/features/orders/components/customer-info-section'
import { OrderSummary } from '@/features/orders/components/order-summary'
import { OrderTabs } from '@/features/orders/components/order-tabs'
import { SpaceProductSection } from '@/features/orders/components/space-product-section'
import { useOrderCalculation } from '@/hooks/useOrderCalculation'
import { useOrderItems } from '@/hooks/useOrderItems'
import { useOrderPersistence } from '@/hooks/useOrderPersistence'
import { OrderFormData, PackageDefinition, AVAILABLE_PACKAGES } from '@/shared/types/order'
import { TRACK_EVENT } from '@/utils/analytics'
// import { useOrderValidation } from '@/hooks/useOrderValidation' // Not used yet

interface OrderCreateViewProps {
    initialLeadId?: string | null
    initialOrderData?: OrderFormData
    mode?: 'create' | 'edit'
    orderId?: string
}

export function OrderCreateView({
    initialLeadId,
    initialOrderData,
    mode = 'create',
    orderId
}: OrderCreateViewProps) {
    // 选项卡状态
    const [activeTab, setActiveTab] = useState('summary')

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
    })

    // 选中的全局套餐 (用于窗帘)
    const [selectedPackage, setSelectedPackage] = useState<PackageDefinition | undefined>()

    // ========== 使用自定义 Hooks ==========

    // 1. 计算逻辑
    const amounts = useOrderCalculation(formData)

    // 2. 持久化
    const { saveDraft, loadDraft, submitOrder, isSaving, isSubmitting } =
        useOrderPersistence(formData.leadId, orderId)

    // 3. 商品操作
    const { addItem, updateItem, deleteItem } = useOrderItems(formData, setFormData)

    // 4. 表单验证
    // const { errors, isValid } = useOrderValidation(formData) // Not used yet

    // ========== 更新表单数据 ==========
    const updateFormData = (updates: Partial<OrderFormData>) => {
        setFormData(prev => ({ ...prev, ...updates }))
    }

    // 同步计算结果到 formData
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            ...amounts
        }))
    }, [amounts])

    // ========== 套餐管理 ==========
    const handleGlobalPackageChange = (packageId: string) => {
        const pkg = AVAILABLE_PACKAGES.find(p => p.id === packageId)
        setSelectedPackage(pkg)

        setFormData(prevData => {
            // 获取当前所有有窗帘的空间
            const spaces = Array.from(new Set(prevData.curtains.map(item => item.space).filter(Boolean)))

            const newSpacePackages = { ...prevData.spacePackages }

            // 为所有空间应用此套餐
            spaces.forEach(space => {
                if (packageId) {
                    newSpacePackages[space] = packageId
                } else {
                    delete newSpacePackages[space]
                }
            })

            // 更新商品状态
            const newCurtains = prevData.curtains.map(item => {
                const isPackage = !!packageId && !!item.packageTag
                return {
                    ...item,
                    isPackageItem: isPackage,
                    packageType: isPackage && !item.packageType ? 'cloth' : item.packageType
                }
            })

            return {
                ...prevData,
                spacePackages: newSpacePackages,
                curtains: newCurtains
            }
        })
    }

    // ========== 加载草稿 ==========
    useEffect(() => {
        if (mode === 'create' && initialLeadId) {
            const draft = loadDraft()
            if (draft) {
                setFormData(draft)

                // 恢复选中的套餐状态
                const firstSpacePackage = Object.values(draft.spacePackages || {})[0]
                if (firstSpacePackage) {
                    const pkg = AVAILABLE_PACKAGES.find(p => p.id === firstSpacePackage)
                    setSelectedPackage(pkg)
                }
            }
        }
    }, [initialLeadId, loadDraft, mode])

    // If in edit mode and initialOrderData provided, ensure selectedPackage is set
    useEffect(() => {
        if (mode === 'edit' && initialOrderData) {
            const firstSpacePackage = Object.values(initialOrderData.spacePackages || {})[0]
            if (firstSpacePackage) {
                const pkg = AVAILABLE_PACKAGES.find(p => p.id === firstSpacePackage)
                setSelectedPackage(pkg)
            }
        }
    }, [mode, initialOrderData])


    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-ink-800">{mode === 'edit' ? '编辑订单' : '开单'}</h1>
                    <p className="text-ink-500 mt-1">{mode === 'edit' ? '修改订单信息' : '创建新订单 / 编辑报价单'}</p>
                </div>
            </div>

            {/* 客户基础信息 */}
            <CustomerInfoSection
                leadNumber={formData.leadNumber}
                customerName={formData.customerName}
                customerPhone={formData.customerPhone}
                projectAddress={formData.projectAddress}
                designer={formData.designer}
                salesPerson={formData.salesPerson}
                createTime={formData.createTime || ''}
                expectedDeliveryTime={formData.expectedDeliveryTime}
                onDesignerChange={(value) => updateFormData({ designer: value })}
                onSalesPersonChange={(value) => updateFormData({ salesPerson: value })}
                onExpectedDeliveryTimeChange={(value) => updateFormData({ expectedDeliveryTime: value })}
                onLeadNumberChange={(value) => updateFormData({ leadNumber: value })}
                onCustomerNameChange={(value) => updateFormData({ customerName: value })}
                onCustomerPhoneChange={(value) => updateFormData({ customerPhone: value })}
                onProjectAddressChange={(value) => updateFormData({ projectAddress: value })}
            />

            {/* 选项卡导航 */}
            <OrderTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* 选项卡内容 */}
            <div className="min-h-[400px]">
                {/* 合计 Tab */}
                {activeTab === 'summary' && (
                    <div className="space-y-6">
                        <OrderSummary
                            subtotals={formData.subtotals}
                            packageAmount={formData.packageAmount}
                            packageExcessAmount={formData.packageExcessAmount}
                            upgradeAmount={formData.upgradeAmount}
                            totalAmount={formData.totalAmount}
                            onSaveDraft={() => {
                                TRACK_EVENT('Order', 'Save Draft', orderId || 'new', {
                                    leadId: formData.leadId,
                                    amount: formData.totalAmount
                                })
                                saveDraft(formData)
                            }}
                            onSubmit={() => {
                                TRACK_EVENT('Order', 'Submit', orderId || 'new', {
                                    leadId: formData.leadId,
                                    amount: formData.totalAmount
                                })
                                submitOrder(formData)
                            }}
                            isSaving={isSaving}
                            isSubmitting={isSubmitting}
                        />
                    </div>
                )}

                {/* 窗帘 Tab */}
                {activeTab === 'curtain' && (
                    <div className="space-y-6">
                        {/* 套餐选择器 */}
                        <CurtainPackageSelector
                            selectedPackage={selectedPackage}
                            onPackageChange={handleGlobalPackageChange}
                        />

                        {/* 空间商品列表 */}
                        <SpaceProductSection
                            category="curtain"
                            items={formData.curtains}
                            selectedPackage={selectedPackage}
                            onAddItem={(space) => addItem('curtain', space)}
                            onUpdateItem={(id, updates) => updateItem('curtain', id, updates)}
                            onDeleteItem={(id) => deleteItem('curtain', id)}
                        />
                    </div>
                )}

                {/* 墙布 Tab */}
                {activeTab === 'wallcovering' && (
                    <SpaceProductSection
                        category="wallcovering"
                        items={formData.wallcoverings}
                        onAddItem={(space) => addItem('wallcovering', space)}
                        onUpdateItem={(id, updates) => updateItem('wallcovering', id, updates)}
                        onDeleteItem={(id) => deleteItem('wallcovering', id)}
                    />
                )}

                {/* 墙咔 (背景墙) Tab */}
                {activeTab === 'background-wall' && (
                    <SpaceProductSection
                        category="background-wall"
                        items={formData.backgroundWalls}
                        onAddItem={(space) => addItem('background-wall', space)}
                        onUpdateItem={(id, updates) => updateItem('background-wall', id, updates)}
                        onDeleteItem={(id) => deleteItem('background-wall', id)}
                    />
                )}

                {/* 飘窗垫 Tab */}
                {activeTab === 'window-cushion' && (
                    <SpaceProductSection
                        category="window-cushion"
                        items={formData.windowCushions}
                        onAddItem={(space) => addItem('window-cushion', space)}
                        onUpdateItem={(id, updates) => updateItem('window-cushion', id, updates)}
                        onDeleteItem={(id) => deleteItem('window-cushion', id)}
                    />
                )}
            </div>
        </div>
    )
}
