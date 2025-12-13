'use client';

import { useState } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperInput } from '@/components/ui/paper-input';
import { PaperModal } from '@/components/ui/paper-modal';
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table';

interface Supplier {
  id: string;
  name: string;
  type: 'material' | 'service' | 'logistics';
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  rating: number;
  cooperationStatus: 'active' | 'pending' | 'suspended';
  serviceScope: string[];
  contractExpiry: string;
  monthlyCapacity: number;
}

interface ServiceProvider {
  id: string;
  name: string;
  serviceType: 'design' | 'construction' | 'installation' | 'maintenance';
  specialty: string;
  contactPerson: string;
  phone: string;
  qualificationLevel: 'A' | 'B' | 'C';
  rating: number;
  projectCount: number;
  status: 'available' | 'busy' | 'offline';
  priceRange: string;
}

export default function SuppliersPage() {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'services'>('suppliers');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceProvider | null>(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  const suppliers: Supplier[] = [
    {
      id: 'SUP001',
      name: '金牌建材供应商',
      type: 'material',
      contactPerson: '张经理',
      phone: '138-0000-1001',
      email: 'zhang@goldbuilding.com',
      address: '北京市朝阳区建材大厦A座',
      rating: 4.8,
      cooperationStatus: 'active',
      serviceScope: ['瓷砖', '地板', '卫浴', '橱柜'],
      contractExpiry: '2024-12-31',
      monthlyCapacity: 500000
    },
    {
      id: 'SUP002',
      name: '绿色家居服务',
      type: 'service',
      contactPerson: '李总监',
      phone: '139-0000-1002',
      email: 'li@greenhome.com',
      address: '上海市浦东新区环保园区',
      rating: 4.6,
      cooperationStatus: 'active',
      serviceScope: ['室内空气质量检测', '环保材料供应', '除甲醛服务'],
      contractExpiry: '2024-10-15',
      monthlyCapacity: 200
    },
    {
      id: 'SUP003',
      name: '快捷物流配送',
      type: 'logistics',
      contactPerson: '王调度',
      phone: '137-0000-1003',
      email: 'wang@expresslog.com',
      address: '广州市天河区物流园区',
      rating: 4.4,
      cooperationStatus: 'pending',
      serviceScope: ['同城配送', '跨省运输', '仓储服务'],
      contractExpiry: '2024-08-30',
      monthlyCapacity: 1000
    }
  ];

  const serviceProviders: ServiceProvider[] = [
    {
      id: 'SVC001',
      name: '创意设计工作室',
      serviceType: 'design',
      specialty: '现代简约风格',
      contactPerson: '陈设计师',
      phone: '136-0000-2001',
      qualificationLevel: 'A',
      rating: 4.9,
      projectCount: 156,
      status: 'available',
      priceRange: '¥200-500/㎡'
    },
    {
      id: 'SVC002',
      name: '精工装修团队',
      serviceType: 'construction',
      specialty: '精装修工程',
      contactPerson: '刘工长',
      phone: '135-0000-2002',
      qualificationLevel: 'A',
      rating: 4.7,
      projectCount: 89,
      status: 'busy',
      priceRange: '¥800-1200/㎡'
    },
    {
      id: 'SVC003',
      name: '智能家居安装',
      serviceType: 'installation',
      specialty: '智能系统集成',
      contactPerson: '赵技师',
      phone: '134-0000-2003',
      qualificationLevel: 'B',
      rating: 4.5,
      projectCount: 234,
      status: 'available',
      priceRange: '¥100-300/点'
    }
  ];

  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.serviceScope.some(scope => scope.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredServices = serviceProviders.filter(provider =>
    provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'material': return '材料供应商';
      case 'service': return '服务商';
      case 'logistics': return '物流商';
      case 'design': return '设计服务';
      case 'construction': return '施工服务';
      case 'installation': return '安装服务';
      case 'maintenance': return '维护服务';
      default: return type;
    }
  };

  return (
    <>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Page Header - Removed to avoid duplication with DashboardLayout breadcrumb */}


        {/* Tab Navigation */}
        <PaperCard className="bg-theme-bg-secondary border-theme-border">
          <PaperCardContent className="p-0">
            <div className="border-b border-theme-border">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('suppliers')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'suppliers'
                      ? 'border-theme-primary text-theme-text-primary'
                      : 'border-transparent text-theme-text-secondary hover:text-theme-text-primary'
                  }`}
                >
                  供应商管理
                </button>
                <button
                  onClick={() => setActiveTab('services')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'services'
                      ? 'border-theme-primary text-theme-text-primary'
                      : 'border-transparent text-theme-text-secondary hover:text-theme-text-primary'
                  }`}
                >
                  服务商管理
                </button>
              </nav>
            </div>
          </PaperCardContent>
        </PaperCard>

        {/* Search and Filter */}
        <PaperCard className="bg-theme-bg-secondary border-theme-border">
          <PaperCardContent>
            <div className="flex items-center gap-4 justify-between">
              <PaperInput
                placeholder={`搜索${activeTab === 'suppliers' ? '供应商' : '服务商'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 max-w-md"
              />
              <div className="flex gap-3">
                <PaperButton variant="outline">
                  高级筛选
                </PaperButton>
                {activeTab === 'suppliers' ? (
                  <PaperButton variant="primary">
                    新增供应商
                  </PaperButton>
                ) : (
                  <PaperButton variant="secondary">
                    新增服务商
                  </PaperButton>
                )}
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>

        {/* Suppliers Tab */}
        {activeTab === 'suppliers' && (
          <PaperCard className="bg-theme-bg-secondary border-theme-border">
            <PaperCardHeader>
              <PaperCardTitle className="text-theme-text-primary">供应商列表</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <PaperTable>
                <PaperTableHeader>
                  <tr>
                    <th className="text-left text-theme-text-secondary">供应商信息</th>
                    <th className="text-left text-theme-text-secondary">类型</th>
                    <th className="text-left text-theme-text-secondary">联系方式</th>
                    <th className="text-left text-theme-text-secondary">评级</th>
                    <th className="text-left text-theme-text-secondary">合作状态</th>
                    <th className="text-left text-theme-text-secondary">合同到期</th>
                    <th className="text-left text-theme-text-secondary">操作</th>
                  </tr>
                </PaperTableHeader>
                <PaperTableBody>
                  {filteredSuppliers.map((supplier) => (
                    <PaperTableRow key={supplier.id}>
                      <PaperTableCell>
                        <div>
                          <div className="font-medium text-theme-text-primary">{supplier.name}</div>
                          <div className="text-sm text-theme-text-secondary">{supplier.contactPerson}</div>
                        </div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-paper-primary-light text-paper-primary">
                          {getTypeLabel(supplier.type)}
                        </span>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="text-sm">
                          <div>{supplier.phone}</div>
                          <div className="text-theme-text-secondary">{supplier.email}</div>
                        </div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="flex items-center">
                          <span className="text-paper-warning">★</span>
                          <span className="ml-1 font-medium">{supplier.rating}</span>
                        </div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          supplier.cooperationStatus === 'active' ? 'bg-paper-success-light text-paper-success' :
                          supplier.cooperationStatus === 'pending' ? 'bg-paper-warning-light text-paper-warning' :
                          'bg-paper-error-light text-paper-error'
                        }`}>
                          {supplier.cooperationStatus === 'active' ? '合作中' :
                           supplier.cooperationStatus === 'pending' ? '待审核' : '已暂停'}
                        </span>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="text-sm">
                          <div>{supplier.contractExpiry}</div>
                          <div className="text-theme-text-secondary">
                            {Math.ceil((new Date(supplier.contractExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}天后到期
                          </div>
                        </div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="flex gap-2">
                          <PaperButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setShowSupplierModal(true);
                            }}
                          >
                            详情
                          </PaperButton>
                          <PaperButton variant="ghost" size="sm">
                            编辑
                          </PaperButton>
                        </div>
                      </PaperTableCell>
                    </PaperTableRow>
                  ))}
                </PaperTableBody>
              </PaperTable>
            </PaperCardContent>
          </PaperCard>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <PaperCard className="bg-theme-bg-secondary border-theme-border">
            <PaperCardHeader>
              <PaperCardTitle className="text-theme-text-primary">服务商列表</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <PaperTable>
                <PaperTableHeader>
                  <tr>
                    <th className="text-left text-theme-text-secondary">服务商信息</th>
                    <th className="text-left text-theme-text-secondary">服务类型</th>
                    <th className="text-left text-theme-text-secondary">专业领域</th>
                    <th className="text-left text-theme-text-secondary">资质等级</th>
                    <th className="text-left text-theme-text-secondary">评级</th>
                    <th className="text-left text-theme-text-secondary">项目数</th>
                    <th className="text-left text-theme-text-secondary">状态</th>
                    <th className="text-left text-theme-text-secondary">价格区间</th>
                    <th className="text-left text-theme-text-secondary">操作</th>
                  </tr>
                </PaperTableHeader>
                <PaperTableBody>
                  {filteredServices.map((provider) => (
                    <PaperTableRow key={provider.id}>
                      <PaperTableCell>
                        <div>
                          <div className="font-medium text-theme-text-primary">{provider.name}</div>
                          <div className="text-sm text-theme-text-secondary">{provider.contactPerson}</div>
                        </div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-paper-info-light text-paper-info">
                          {getTypeLabel(provider.serviceType)}
                        </span>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="text-sm text-theme-text-primary">{provider.specialty}</div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          provider.qualificationLevel === 'A' ? 'bg-paper-success-light text-paper-success' :
                          provider.qualificationLevel === 'B' ? 'bg-paper-warning-light text-paper-warning' :
                          'bg-paper-error-light text-paper-error'
                        }`}>
                          {provider.qualificationLevel}级资质
                        </span>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="flex items-center">
                          <span className="text-paper-warning">★</span>
                          <span className="ml-1 font-medium">{provider.rating}</span>
                        </div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="font-medium">{provider.projectCount}</div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          provider.status === 'available' ? 'bg-paper-success-light text-paper-success' :
                          provider.status === 'busy' ? 'bg-paper-warning-light text-paper-warning' :
                          'bg-paper-error-light text-paper-error'
                        }`}>
                          {provider.status === 'available' ? '可接单' :
                           provider.status === 'busy' ? '忙碌中' : '离线'}
                        </span>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="text-sm font-medium text-paper-primary">{provider.priceRange}</div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="flex gap-2">
                          <PaperButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedService(provider);
                              setShowServiceModal(true);
                            }}
                          >
                            详情
                          </PaperButton>
                          <PaperButton variant="ghost" size="sm">
                            预约
                          </PaperButton>
                        </div>
                      </PaperTableCell>
                    </PaperTableRow>
                  ))}
                </PaperTableBody>
              </PaperTable>
            </PaperCardContent>
          </PaperCard>
        )}

        {/* Supply Chain Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PaperCard className="bg-theme-bg-secondary border-theme-border">
            <PaperCardHeader>
              <PaperCardTitle className="text-theme-text-primary">供应链概览</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-theme-text-secondary">活跃供应商</span>
                  <span className="font-bold text-paper-success">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-theme-text-secondary">待审核供应商</span>
                  <span className="font-bold text-paper-warning">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-theme-text-secondary">本月新增</span>
                  <span className="font-bold text-paper-info">2</span>
                </div>
              </div>
            </PaperCardContent>
          </PaperCard>

          <PaperCard className="bg-theme-bg-secondary border-theme-border">
            <PaperCardHeader>
              <PaperCardTitle className="text-theme-text-primary">服务质量</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-theme-text-secondary">平均评级</span>
                  <span className="font-bold text-paper-warning">4.6</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-theme-text-secondary">A级服务商</span>
                  <span className="font-bold text-paper-success">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-theme-text-secondary">本月完成项目</span>
                  <span className="font-bold text-paper-info">45</span>
                </div>
              </div>
            </PaperCardContent>
          </PaperCard>

          <PaperCard className="bg-theme-bg-secondary border-theme-border">
            <PaperCardHeader>
              <PaperCardTitle className="text-theme-text-primary">合同管理</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-theme-text-secondary">即将到期</span>
                  <span className="font-bold text-paper-error">2</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-theme-text-secondary">已续约</span>
                  <span className="font-bold text-paper-success">5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-theme-text-secondary">合同总额</span>
                  <span className="font-bold text-paper-primary">¥2.3M</span>
                </div>
              </div>
            </PaperCardContent>
          </PaperCard>
        </div>
      </div>

      {/* Supplier Detail Modal */}
      {showSupplierModal && selectedSupplier && (
        <PaperModal
          isOpen={showSupplierModal}
          onClose={() => setShowSupplierModal(false)}
          title="供应商详情"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-theme-text-primary mb-2">基本信息</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-theme-text-secondary">供应商名称：</span>{selectedSupplier.name}</div>
                  <div><span className="text-theme-text-secondary">类型：</span>{getTypeLabel(selectedSupplier.type)}</div>
                  <div><span className="text-theme-text-secondary">联系人：</span>{selectedSupplier.contactPerson}</div>
                  <div><span className="text-theme-text-secondary">地址：</span>{selectedSupplier.address}</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-theme-text-primary mb-2">合作信息</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-theme-text-secondary">评级：</span>★ {selectedSupplier.rating}</div>
                  <div><span className="text-theme-text-secondary">合作状态：</span>{selectedSupplier.cooperationStatus === 'active' ? '合作中' : selectedSupplier.cooperationStatus === 'pending' ? '待审核' : '已暂停'}</div>
                  <div><span className="text-theme-text-secondary">合同到期：</span>{selectedSupplier.contractExpiry}</div>
                  <div><span className="text-theme-text-secondary">月产能：</span>{selectedSupplier.monthlyCapacity.toLocaleString()}</div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-theme-text-primary mb-2">服务范围</h4>
              <div className="flex flex-wrap gap-2">
                {selectedSupplier.serviceScope.map((scope, index) => (
                  <span key={index} className="px-2 py-1 bg-paper-primary-light text-paper-primary rounded text-sm">
                    {scope}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </PaperModal>
      )}

      {/* Service Provider Detail Modal */}
      {showServiceModal && selectedService && (
        <PaperModal
          isOpen={showServiceModal}
          onClose={() => setShowServiceModal(false)}
          title="服务商详情"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-theme-text-primary mb-2">基本信息</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-theme-text-secondary">服务商名称：</span>{selectedService.name}</div>
                  <div><span className="text-theme-text-secondary">服务类型：</span>{getTypeLabel(selectedService.serviceType)}</div>
                  <div><span className="text-theme-text-secondary">专业领域：</span>{selectedService.specialty}</div>
                  <div><span className="text-theme-text-secondary">联系人：</span>{selectedService.contactPerson}</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-theme-text-primary mb-2">业务能力</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-theme-text-secondary">资质等级：</span>{selectedService.qualificationLevel}级</div>
                  <div><span className="text-theme-text-secondary">评级：</span>★ {selectedService.rating}</div>
                  <div><span className="text-theme-text-secondary">完成项目：</span>{selectedService.projectCount}个</div>
                  <div><span className="text-theme-text-secondary">价格区间：</span>{selectedService.priceRange}</div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <PaperButton variant="outline" onClick={() => setShowServiceModal(false)}>
                关闭
              </PaperButton>
              <PaperButton variant="primary">
                预约服务
              </PaperButton>
            </div>
          </div>
        </PaperModal>
      )}
    </>
  );
}
