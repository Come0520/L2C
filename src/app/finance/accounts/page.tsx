'use client';

import Image from 'next/image';
import { Button } from '@/shared/ui/button';
import { ArrowLeft, HardHat } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function FinanceAccountsPage() {
  return (
    <div className="from-background flex min-h-[80vh] flex-col items-center justify-center bg-gradient-to-b to-blue-50/20 p-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8"
      >
        {/* 卡通插图容器 */}
        <div className="relative mx-auto h-64 w-64 drop-shadow-xl">
          <div className="absolute inset-0 animate-pulse rounded-full bg-blue-100 opacity-20 blur-2xl" />
          <Image
            src="/images/coming-soon-cartoon.png"
            alt="Coming Soon"
            fill
            className="object-contain transition-transform duration-300 hover:scale-105"
            priority
          />
        </div>

        {/* 文字内容 */}
        <div className="space-y-4">
          <div className="text-primary flex items-center justify-center gap-2 text-lg font-bold">
            <HardHat className="h-6 w-6 animate-bounce" />
            <span>功能建设中</span>
          </div>

          <h1 className="text-foreground text-3xl font-extrabold tracking-tight lg:text-4xl">
            财务账户模块
            <br />
            <span className="text-primary">即将上线</span>
          </h1>

          <p className="text-muted-foreground mx-auto max-w-sm text-lg">
            我们的工程师喵正在努力搬砖建设中...
            <br />
            请稍后再来查看！
          </p>
        </div>

        {/* 返回按钮 */}
        <div className="pt-4">
          <Button
            asChild
            size="lg"
            className="rounded-full shadow-lg transition-all hover:shadow-xl"
          >
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回首页
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
