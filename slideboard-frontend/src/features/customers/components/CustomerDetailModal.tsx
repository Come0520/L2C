'use client';

import { 
  Phone, 
  Mail, 
  MapPin,
  User,
  DollarSign,
  TrendingUp,
  Edit
} from 'lucide-react';

import { PaperBadge, PaperStatus } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { Customer } from '@/services/customers.server';

import { CustomerDetailSkeleton } from './skeletons/customer-detail-skeleton';

interface CustomerDetailModalProps {
  customer: Customer;
  onClose: () => void;
}

export function CustomerDetailModal({ customer, onClose }: CustomerDetailModalProps) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'A': return 'success';
      case 'B': return 'info';
      case 'C': return 'warning';
      case 'D': return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'potential': return 'info';
      case 'inactive': return 'error';
      default: return 'info';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-paper-400 border border-paper-600 rounded-xl shadow-paper-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-paper-600 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink-800">客户详情</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-paper-300 transition-colors"
            aria-label="关闭"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <PaperCard>
                <PaperCardHeader>
                  <PaperCardTitle>基本信息</PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-paper-300 rounded-full">
                      <User className="h-6 w-6 text-ink-600" />
                    </div>
                    <div>
                      <p className="font-medium text-ink-800">{customer.name}</p>
                      <p className="text-sm text-ink-500">{customer.company}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-ink-400" />
                      <span className="text-sm text-ink-600">{customer.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-ink-400" />
                      <span className="text-sm text-ink-600">{customer.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-ink-400" />
                      <span className="text-sm text-ink-600">{customer.address}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 pt-3 border-t border-paper-600">
                    <div>
                      <p className="text-xs text-ink-500">客户等级</p>
                      <PaperBadge variant={getLevelColor(customer.level)}>
                        {customer.level}级客户
                      </PaperBadge>
                    </div>
                    <div>
                      <p className="text-xs text-ink-500">状态</p>
                      <PaperStatus 
                        status={getStatusColor(customer.status)}
                        text={
                          customer.status === 'active' ? '活跃客户' :
                          customer.status === 'potential' ? '潜在客户' : '非活跃'
                        }
                      />
                    </div>
                  </div>
                </PaperCardContent>
              </PaperCard>
            </div>
            
            <div className="space-y-6">
              <PaperCard>
                <PaperCardHeader>
                  <PaperCardTitle>业务统计</PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-paper-300 rounded-lg">
                      <DollarSign className="h-8 w-8 text-success-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-ink-800">
                        ¥{customer.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-ink-500">累计交易额</p>
                    </div>
                    <div className="text-center p-4 bg-paper-300 rounded-lg">
                      <TrendingUp className="h-8 w-8 text-info-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-ink-800">
                        {customer.orderCount}
                      </p>
                      <p className="text-sm text-ink-500">订单数量</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-ink-600">最后交易时间</span>
                      <span className="text-sm text-ink-800">{customer.lastOrderDate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-ink-600">注册时间</span>
                      <span className="text-sm text-ink-800">{customer.createdAt}</span>
                    </div>
                  </div>
                </PaperCardContent>
              </PaperCard>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-paper-600 flex items-center justify-end space-x-3">
          <PaperButton variant="outline" onClick={onClose}>
            关闭
          </PaperButton>
          <PaperButton variant="primary">
            <Edit className="h-4 w-4 mr-2" />
            编辑客户
          </PaperButton>
        </div>
      </div>
    </div>
  );
}