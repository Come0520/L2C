export const dynamic = 'force-dynamic';
import { getTestimonialsList } from './actions';
import { TestimonialsClient } from './components/testimonials-client';

export const metadata = {
  title: '首页评论 - L2C',
};

export default async function TestimonialsPage() {
  const res = await getTestimonialsList();
  const data = res.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">首页评论管理</h3>
        <p className="text-muted-foreground text-sm">
          审核来自落地页的用户真实评价，决定哪些内容可展示在主页。
        </p>
      </div>

      <div className="bg-card text-card-foreground rounded-xl border shadow-sm">
        <div className="p-6">
          <TestimonialsClient initialData={data} />
        </div>
      </div>
    </div>
  );
}

