'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent, PaperCardFooter, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card';
import { PaperInput } from '@/components/ui/paper-input';
import { PaperModal } from '@/components/ui/paper-modal';
import { PaperTable, PaperTableBody, PaperTableCell, PaperTableHeader, PaperTableRow } from '@/components/ui/paper-table';
import { VanishInput } from '@/components/ui/vanish-input';
import { pointsService } from '@/services/points.client';
import { MallProduct, PointsAccount, PointsTransaction } from '@/shared/types/points';

export default function MallPage() {
  const [activeTab, setActiveTab] = useState<'mall' | 'records'>('mall');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<MallProduct | null>(null);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 兑换信息状态
  const [shippingAddress, setShippingAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [addressError, setAddressError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Data states
  const [account, setAccount] = useState<PointsAccount | null>(null);
  const [products, setProducts] = useState<MallProduct[]>([]);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [acc, prods, trans] = await Promise.all([
          pointsService.getAccount(),
          pointsService.getProducts(),
          pointsService.getTransactions()
        ]);
        setAccount(acc);
        setProducts(prods);
        setTransactions(trans.data);
      } catch (error) {
        console.error('Failed to fetch mall data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = [
    { id: 'all', name: '全部商品', icon: '🛍️' },
    { id: 'electronics', name: '数码产品', icon: '💻' },
    { id: 'home', name: '家居用品', icon: '🏠' },
    { id: 'gift_card', name: '礼品卡', icon: '💳' },
    { id: 'special', name: '特色服务', icon: '🌟' },
    { id: 'other', name: '其他', icon: '📦' }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleExchange = (product: MallProduct) => {
    if (!product.is_available || product.stock_quantity <= 0) return;
    if ((account?.available_points || 0) < product.points_required) return;

    // Reset exchange form fields
    setShippingAddress('');
    setContactPhone('');
    setAddressError('');
    setPhoneError('');

    setSelectedProduct(product);
    setShowExchangeModal(true);
  };

  const confirmExchange = async () => {
    if (!selectedProduct) return;

    // 验证地址和电话
    let isValid = true;

    if (!shippingAddress.trim()) {
      setAddressError('请输入收货地址');
      isValid = false;
    } else {
      setAddressError('');
    }

    if (!contactPhone.trim()) {
      setPhoneError('请输入联系电话');
      isValid = false;
    } else if (!/^1[3-9]\d{9}$/.test(contactPhone)) {
      setPhoneError('请输入有效的手机号');
      isValid = false;
    } else {
      setPhoneError('');
    }

    if (!isValid) return;

    try {
      await pointsService.createOrder({
        product_id: selectedProduct.id,
        shipping_address: shippingAddress,
        contact_phone: contactPhone,
      });
      setShowExchangeModal(false);
      // Refresh data
      const [acc, prods] = await Promise.all([
        pointsService.getAccount(),
        pointsService.getProducts()
      ]);
      setAccount(acc);
      setProducts(prods);
      alert('兑换成功！');
    } catch (error) {
      console.error('Exchange failed:', error);
      alert('兑换失败，请重试');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-paper-ink">积分商城</h1>
          <p className="text-paper-ink-secondary mt-1">使用积分兑换精美商品和优质服务</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-paper-ink-secondary">可用积分</div>
            <div className="text-2xl font-bold text-paper-primary">{account?.available_points?.toLocaleString() || 0}</div>
          </div>
        </div>
      </div>

      {/* Points Summary Card */}
      <PaperCard>
        <PaperCardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-paper-primary">{account?.total_points?.toLocaleString() || 0}</div>
              <div className="text-sm text-paper-ink-secondary">总积分</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-paper-success">{account?.available_points?.toLocaleString() || 0}</div>
              <div className="text-sm text-paper-ink-secondary">可用积分</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-paper-warning">{account?.frozen_points?.toLocaleString() || 0}</div>
              <div className="text-sm text-paper-ink-secondary">冻结积分</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-paper-info">{account?.pending_points?.toLocaleString() || 0}</div>
              <div className="text-sm text-paper-ink-secondary">在途积分</div>
            </div>
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* Tabs */}
      <div className="border-b border-paper-border">
        <div className="flex space-x-6">
          <button
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'mall'
              ? 'border-paper-primary text-paper-primary'
              : 'border-transparent text-paper-ink-secondary hover:text-paper-ink'
              }`}
            onClick={() => setActiveTab('mall')}
          >
            积分商城
          </button>
          <button
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'records'
              ? 'border-paper-primary text-paper-primary'
              : 'border-transparent text-paper-ink-secondary hover:text-paper-ink'
              }`}
            onClick={() => setActiveTab('records')}
          >
            积分明细
          </button>
        </div>
      </div>

      {activeTab === 'mall' && (
        <div className="space-y-6">
          {/* Filter & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-1 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${selectedCategory === category.id
                    ? 'bg-paper-primary text-white'
                    : 'bg-paper-bg-light text-paper-ink hover:bg-paper-border'
                    }`}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
            <div className="w-full md:w-64">
              <VanishInput
                placeholders={["搜索商品...", "输入商品名称...", "查找礼物..."]}
                value={searchTerm}
                onChange={(value) => setSearchTerm(value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="text-center py-12 text-paper-ink-secondary">加载中...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-paper-ink-secondary">暂无商品</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <PaperCard key={product.id} className="overflow-hidden flex flex-col h-full hover:shadow-paper-lg transition-shadow">
                  <div className="relative h-48 w-full bg-paper-bg-light group cursor-pointer" onClick={() => {
                    setSelectedProduct(product);
                    setShowDetailModal(true);
                  }}>
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-4xl">🎁</div>
                    )}
                    <div className="absolute top-2 right-2">
                      {!product.is_available || product.stock_quantity <= 0 ? (
                        <span className="px-2 py-1 bg-paper-error-light text-paper-error rounded text-xs">已售罄</span>
                      ) : (
                        <span className="px-2 py-1 bg-paper-success-light text-paper-success rounded text-xs">可兑换</span>
                      )}
                    </div>
                  </div>
                  <PaperCardContent className="flex-1 p-4">
                    <h3 className="font-semibold text-lg text-paper-ink mb-1 line-clamp-1 cursor-pointer hover:text-paper-primary" onClick={() => {
                      setSelectedProduct(product);
                      setShowDetailModal(true);
                    }}>{product.name}</h3>
                    <p className="text-sm text-paper-ink-secondary mb-3 line-clamp-2 h-10">{product.description}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="text-paper-primary font-bold">
                        {product.points_required.toLocaleString()} <span className="text-xs font-normal text-paper-ink-secondary">积分</span>
                      </div>
                      <div className="text-xs text-paper-ink-secondary">
                        库存: {product.stock_quantity}
                      </div>
                    </div>
                  </PaperCardContent>
                  <PaperCardFooter className="p-4 pt-0">
                    <PaperButton
                      className="w-full"
                      onClick={() => handleExchange(product)}
                      disabled={!product.is_available || product.stock_quantity <= 0 || (account?.available_points || 0) < product.points_required}
                    >
                      {(!product.is_available || product.stock_quantity <= 0)
                        ? '缺货'
                        : ((account?.available_points || 0) < product.points_required)
                          ? '积分不足'
                          : '立即兑换'
                      }
                    </PaperButton>
                  </PaperCardFooter>
                </PaperCard>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'records' && (
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>积分明细</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            {loading ? (
              <div className="text-center py-8 text-paper-ink-secondary">加载中...</div>
            ) : (
              <PaperTable>
                <PaperTableHeader>
                  <PaperTableCell>时间</PaperTableCell>
                  <PaperTableCell>类型</PaperTableCell>
                  <PaperTableCell>变动</PaperTableCell>
                  <PaperTableCell>说明</PaperTableCell>
                </PaperTableHeader>
                <PaperTableBody>
                  {transactions.map(record => (
                    <PaperTableRow key={record.id}>
                      <PaperTableCell>{new Date(record.created_at).toLocaleString()}</PaperTableCell>
                      <PaperTableCell>
                        <span className={`px-2 py-1 rounded text-xs ${record.type === 'earn' || record.type === 'unfreeze' || record.type === 'refund'
                          ? 'bg-paper-success-light text-paper-success'
                          : 'bg-paper-warning-light text-paper-warning'
                          }`}>
                          {record.type === 'earn' ? '获取' :
                            record.type === 'spend' ? '消费' :
                              record.type === 'freeze' ? '冻结' :
                                record.type === 'unfreeze' ? '解冻' :
                                  record.type}
                        </span>
                      </PaperTableCell>
                      <PaperTableCell className={`font-medium ${record.amount > 0 ? 'text-paper-success' : 'text-paper-error'}`}>
                        {record.amount > 0 ? '+' : ''}{record.amount}
                      </PaperTableCell>
                      <PaperTableCell>{record.description}</PaperTableCell>
                    </PaperTableRow>
                  ))}
                  {transactions.length === 0 && (
                    <PaperTableRow>
                      <PaperTableCell colSpan={4} className="text-center py-8 text-paper-ink-secondary">
                        暂无记录
                      </PaperTableCell>
                    </PaperTableRow>
                  )}
                </PaperTableBody>
              </PaperTable>
            )}
          </PaperCardContent>
        </PaperCard>
      )}

      {/* Exchange Confirmation Modal */}
      <PaperModal
        isOpen={showExchangeModal}
        onClose={() => setShowExchangeModal(false)}
        title="确认兑换"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="relative w-24 h-24 bg-paper-bg-light rounded-lg overflow-hidden flex-shrink-0">
              {selectedProduct?.image_url ? (
                <Image
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-2xl">🎁</div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-paper-ink">{selectedProduct?.name}</h3>
              <div className="text-paper-primary font-bold mt-1">
                {selectedProduct?.points_required.toLocaleString()} 积分
              </div>
            </div>
          </div>

          {/* 收货信息 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-paper-ink">收货信息</h4>

            <div>
              <label className="block text-sm text-paper-ink-secondary mb-1">收货地址</label>
              <PaperInput
                placeholder="请输入详细收货地址"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                error={addressError}
                className="w-full"
              />
              {addressError && (
                <p className="text-xs text-paper-error mt-1">{addressError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-paper-ink-secondary mb-1">联系电话</label>
              <PaperInput
                placeholder="请输入联系电话"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                error={phoneError}
                className="w-full"
              />
              {phoneError && (
                <p className="text-xs text-paper-error mt-1">{phoneError}</p>
              )}
            </div>
          </div>

          {/* 积分信息 */}
          <div className="bg-paper-bg-light p-4 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-paper-ink-secondary">当前积分</span>
              <span className="text-paper-ink">{account?.available_points?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-paper-ink-secondary">扣除积分</span>
              <span className="text-paper-error">-{selectedProduct?.points_required.toLocaleString()}</span>
            </div>
            <div className="border-t border-paper-border my-2"></div>
            <div className="flex justify-between font-medium">
              <span className="text-paper-ink">兑换后剩余</span>
              <span className="text-paper-success">
                {((account?.available_points || 0) - (selectedProduct?.points_required || 0)).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <PaperButton variant="outline" onClick={() => setShowExchangeModal(false)}>
              取消
            </PaperButton>
            <PaperButton onClick={confirmExchange}>
              确认兑换
            </PaperButton>
          </div>
        </div>
      </PaperModal>

      {/* Product Detail Modal */}
      <PaperModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="商品详情"
      >
        <div className="space-y-6">
          <div className="relative w-full h-64 bg-paper-bg-light rounded-lg overflow-hidden">
            {selectedProduct?.image_url ? (
              <Image
                src={selectedProduct.image_url}
                alt={selectedProduct.name || ''}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-6xl">🎁</div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-paper-ink mb-2">{selectedProduct?.name}</h2>
            <div className="flex items-center space-x-4 mb-4">
              <span className="text-2xl font-bold text-paper-primary">
                {selectedProduct?.points_required.toLocaleString()} <span className="text-sm font-normal text-paper-ink-secondary">积分</span>
              </span>
              <span className="text-sm text-paper-ink-secondary">
                库存: {selectedProduct?.stock_quantity}
              </span>
            </div>

            <div className="prose prose-sm max-w-none text-paper-ink-secondary">
              <h3 className="text-paper-ink font-medium mb-2">商品介绍</h3>
              <p>{selectedProduct?.description || '暂无介绍'}</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-paper-border">
            <PaperButton variant="outline" onClick={() => setShowDetailModal(false)}>
              关闭
            </PaperButton>
            <PaperButton
              onClick={() => {
                setShowDetailModal(false);
                if (selectedProduct) handleExchange(selectedProduct);
              }}
              disabled={!selectedProduct?.is_available || (selectedProduct?.stock_quantity || 0) <= 0 || (account?.available_points || 0) < (selectedProduct?.points_required || 0)}
            >
              立即兑换
            </PaperButton>
          </div>
        </div>
      </PaperModal>
    </div>
  );
}
