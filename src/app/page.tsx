/**
 * 首页 - 重定向到工作台
 */

import { redirect } from 'next/navigation';

export default function HomePage() {
    redirect('/workbench');
}
