import { Navbar } from './components/navbar';
import { HeroSection } from './components/hero-section';
import { PainDanmaku } from './components/pain-danmaku';
import { ValueProposition } from './components/value-proposition';
import { FeatureShowcase } from './components/feature-showcase';
import { TrustTestimonials } from './components/trust-testimonials';
import { ContributorsWall } from './components/contributors-wall';
import { ShowroomPreview } from './components/showroom-preview';
import { PricingSection } from './components/pricing-section';
import { CtaFooter } from './components/cta-footer';

/**
 * L2C 官网首页
 * 9 幕式纵向滚动叙事落地页
 */
export default function LandingPage() {
  return (
    <>
      {/* 第 0 幕：导航栏 */}
      <Navbar />

      {/* 第 1 幕：品牌故事 + 运营广告 */}
      <HeroSection />

      {/* 第 2 幕：痛点弹幕 */}
      <PainDanmaku />

      {/* 第 3 幕：爽点宣言 */}
      <ValueProposition />

      {/* 第 4 幕：功能亮点 */}
      <FeatureShowcase />

      {/* 第 5 幕：客户认可 */}
      <TrustTestimonials />

      {/* 第 5.5 幕：共建者之墙 */}
      <ContributorsWall />

      {/* 第 6 幕：云展厅 */}
      <ShowroomPreview />

      {/* 第 7 幕：定价方案 */}
      <PricingSection />

      {/* 第 8 幕：CTA + Footer */}
      <CtaFooter />
    </>
  );
}
