import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'L2C - 窗帘/家具行业一站式管理系统 | 免费使用',
    description:
        'L2C 是面向窗帘、家具行业的免费 SaaS 管理系统。从线索获客到报价、订单、采购、测量、安装、收款，一站式数字化管理，永久免费。',
    openGraph: {
        title: 'L2C - 让窗帘生意回归简单',
        description:
            '从线索到收款，一站式管理。窗帘/家具门店的数字化管理利器，基础版永久免费。',
        type: 'website',
        locale: 'zh_CN',
    },
    keywords: [
        'L2C',
        '窗帘管理软件',
        '窗帘 ERP',
        '家具门店管理系统',
        '窗帘报价系统',
        '云展厅',
        '免费窗帘管理软件',
        'SaaS',
    ],
};

/**
 * 营销页面布局
 * 独立于仪表盘的干净布局，无需登录即可访问
 */
export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white text-gray-900 antialiased">
            {children}
        </div>
    );
}
