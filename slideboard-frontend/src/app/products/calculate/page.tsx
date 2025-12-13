'use client';

import { Calculator } from 'lucide-react';
import React, { useState } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperInput, PaperSelect } from '@/components/ui/paper-input';

// 计算结果类型定义
interface CalculationResult {
  materialLength: number;     // 用料长度
  materialCost: number;        // 材料费
  specialCraftCost: number;   // 特殊工艺费
  remoteFee: number;           // 远程费
  totalPrice: number;         // 总价
}

export default function ProductCalculatePage() {
  const [productCode, setProductCode] = useState('');
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [calculationType, setCalculationType] = useState<'定高' | '定宽'>('定高');
  const [fabricWidth, setFabricWidth] = useState<number>(0);
  const [specialCrafts, setSpecialCrafts] = useState<string[]>([]);
  const [distance, setDistance] = useState<number>(0);
  const [storeId, setStoreId] = useState('');
  const [result, setResult] = useState<CalculationResult | null>(null);

  // 产品选项（模拟数据）
  const productOptions = [
    { value: 'CL-B-001', label: '现代简约窗帘布' },
    { value: 'CL-S-001', label: '透光窗纱' },
    { value: 'CL-GD-001', label: '静音轨道' }
  ];

  // 特殊工艺选项（模拟数据）
  const specialCraftOptions = [
    { value: 'craft1', label: '打孔', price: 10, unit: '个' },
    { value: 'craft2', label: '绣花', price: 50, unit: '米' },
    { value: 'craft3', label: '拼接', price: 30, unit: '米' }
  ];

  // 门店选项（模拟数据）
  const storeOptions = [
    { value: 'store1', label: '北京旗舰店' },
    { value: 'store2', label: '上海体验店' },
    { value: 'store3', label: '广州专卖店' }
  ];

  // 计算窗帘价格
  const calculateCurtainPrice = () => {
    // 这里应该是实际的计算逻辑，现在只是模拟
    let materialLength = 0;
    let materialCost = 0;
    let specialCraftCost = 0;
    let remoteFee = 0;

    // 模拟产品单价
    const productPrice = 280; // 假设选择的是 CL-B-001，零售价 280 元/米

    // 计算用料长度
    if (calculationType === '定高') {
      if (width < 2) {
        materialLength = width * 2.2 + 0.3;
      } else {
        materialLength = width * 2 + 0.3;
      }
    } else { // 定宽
      let requiredWidth = 0;
      if (width < 2) {
        requiredWidth = width * 2.2 + 0.3;
      } else {
        requiredWidth = width * 2 + 0.3;
      }
      
      // 计算幅数（向上取整）
      const panels = Math.ceil(requiredWidth / fabricWidth);
      materialLength = panels * (height + 0.3);
    }

    // 计算材料费
    materialCost = materialLength * productPrice;

    // 计算特殊工艺费（模拟）
    specialCraftCost = specialCrafts.length * 100; // 假设每个特殊工艺 100 元

    // 计算远程费
    if (distance <= 10) {
      remoteFee = 0;
    } else if (distance <= 30) {
      remoteFee = 50;
    } else if (distance <= 50) {
      remoteFee = 100;
    } else if (distance <= 100) {
      remoteFee = 200;
    } else {
      remoteFee = 50 + Math.ceil((distance - 100) / 50) * 50;
    }

    // 计算总价
    const totalPrice = materialCost + specialCraftCost + remoteFee;

    // 设置计算结果
    setResult({
      materialLength: parseFloat(materialLength.toFixed(2)),
      materialCost: parseFloat(materialCost.toFixed(2)),
      specialCraftCost: parseFloat(specialCraftCost.toFixed(2)),
      remoteFee: parseFloat(remoteFee.toFixed(2)),
      totalPrice: parseFloat(totalPrice.toFixed(2))
    });
  };

  // 处理特殊工艺选择
  const handleSpecialCraftChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setSpecialCrafts(selectedOptions);
  };

  return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">价格计算工具</h1>
            <p className="text-ink-500 mt-1">用于计算窗帘定制价格</p>
          </div>
        </div>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>窗帘价格计算</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 输入表单 */}
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-ink-800">计算参数</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">产品编码</label>
                    <PaperSelect 
                      value={productCode} 
                      onChange={(e) => setProductCode(e.target.value)} 
                      options={productOptions} 
                      placeholder="请选择产品"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">成品宽度（米）</label>
                    <PaperInput 
                      type="number" 
                      value={width} 
                      onChange={(e) => setWidth(parseFloat(e.target.value) || 0)} 
                      placeholder="请输入成品宽度"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">成品高度（米）</label>
                    <PaperInput 
                      type="number" 
                      value={height} 
                      onChange={(e) => setHeight(parseFloat(e.target.value) || 0)} 
                      placeholder="请输入成品高度"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">计算方式</label>
                    <PaperSelect 
                      value={calculationType} 
                      onChange={(e) => setCalculationType(e.target.value as '定高' | '定宽')} 
                      options={[
                        { value: '定高', label: '定高' },
                        { value: '定宽', label: '定宽' }
                      ]} 
                    />
                  </div>
                  
                  {calculationType === '定宽' && (
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">幅宽（米）</label>
                      <PaperInput 
                        type="number" 
                        value={fabricWidth} 
                        onChange={(e) => setFabricWidth(parseFloat(e.target.value) || 0)} 
                        placeholder="请输入幅宽"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">特殊工艺</label>
                    <PaperSelect 
                      multiple 
                      value={specialCrafts} 
                      onChange={handleSpecialCraftChange} 
                      options={specialCraftOptions.map(craft => ({
                        value: craft.value,
                        label: `${craft.label} (${craft.price}元/${craft.unit})`
                      }))} 
                      placeholder="请选择特殊工艺"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">安装距离（公里）</label>
                    <PaperInput 
                      type="number" 
                      value={distance} 
                      onChange={(e) => setDistance(parseFloat(e.target.value) || 0)} 
                      placeholder="请输入安装距离"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">门店</label>
                    <PaperSelect 
                      value={storeId} 
                      onChange={(e) => setStoreId(e.target.value)} 
                      options={storeOptions} 
                      placeholder="请选择门店"
                    />
                  </div>
                  
                  <div className="pt-4">
                    <PaperButton 
                      variant="primary" 
                      onClick={calculateCurtainPrice} 
                      className="w-full"
                      icon={<Calculator className="h-4 w-4 mr-2" />}
                    >
                      计算价格
                    </PaperButton>
                  </div>
                </div>
              </div>
              
              {/* 计算结果 */}
              <div>
                <h2 className="text-xl font-medium text-ink-800 mb-6">计算结果</h2>
                
                {result ? (
                  <div className="space-y-6">
                    <PaperCard>
                      <PaperCardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-paper-300 rounded-lg">
                            <div className="text-3xl font-bold text-ink-800 mb-1">
                              {result.materialLength} 米
                            </div>
                            <div className="text-sm text-ink-500">用料长度</div>
                          </div>
                          
                          <div className="text-center p-4 bg-paper-300 rounded-lg">
                            <div className="text-3xl font-bold text-success-600 mb-1">
                              ¥{result.totalPrice.toLocaleString()}
                            </div>
                            <div className="text-sm text-ink-500">总价</div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-paper-200 rounded-lg">
                            <span className="text-sm text-ink-700">材料费</span>
                            <span className="text-sm font-medium text-ink-800">¥{result.materialCost.toLocaleString()}</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-paper-200 rounded-lg">
                            <span className="text-sm text-ink-700">特殊工艺费</span>
                            <span className="text-sm font-medium text-ink-800">¥{result.specialCraftCost.toLocaleString()}</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-paper-200 rounded-lg">
                            <span className="text-sm text-ink-700">远程费</span>
                            <span className="text-sm font-medium text-ink-800">¥{result.remoteFee.toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <div className="pt-3 border-t border-paper-600">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-medium text-ink-800">总计</span>
                            <span className="text-xl font-bold text-success-600">¥{result.totalPrice.toLocaleString()}</span>
                          </div>
                        </div>
                      </PaperCardContent>
                    </PaperCard>
                    
                    <PaperCard>
                      <PaperCardHeader>
                        <PaperCardTitle>计算公式说明</PaperCardTitle>
                      </PaperCardHeader>
                      <PaperCardContent className="space-y-3">
                        {calculationType === '定高' && (
                          <>
                            <p className="text-sm text-ink-700">
                              <strong>定高计算规则：</strong>
                            </p>
                            <ul className="list-disc pl-5 text-sm text-ink-600 space-y-1">
                              <li>成品宽度 &lt; 2米：用料长度 = 宽度 × 2.2 + 0.3米</li>
                              <li>成品宽度 ≥ 2米：用料长度 = 宽度 × 2 + 0.3米</li>
                              <li>总价 = 用料长度 × 单价 + 特殊工艺费 + 远程费</li>
                            </ul>
                          </>
                        )}
                        
                        {calculationType === '定宽' && (
                          <>
                            <p className="text-sm text-ink-700">
                              <strong>定宽计算规则：</strong>
                            </p>
                            <ul className="list-disc pl-5 text-sm text-ink-600 space-y-1">
                              <li>成品宽度 &lt; 2米：幅数 = ROUNDUP[(宽度 × 2.2 + 0.3米) ÷ 幅宽]</li>
                              <li>成品宽度 ≥ 2米：幅数 = ROUNDUP[(宽度 × 2 + 0.3米) ÷ 幅宽]</li>
                              <li>总用料长度 = 幅数 × (成品高度 + 0.3米)</li>
                              <li>总价 = 总用料长度 × 单价 + 特殊工艺费 + 远程费</li>
                            </ul>
                          </>
                        )}
                        
                        <p className="text-sm text-ink-700 mt-3">
                          <strong>远程费规则：</strong>
                        </p>
                        <ul className="list-disc pl-5 text-sm text-ink-600 space-y-1">
                          <li>0-10公里：免费</li>
                          <li>10-30公里：50元/次</li>
                          <li>30-50公里：100元/次</li>
                          <li>50-100公里：200元/次</li>
                          <li>100公里以上：50元/50公里</li>
                        </ul>
                      </PaperCardContent>
                    </PaperCard>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-paper-300 rounded-lg">
                    <Calculator className="h-16 w-16 text-ink-400 mx-auto mb-4" />
                    <p className="text-ink-500">请输入计算参数，点击{`"计算价格"`}按钮查看结果</p>
                  </div>
                )}
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>
      </div>
  );
}