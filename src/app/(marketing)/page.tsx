import { Navbar } from './components/navbar';
import { HeroSection } from './components/hero-section';
import { PainDanmaku } from './components/pain-danmaku';
// import { ValueProposition } from './components/value-proposition';
// import { FeatureShowcase } from './components/feature-showcase';
import { TrustTestimonials } from './components/trust-testimonials';
import { ContributorsWall } from './components/contributors-wall';
import { ShowroomPreview } from './components/showroom-preview';
import { PricingSection } from './components/pricing-section';
import { CtaFooter } from './components/cta-footer';
import { getLandingStats, getGrowthTrend, getLandingTestimonials } from './actions/landing-stats';

/**
 * L2C 官网首页
 * 9 幕式纵向滚动叙事落地页
 * stats、growthTrend、testimonials 均在服务端并行查询，无客户端 waterfall
 */
export default async function LandingPage() {
  const [stats, growthTrend, initialTestimonials] = await Promise.all([
    getLandingStats(),
    getGrowthTrend(12),
    getLandingTestimonials(),
  ]);

  return (
    <>
      {/* 第 0 幕：导航栏 */}
      <Navbar />

      {/* 第 1 幕：品牌故事 + 运营广告 */}
      <HeroSection />

      {/* 第 2 幕：痛点弹幕 */}
      <PainDanmaku />

      {/* 第 3 幕：爽点宣言（暂时隐藏） */}
      {/* <ValueProposition /> */}

      {/* 第 4 幕：功能亮点（暂时隐藏） */}
      {/* <FeatureShowcase /> */}

      {/* 第 5 幕：客户认可（统计数字 + 增长趋势图） */}
      <TrustTestimonials stats={stats} growthTrend={growthTrend} />

      {/* 第 5.5 幕：共建者之墙（含真实用户留言 + 内嵌留言表单） */}
      <ContributorsWall initialTestimonials={initialTestimonials} />

      {/* 第 6 幕：云展厅 */}
      <ShowroomPreview />

      {/* 第 7 幕：定价方案 */}
      <PricingSection />

      {/* 第 8 幕：CTA + Footer */}
      <CtaFooter />
    </>
  );
}
