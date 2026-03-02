'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, MessageSquarePlus, Star, BadgeCheck, Loader2 } from 'lucide-react';
import { VersionHistoryModal } from './version-history-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { submitTestimonial, type LandingTestimonialData } from '../actions/landing-stats';
import { testimonialItems as staticTestimonials } from '@/constants/landing-data';

// 共建者数据类型
interface Contributor {
  id: string;
  name: string;
  role: string;
  contribution: string;
  avatarColor: string;
  verified?: boolean;
}

// 核心共建者数据
const contributors: Contributor[] = [
  {
    id: 'c1',
    name: '聂老师',
    role: '业务架构师',
    contribution: '提出完整财务模块核心业务逻辑，为 L2C 业财一体化奠定基石。',
    avatarColor: '#F97316',
    verified: true,
  },
  {
    id: 'c2',
    name: '一枝花',
    role: '安全卫士',
    contribution: '火眼金睛揪出"忘记密码"隐患，守护系统账户安全。',
    avatarColor: '#10B981',
    verified: true,
  },
  {
    id: 'c3',
    name: 'Antigravity',
    role: 'AI 联创',
    contribution: '攻克 Vitest 死锁难题，通过 2100+ 全量单元测试，护航 1.2.2 版本稳健发布。',
    avatarColor: '#14B8A6',
    verified: true,
  },
  {
    id: 'c4',
    name: '安琪',
    role: '质量卫士',
    contribution: '首发报告报价单添加商品后总价不更新的缓存 Bug，推动全站缓存策略统一重构。',
    avatarColor: '#EC4899',
    verified: true,
  },
];

/** 获取姓名首字（用于头像显示） */
function getInitial(name: string): string {
  return name ? name.charAt(0) : '?';
}

/** 随机生成一个头像颜色 */
function getRandomColor(str: string) {
  const colors = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
    '#F43F5E',
    '#8B5CF6',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/** 微信风格头像组件 */
function WechatAvatar({
  name,
  color,
  size = 'md',
}: {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass =
    size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm';
  const bgColor = color || getRandomColor(name);
  return (
    <div
      className={`${sizeClass} flex flex-none items-center justify-center rounded-lg font-bold text-white shadow-sm`}
      style={{ backgroundColor: bgColor }}
    >
      {getInitial(name)}
    </div>
  );
}

/** 单条留言气泡 */
function MessageBubble({
  content,
  author,
  role,
  company,
  avatarColor,
  isRight = false,
  delay = 0,
  verified = false,
}: {
  content: string;
  author: string;
  role?: string;
  company?: string;
  avatarColor?: string;
  isRight?: boolean;
  delay?: number;
  verified?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay }}
      className={`flex items-end gap-3 ${isRight ? 'flex-row-reverse' : ''}`}
    >
      <WechatAvatar name={author} color={avatarColor} />

      <div className={`flex max-w-[78%] flex-col gap-1 ${isRight ? 'items-end' : 'items-start'}`}>
        {/* 发件人信息 */}
        <div
          className={`flex items-center gap-1.5 text-xs text-slate-400 ${isRight ? 'flex-row-reverse' : ''}`}
        >
          <span className="font-medium text-slate-600">{author}</span>
          {verified && <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />}
          {(role || company) && <span className="text-slate-400">·</span>}
          <span>
            {role}
            {role && company ? ' · ' : ''}
            {company}
          </span>
        </div>

        {/* 气泡主体 */}
        <div className="relative">
          {!isRight && (
            <div className="absolute bottom-3 -left-1.5 h-0 w-0 border-t-[6px] border-r-8 border-t-transparent border-r-white" />
          )}
          {isRight && (
            <div className="absolute -right-1.5 bottom-3 h-0 w-0 border-t-[6px] border-l-8 border-t-transparent border-l-blue-500" />
          )}

          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
              isRight
                ? 'rounded-br-sm bg-blue-500 text-white'
                : 'rounded-bl-sm bg-white text-slate-700 ring-1 ring-slate-100'
            }`}
          >
            {content}
          </div>
        </div>

        {/* 底部星级装饰 */}
        {!verified && (
          <div className={`flex items-center gap-0.5 ${isRight ? 'flex-row-reverse' : ''}`}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/** 提交表单组件 */
function MessageForm({
  onSubmit,
  onCancel,
  defaultName,
}: {
  onSubmit: (data: {
    content: string;
    authorName: string;
    authorRole?: string;
    authorCompany?: string;
  }) => Promise<void>;
  onCancel: () => void;
  /** 已登录用户的姓名，用于预填 */
  defaultName?: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      content: formData.get('content') as string,
      authorName: formData.get('authorName') as string,
      authorRole: formData.get('authorRole') as string,
      authorCompany: formData.get('authorCompany') as string,
    };
    await onSubmit(data);
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-lg"
    >
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
        <h4 className="text-sm font-semibold text-slate-700">✍️ 留下你的故事</h4>
      </div>
      <form onSubmit={handleSubmit} className="p-5">
        <div className="space-y-4">
          <Textarea
            name="content"
            placeholder="说点什么... (例如：L2C真的很帮到了我的门店，特别是报价功能！)"
            className="min-h-[100px] resize-none border-slate-200 bg-slate-50 focus-visible:ring-blue-500"
            required
            minLength={5}
            maxLength={500}
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              name="authorName"
              placeholder="怎么称呼您？ *"
              defaultValue={defaultName}
              className="border-slate-200 bg-slate-50 focus-visible:ring-blue-500"
              required
              minLength={2}
            />
            <Input
              name="authorRole"
              placeholder="什么职位？ (选填)"
              className="border-slate-200 bg-slate-50 focus-visible:ring-blue-500"
            />
            <Input
              name="authorCompany"
              placeholder="门店名字？ (选填)"
              className="border-slate-200 bg-slate-50 focus-visible:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            className="text-slate-500 hover:text-slate-700"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 text-white hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                提交中...
              </>
            ) : (
              '发送留言'
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

export function ContributorsWall({
  initialTestimonials = [],
}: {
  initialTestimonials?: LandingTestimonialData[];
}) {
  const { data: session } = useSession();
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 组装要在页面上展示的留言（真实优先，如果不够则用静态补齐，保证页面不空）
  const displayTestimonials =
    initialTestimonials.length > 0 ? initialTestimonials : staticTestimonials;

  // 如果打开了表单，自动滚动到底部
  useEffect(() => {
    if (showForm && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, [showForm]);

  const handleFormSubmit = async (data: {
    content: string;
    authorName: string;
    authorRole?: string;
    authorCompany?: string;
  }) => {
    const res = await submitTestimonial(data);
    if (res.success) {
      toast.success('留言发送成功！', {
        description: '我们已经收到您的故事，审核通过后就会在这里显示啦。',
      });
      setShowForm(false);
    } else {
      toast.error('发送失败', {
        description: res.error || '可能是网络问题，请稍后再试。',
      });
    }
  };

  return (
    <section className="relative overflow-hidden bg-slate-50 py-24 sm:py-32 dark:bg-[#050510]">
      {/* 背景装饰 */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-blue-50/80 via-transparent to-transparent dark:from-blue-950/20" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700 ring-1 ring-green-600/20 ring-inset dark:bg-green-500/10 dark:text-green-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            大家都在聊
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            听听他们怎么说
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-500 dark:text-slate-400">
            来自一线门店老板、财务、测量师的真实反馈。每一条留言，都是他们用 L2C
            改变生意的亲身经历。
          </p>
        </motion.div>

        {/* 主聊天区域 */}
        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-100/60 shadow-xl shadow-slate-200/50 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/60 dark:shadow-none">
            {/* 伪 macOS 标题栏 */}
            <div className="relative z-10 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-5 py-3.5 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
                </div>
                <span className="text-xs font-medium text-slate-400">
                  L2C 用户群&nbsp;&nbsp;·&nbsp;&nbsp;
                  {contributors.length + displayTestimonials.length} 位成员
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                在线
              </div>
            </div>

            {/* 聊天消息流（限制高度，支持滚动） */}
            <div
              ref={scrollRef}
              className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 flex max-h-[600px] flex-col gap-5 overflow-y-auto px-5 py-6"
            >
              {/* 微信风格：查看看历史消息 */}
              <div className="flex justify-center pb-2">
                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="group flex items-center gap-1.5 text-[13px] text-blue-500 transition-colors hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <History className="h-3.5 w-3.5 transition-transform group-hover:-rotate-12" />
                  查看历史荣誉与版本记录
                </button>
              </div>

              {/* 核心共建者对话 */}
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                <span className="text-xs text-slate-400">核心共建者</span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
              </div>

              {contributors.map((contributor, index) => (
                <MessageBubble
                  key={contributor.id}
                  content={contributor.contribution}
                  author={contributor.name}
                  role={contributor.role}
                  company="核心共建者"
                  avatarColor={contributor.avatarColor}
                  isRight={index % 2 !== 0}
                  delay={index * 0.1}
                  verified={contributor.verified}
                />
              ))}

              {/* 用户留言分割线 */}
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                <span className="text-xs text-slate-400">用户真实评价</span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
              </div>

              {/* 用户留言列表 */}
              {displayTestimonials.map((item, index) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const dataItem = item as any;
                const avatarColor = dataItem.avatarColor;

                return (
                  <MessageBubble
                    key={dataItem.id}
                    content={dataItem.content}
                    author={dataItem.authorName || dataItem.author}
                    role={dataItem.authorRole || dataItem.role}
                    company={dataItem.authorCompany || dataItem.company}
                    avatarColor={avatarColor}
                    isRight={index % 2 !== 0}
                    delay={0.2 + (index % 5) * 0.08}
                  />
                );
              })}

              {/* 表单互动区 */}
              <AnimatePresence mode="wait">
                {!showForm ? (
                  <motion.div
                    key="cta-btn"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    className="mt-6 flex justify-center"
                  >
                    <button
                      onClick={() => setShowForm(true)}
                      className="group flex flex-col items-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50/60 px-10 py-5 text-center transition-all hover:bg-blue-100/50 dark:border-blue-800 dark:bg-blue-950/20"
                    >
                      <div className="rounded-full bg-blue-100 p-3 text-blue-600 transition-transform group-hover:-translate-y-1">
                        <MessageSquarePlus className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                          你也在用 L2C？来聊聊你的故事 👋
                        </p>
                        <p className="mt-1 text-xs text-blue-600/70">加入对话，写下你的真实感受</p>
                      </div>
                    </button>
                  </motion.div>
                ) : (
                  <MessageForm
                    key="form"
                    onSubmit={handleFormSubmit}
                    onCancel={() => setShowForm(false)}
                    defaultName={session?.user?.name || undefined}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <VersionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </section>
  );
}
