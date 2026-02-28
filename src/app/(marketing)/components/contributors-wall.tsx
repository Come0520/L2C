'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, ShieldCheck, Lightbulb, History } from 'lucide-react';
import { VersionHistoryModal } from './version-history-modal';
import { Button } from '@/components/ui/button';

// 共建者数据类型
interface Contributor {
  id: string;
  name: string;
  role: string;
  contribution: string;
  icon: React.ReactNode;
  color: string;
}

// 共建者数据 (后续可抽出为常量或从 API 获取)
const contributors: Contributor[] = [
  {
    id: '1',
    name: '聂老师',
    role: '业务架构师',
    contribution: '提出完整财务模块核心业务逻辑，为 L2C 业财一体化奠定基石。',
    icon: <Lightbulb className="h-5 w-5" />,
    color: 'from-amber-400 to-orange-500',
  },
  {
    id: '2',
    name: '一枝花',
    role: '安全卫士',
    contribution: '火眼金睛揪出“忘记密码”隐患，守护系统账户安全。',
    icon: <ShieldCheck className="h-5 w-5" />,
    color: 'from-emerald-400 to-teal-500',
  },
];

export function ContributorsWall() {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  return (
    <section className="relative overflow-hidden bg-slate-50 py-24 transition-colors duration-300 sm:py-32 dark:bg-[#050510]">
      {/* 背景装饰图案 */}
      <div
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-blue-400 to-indigo-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-288.75 dark:opacity-10"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_right,var(--tw-gradient-stops))] from-blue-100/50 via-transparent to-transparent dark:from-indigo-900/20 dark:via-transparent"></div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600 ring-1 ring-blue-600/20 ring-inset dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20"
          >
            <SparkleIcon className="h-4 w-4" />
            Special Thanks
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white"
          >
            荣誉殿堂
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400"
          >
            系统的每一次进化，都离不开早期支持者与社区的智慧碰撞。这里铭记着杰出贡献者的足迹，也记载着产品从无到有的每一次跃升。
          </motion.p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2">
            {contributors.map((contributor, index) => (
              <motion.div
                key={contributor.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="group relative flex flex-col overflow-hidden rounded-3xl bg-white/80 p-8 shadow-sm ring-1 ring-slate-200 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-slate-300 dark:bg-slate-900/60 dark:ring-white/10 dark:hover:bg-slate-900/80 dark:hover:ring-white/20"
              >
                {/* 顶部高光修饰 */}
                <div
                  className={`absolute top-0 left-0 h-1.5 w-full bg-linear-to-r ${contributor.color} opacity-80 transition-opacity group-hover:opacity-100`}
                ></div>

                <dt className="flex items-center gap-x-4 text-base leading-7 font-semibold text-slate-900 dark:text-white">
                  <div
                    className={`flex h-14 w-14 flex-none items-center justify-center rounded-xl bg-linear-to-br ${contributor.color} text-white shadow-md ring-1 ring-white/20`}
                  >
                    <User className="h-7 w-7" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold tracking-tight">{contributor.name}</span>
                    <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                      {contributor.icon}
                      <span className="bg-linear-to-r from-slate-600 to-slate-800 bg-clip-text font-bold text-transparent dark:from-slate-200 dark:to-white">
                        {contributor.role}
                      </span>
                    </div>
                  </div>
                </dt>
                <dd className="mt-6 flex flex-auto flex-col text-base leading-relaxed text-slate-600 dark:text-slate-300">
                  <p className="relative z-10 flex-auto italic">"{contributor.contribution}"</p>
                </dd>

                {/* 装饰性渐变背景 Hover */}
                <div className="pointer-events-none absolute -right-24 -bottom-24 h-56 w-56 rounded-full bg-linear-to-br from-blue-500/10 to-purple-500/10 blur-3xl transition-transform duration-700 group-hover:scale-150 dark:from-blue-500/10 dark:to-purple-500/10"></div>
              </motion.div>
            ))}
          </dl>
        </div>

        {/* 版本记录入口 */}
        <motion.div
          className="mt-20 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button
            variant="outline"
            size="lg"
            className="group relative overflow-hidden rounded-full border-slate-300 bg-white/50 px-8 py-6 text-base font-semibold text-slate-700 shadow-sm backdrop-blur-md transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-blue-500/50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
            onClick={() => setIsHistoryModalOpen(true)}
          >
            <History className="mr-2 h-5 w-5 transition-transform group-hover:-rotate-12" />
            查看详细版本与荣誉记录
            <div className="absolute inset-0 -z-10 bg-linear-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </Button>
        </motion.div>
      </div>

      <VersionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </section>
  );
}

function SparkleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
