'use client';

import Image from 'next/image';
import { useState } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent, PaperCardFooter } from '@/components/ui/paper-card';
import { PaperModal } from '@/components/ui/paper-modal';
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table';
import { VanishInput } from '@/components/ui/vanish-input';

interface Product {
  id: string;
  name: string;
  description: string;
  category: 'digital' | 'physical' | 'service' | 'coupon';
  points: number;
  stock: number;
  image: string;
  status: 'available' | 'limited' | 'sold_out';
  exchangeCount: number;
  validityPeriod?: string;
  specifications?: string[];
}

interface PointsRecord {
  id: string;
  type: 'earn' | 'spend';
  points: number;
  description: string;
  timestamp: string;
  balance: number;
}

interface UserPoints {
  total: number;
  available: number;
  expired: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  levelName: string;
  nextLevelPoints: number;
  currentMonthEarn: number;
}

export default function ProductMallPage() {
  const [activeTab, setActiveTab] = useState<'mall' | 'records' | 'ranking'>('mall');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const userPoints: UserPoints = {
    total: 2580,
    available: 2350,
    expired: 230,
    level: 'gold',
    levelName: '黄金会员',
    nextLevelPoints: 420,
    currentMonthEarn: 680
  };

  const products: Product[] = [
    {
      id: 'PROD001',
      name: '设计软件专业版',
      description: '专业室内设计软件，包含3D建模、渲染等功能',
      category: 'digital',
      points: 1200,
      stock: 50,
      image: 'https://picsum.photos/seed/software/200/150',
      status: 'available',
      exchangeCount: 156,
      validityPeriod: '永久有效',
      specifications: ['支持Windows/Mac', '云端同步', '专业渲染引擎', '素材库包含']
    },
    {
      id: 'PROD002',
      name: '高级设计课程',
      description: '资深设计师授课，涵盖空间规划、色彩搭配等核心技能',
      category: 'service',
      points: 800,
      stock: 20,
      image: 'https://picsum.photos/seed/course/200/150',
      status: 'limited',
      exchangeCount: 89,
      validityPeriod: '兑换后30天内有效',
      specifications: ['10节精品课程', '1对1作业点评', '结业证书', '就业指导']
    },
    {
      id: 'PROD003',
      name: '品牌建材优惠券',
      description: '合作品牌建材8.5折优惠券，适用于瓷砖、地板等',
      category: 'coupon',
      points: 300,
      stock: 0,
      image: 'https://picsum.photos/seed/coupon/200/150',
      status: 'sold_out',
      exchangeCount: 234,
      validityPeriod: '2024年12月31日前有效'
    },
    {
      id: 'PROD004',
      name: '专业测量工具套装',
      description: '高精度激光测距仪、水平仪等专业工具组合',
      category: 'physical',
      points: 1500,
      stock: 15,
      image: 'https://picsum.photos/seed/tools/200/150',
      status: 'available',
      exchangeCount: 67,
      specifications: ['激光测距仪', '数字水平仪', '卷尺', '工具箱']
    },
    {
      id: 'PROD005',
      name: '行业报告资料包',
      description: '最新装修行业趋势报告、市场分析数据包',
      category: 'digital',
      points: 200,
      stock: 100,
      image: 'https://picsum.photos/seed/report/200/150',
      status: 'available',
      exchangeCount: 445,
      validityPeriod: '2024年度',
      specifications: ['PDF格式', '市场数据', '趋势分析', '案例研究']
    },
    {
      id: 'PROD006',
      name: 'VIP会员服务',
      description: '享受专属客服、优先发货、免费配送等VIP权益',
      category: 'service',
      points: 500,
      stock: 30,
      image: 'https://picsum.photos/seed/vip/200/150',
      status: 'available',
      exchangeCount: 123,
      validityPeriod: '1年有效期',
      specifications: ['专属客服', '优先处理', '免费配送', '生日礼品']
    }
  ];

  const pointsRecords: PointsRecord[] = [
    {
      id: 'REC001',
      type: 'earn',
      points: 50,
      description: '完成订单评价',
      timestamp: '2024-01-15 14:30',
      balance: 2350
    },
    {
      id: 'REC002',
      type: 'spend',
      points: -300,
      description: '兑换建材优惠券',
      timestamp: '2024-01-14 09:15',
      balance: 2300
    },
    {
      id: 'REC003',
      type: 'earn',
      points: 100,
      description: '推荐新用户注册',
      timestamp: '2024-01-13 16:45',
      balance: 2600
    },
    {
      id: 'REC004',
      type: 'earn',
      points: 30,
      description: '每日签到奖励',
      timestamp: '2024-01-12 08:00',
      balance: 2500
    }
  ];

  const categories = [
    { id: 'all', name: '全部商品', icon: '🛍️' },
    { id: 'digital', name: '数字产品', icon: '💻' },
    { id: 'physical', name: '实物商品', icon: '📦' },
    { id: 'service', name: '服务产品', icon: '🎯' },
    { id: 'coupon', name: '优惠券', icon: '🎫' }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <span className="px-2 py-1 bg-paper-success-light text-paper-success rounded text-xs">可兑换</span>;
      case 'limited':
        return <span className="px-2 py-1 bg-paper-warning-light text-paper-warning rounded text-xs">限量</span>;
      case 'sold_out':
        return <span className="px-2 py-1 bg-paper-error-light text-paper-error rounded text-xs">已售罄</span>;
      default:
        return null;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'bronze': return 'text-paper-error';
      case 'silver': return 'text-paper-ink-secondary';
      case 'gold': return 'text-paper-warning';
      case 'platinum': return 'text-paper-primary';
      default: return 'text-paper-ink';
    }
  };

  const handleExchange = (product: Product) => {
    if (product.status === 'sold_out') return;
    if (userPoints.available < product.points) return;

    setSelectedProduct(product);
    setShowExchangeModal(true);
  };

  const confirmExchange = () => {
    // 这里处理兑换逻辑
    setShowExchangeModal(false);
    // 可以添加成功提示
  };

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-paper-ink">积分商城</h1>
            <p className="text-paper-ink-secondary mt-1">使用积分兑换精美商品和优质服务</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-paper-ink-secondary">当前积分</div>
              <div className="text-2xl font-bold text-paper-primary">{userPoints.available.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-paper-ink-secondary">会员等级</div>
              <div className={`text-lg font-bold ${getLevelColor(userPoints.level)}`}>{userPoints.levelName}</div>
            </div>
          </div>
        </div>

        {/* Points Summary Card */}
        <PaperCard>
          <PaperCardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-paper-primary">{userPoints.total.toLocaleString()}</div>
                <div className="text-sm text-paper-ink-secondary">总积分</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-paper-success">{userPoints.available.toLocaleString()}</div>
                <div className="text-sm text-paper-ink-secondary">可用积分</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-paper-error">{userPoints.expired.toLocaleString()}</div>
                <div className="text-sm text-paper-ink-secondary">已过期</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-paper-warning">{userPoints.currentMonthEarn.toLocaleString()}</div>
                <div className="text-sm text-paper-ink-secondary">本月获得</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-paper-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-paper-ink-secondary">升级到下一级还需 {userPoints.nextLevelPoints.toLocaleString()} 积分</span>
                <div className="w-32 bg-paper-border rounded-full h-2">
                  <div
                    className="bg-paper-primary h-2 rounded-full"
                    style={{ width: `${((userPoints.total % 1000) / 1000) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>

        {/* Tab Navigation */}
        <PaperCard>
          <PaperCardContent className="p-0">
            <div className="border-b border-paper-border">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('mall')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'mall'
                    ? 'border-paper-primary text-paper-primary'
                    : 'border-transparent text-paper-ink-secondary hover:text-paper-ink'
                    }`}
                >
                  积分商城
                </button>
                <button
                  onClick={() => setActiveTab('records')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'records'
                    ? 'border-paper-primary text-paper-primary'
                    : 'border-transparent text-paper-ink-secondary hover:text-paper-ink'
                    }`}
                >
                  积分记录
                </button>
                <button
                  onClick={() => setActiveTab('ranking')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'ranking'
                    ? 'border-paper-primary text-paper-primary'
                    : 'border-transparent text-paper-ink-secondary hover:text-paper-ink'
                    }`}
                >
                  积分排行
                </button>
              </nav>
            </div>
          </PaperCardContent>
        </PaperCard>

        {/* Mall Tab */}
        {activeTab === 'mall' && (
          <>
            {/* Category Filter */}
            <PaperCard>
              <PaperCardContent>
                <div className="flex flex-wrap gap-3">
                  {categories.map((category) => (
                    <PaperButton
                      key={category.id}
                      variant={selectedCategory === category.id ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <span className="mr-2">{category.icon}</span>
                      {category.name}
                    </PaperButton>
                  ))}
                </div>
              </PaperCardContent>
            </PaperCard>

            {/* Search */}
            <PaperCard>
              <PaperCardContent>
                <div className="flex items-center gap-4">
                  <VanishInput
                    placeholders={["搜索商品...", "输入兑换商品...", "查找优惠券..."]}
                    value={searchTerm}
                    onChange={(value) => setSearchTerm(value)}
                    className="flex-1"
                  />
                  <PaperButton variant="outline">
                    筛选
                  </PaperButton>
                </div>
              </PaperCardContent>
            </PaperCard>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <PaperCard key={product.id} className="hover:shadow-lg transition-shadow">
                  <PaperCardHeader>
                    <div className="flex justify-between items-start">
                      {getStatusBadge(product.status)}
                      <span className="text-sm text-paper-ink-secondary">已兑换 {product.exchangeCount}</span>
                    </div>
                  </PaperCardHeader>
                  <PaperCardContent className="text-center">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={640}
                      height={256}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                      unoptimized
                    />
                    <h3 className="font-bold text-paper-ink mb-2">{product.name}</h3>
                    <p className="text-sm text-paper-ink-secondary mb-4 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="text-2xl font-bold text-paper-primary">{product.points}</span>
                      <span className="text-sm text-paper-ink-secondary">积分</span>
                    </div>
                    {product.validityPeriod && (
                      <div className="text-xs text-paper-ink-secondary mb-4">
                        有效期：{product.validityPeriod}
                      </div>
                    )}
                  </PaperCardContent>
                  <PaperCardFooter className="flex gap-2">
                    <PaperButton
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowDetailModal(true);
                      }}
                    >
                      详情
                    </PaperButton>
                    <PaperButton
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleExchange(product)}
                      disabled={product.status === 'sold_out' || userPoints.available < product.points}
                    >
                      {product.status === 'sold_out' ? '已售罄' :
                        userPoints.available < product.points ? '积分不足' : '兑换'}
                    </PaperButton>
                  </PaperCardFooter>
                </PaperCard>
              ))}
            </div>
          </>
        )}

        {/* Records Tab */}
        {activeTab === 'records' && (
          <PaperCard>
            <PaperCardHeader>
              <PaperCardTitle>积分记录</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <PaperTable>
                <PaperTableHeader>
                  <tr>
                    <th className="text-left">时间</th>
                    <th className="text-left">类型</th>
                    <th className="text-left">积分变化</th>
                    <th className="text-left">说明</th>
                    <th className="text-left">余额</th>
                  </tr>
                </PaperTableHeader>
                <PaperTableBody>
                  {pointsRecords.map((record) => (
                    <PaperTableRow key={record.id}>
                      <PaperTableCell>
                        <div className="text-sm">{record.timestamp}</div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.type === 'earn' ? 'bg-paper-success-light text-paper-success' : 'bg-paper-error-light text-paper-error'
                          }`}>
                          {record.type === 'earn' ? '获得' : '消耗'}
                        </span>
                      </PaperTableCell>
                      <PaperTableCell>
                        <span className={`font-medium ${record.type === 'earn' ? 'text-paper-success' : 'text-paper-error'
                          }`}>
                          {record.type === 'earn' ? '+' : ''}{record.points}
                        </span>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="text-sm">{record.description}</div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="font-medium">{record.balance.toLocaleString()}</div>
                      </PaperTableCell>
                    </PaperTableRow>
                  ))}
                </PaperTableBody>
              </PaperTable>
            </PaperCardContent>
          </PaperCard>
        )}

        {/* Ranking Tab */}
        {activeTab === 'ranking' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PaperCard>
              <PaperCardHeader>
                <PaperCardTitle>本月积分排行</PaperCardTitle>
              </PaperCardHeader>
              <PaperCardContent>
                <div className="space-y-4">
                  {[
                    { rank: 1, name: '张设计师', points: 2850, avatar: '👑', trend: 'up' },
                    { rank: 2, name: '李工程师', points: 2340, avatar: '🥈', trend: 'up' },
                    { rank: 3, name: '王项目经理', points: 1980, avatar: '🥉', trend: 'down' },
                    { rank: 4, name: '陈监理', points: 1650, avatar: '🏅', trend: 'up' },
                    { rank: 5, name: '你', points: userPoints.currentMonthEarn, avatar: '😊', trend: 'up' }
                  ].map((user) => (
                    <div key={user.rank} className="flex items-center justify-between p-3 bg-paper-background rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{user.avatar}</span>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-paper-ink-secondary">第{user.rank}名</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-paper-primary">{user.points}</div>
                        <div className="text-sm text-paper-ink-secondary">积分</div>
                      </div>
                    </div>
                  ))}
                </div>
              </PaperCardContent>
            </PaperCard>

            <PaperCard>
              <PaperCardHeader>
                <PaperCardTitle>积分获取攻略</PaperCardTitle>
              </PaperCardHeader>
              <PaperCardContent>
                <div className="space-y-4">
                  {[
                    { task: '完成订单', points: '+50-200', icon: '📋' },
                    { task: '客户好评', points: '+30', icon: '⭐' },
                    { task: '推荐新用户', points: '+100', icon: '👥' },
                    { task: '每日签到', points: '+5-30', icon: '📅' },
                    { task: '参与活动', points: '+20-100', icon: '🎉' },
                    { task: '分享内容', points: '+10', icon: '📤' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-paper-background rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium">{item.task}</span>
                      </div>
                      <span className="font-bold text-paper-success">{item.points}</span>
                    </div>
                  ))}
                </div>
              </PaperCardContent>
            </PaperCard>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {showDetailModal && selectedProduct && (
        <PaperModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="商品详情"
        >
          <div className="space-y-6">
            <div className="text-center">
              <Image
                src={selectedProduct.image}
                alt={selectedProduct.name}
                width={768}
                height={384}
                className="w-full h-48 object-cover rounded-lg mb-4"
                unoptimized
              />
              <h3 className="text-xl font-bold text-paper-ink mb-2">{selectedProduct.name}</h3>
              <p className="text-paper-ink-secondary mb-4">{selectedProduct.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-paper-ink mb-2">基本信息</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-paper-ink-secondary">所需积分：</span><span className="font-bold text-paper-primary">{selectedProduct.points}</span></div>
                  <div><span className="text-paper-ink-secondary">库存数量：</span>{selectedProduct.stock}</div>
                  <div><span className="text-paper-ink-secondary">已兑换：</span>{selectedProduct.exchangeCount}</div>
                  {selectedProduct.validityPeriod && (
                    <div><span className="text-paper-ink-secondary">有效期：</span>{selectedProduct.validityPeriod}</div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-paper-ink mb-2">商品规格</h4>
                {selectedProduct.specifications && (
                  <ul className="space-y-1 text-sm">
                    {selectedProduct.specifications.map((spec, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-paper-primary rounded-full"></span>
                        {spec}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <PaperButton variant="outline" onClick={() => setShowDetailModal(false)}>
                关闭
              </PaperButton>
              <PaperButton
                variant="primary"
                onClick={() => {
                  setShowDetailModal(false);
                  handleExchange(selectedProduct);
                }}
                disabled={selectedProduct.status === 'sold_out' || userPoints.available < selectedProduct.points}
              >
                {selectedProduct.status === 'sold_out' ? '已售罄' :
                  userPoints.available < selectedProduct.points ? '积分不足' : '立即兑换'}
              </PaperButton>
            </div>
          </div>
        </PaperModal>
      )}

      {/* Exchange Confirmation Modal */}
      {showExchangeModal && selectedProduct && (
        <PaperModal
          isOpen={showExchangeModal}
          onClose={() => setShowExchangeModal(false)}
          title="确认兑换"
        >
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-bold text-paper-ink mb-2">{selectedProduct.name}</h3>
              <p className="text-paper-ink-secondary mb-4">{selectedProduct.description}</p>
            </div>

            <div className="bg-paper-background p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-paper-ink-secondary">所需积分：</span>
                <span className="font-bold text-paper-primary">{selectedProduct.points}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-paper-ink-secondary">当前积分：</span>
                <span className="font-medium">{userPoints.available.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-paper-ink-secondary">兑换后余额：</span>
                <span className="font-medium">{(userPoints.available - selectedProduct.points).toLocaleString()}</span>
              </div>
            </div>

            {selectedProduct.validityPeriod && (
              <div className="text-sm text-paper-ink-secondary">
                有效期：{selectedProduct.validityPeriod}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <PaperButton variant="outline" onClick={() => setShowExchangeModal(false)}>
                取消
              </PaperButton>
              <PaperButton variant="primary" onClick={confirmExchange}>
                确认兑换
              </PaperButton>
            </div>
          </div>
        </PaperModal>
      )}
    </>
  );
}
