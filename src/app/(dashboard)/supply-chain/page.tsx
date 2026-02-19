import { redirect } from 'next/navigation';

export default function SupplyChainPage() {
    // 默认重定向到商品管理
    redirect('/supply-chain/overview');
}
