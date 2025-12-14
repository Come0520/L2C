'use client';

import { FunnelChart, Funnel, Cell, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { TrendingDown } from 'lucide-react';

interface SalesFunnelData {
    name: string;
    value: number;
    fill: string;
}

interface SalesFunnelChartProps {
    data?: SalesFunnelData[];
    onStageClick?: (stage: string) => void;
}

/**
 * 销售漏斗图组件
 * 
 * 展示从线索到交付的完整转化流程
 * 支持时间段筛选和异常转化率提醒
 */
export function SalesFunnelChart({ data, onStageClick }: SalesFunnelChartProps) {
    // 默认模拟数据
    const defaultData: SalesFunnelData[] = [
        { name: '新增线索', value: 1000, fill: '#8884d8' },
        { name: '跟进中', value: 650, fill: '#83a6ed' },
        { name: '已报价', value: 420, fill: '#8dd1e1' },
        { name: '已下单', value: 230, fill: '#82ca9d' },
        { name: '已交付', value: 200, fill: '#a4de6c' },
    ];

    const chartData = data || defaultData;

    // 计算转化率
    const conversionRates = chartData.map((item, index) => {
        if (index === 0) return { ...item, rate: 100 };
        return {
            ...item,
            rate: ((item.value / chartData[index - 1].value) * 100).toFixed(1),
        };
    });

    // 检测低转化率阶段（<60%）
    const lowConversionStages = conversionRates.filter((item, index) =>
        index > 0 && parseFloat(item.rate) < 60
    );

    // 自定义标签渲染
    const renderCustomLabel = (props: any) => {
        const { x, y, width, height, name, value } = props;
        const rate = conversionRates.find(item => item.name === name)?.rate || '100';

        return (
            <g>
                <text
                    x={x + width / 2}
                    y={y + height / 2 - 8}
                    fill="#fff"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="font-semibold text-sm"
                >
                    {name}
                </text>
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 12}
                    fill="#fff"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs"
                >
                    {value} ({rate}%)
                </text>
            </g>
        );
    };

    return (
        <div className="space-y-4">
            {/* 低转化率警告 */}
            {lowConversionStages.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                        <TrendingDown className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-orange-900">转化率异常提醒</h4>
                            <ul className="mt-2 space-y-1">
                                {lowConversionStages.map((stage) => (
                                    <li key={stage.name} className="text-sm text-orange-700">
                                        <span className="font-medium">{stage.name}</span> 转化率仅{' '}
                                        <span className="font-bold">{stage.rate}%</span>，低于健康水平（60%）
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* 漏斗图 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
                <ResponsiveContainer width="100%" height={400}>
                    <FunnelChart>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    const rate = conversionRates.find(item => item.name === data.name)?.rate;
                                    return (
                                        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                                            <p className="font-semibold">{data.name}</p>
                                            <p>数量: {data.value}</p>
                                            <p>转化率: {rate}%</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Funnel
                            dataKey="value"
                            data={chartData}
                            isAnimationActive
                            onClick={(data) => onStageClick?.(data.name)}
                            cursor="pointer"
                        >
                            <LabelList
                                position="center"
                                content={renderCustomLabel}
                            />
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Funnel>
                    </FunnelChart>
                </ResponsiveContainer>
            </div>

            {/* 转化率详情表格 */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                阶段
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                数量
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                转化率
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                流失数
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {conversionRates.map((item, index) => {
                            const lostCount = index > 0 ? chartData[index - 1].value - item.value : 0;
                            const isLowConversion = index > 0 && parseFloat(item.rate) < 60;

                            return (
                                <tr key={item.name} className={isLowConversion ? 'bg-orange-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.value.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={
                                            parseFloat(item.rate) >= 80 ? 'text-green-600 font-semibold' :
                                                parseFloat(item.rate) >= 60 ? 'text-blue-600' :
                                                    'text-orange-600 font-semibold'
                                        }>
                                            {item.rate}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {lostCount > 0 ? `-${lostCount.toLocaleString()}` : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
