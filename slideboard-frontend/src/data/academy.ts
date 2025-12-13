import { getAcademyContent } from '@/lib/academy-content';

export interface AcademyItem {
  slug: string;
  title: string;
  description: string;
  content: string; // Markdown content
  icon?: string;
}

export interface AcademySection {
  id: string;
  title: string;
  description: string;
  items: AcademyItem[];
}

// Fallback data if file system read fails or during build time if needed
export const FALLBACK_ACADEMY_DATA: Record<string, AcademySection> = {
  systems: {
    id: 'systems',
    title: '系统应用',
    description: '掌握 L2C 系统和其他业务系统的使用方法',
    items: [
      {
        slug: 'home',
        title: '系统首页',
        description: '系统概览与快速导航指南',
        content: `
## 系统首页概览

欢迎使用 **L2C 系统**。首页为您提供了核心业务数据的实时概览和常用功能的快速入口。

### 主要功能区

1. **数据看板**
   - 展示今日线索
   - 本月销售额
   - 待办事项等关键指标

2. **快捷入口**
   - 快速创建线索
   - 查询订单
   - 查看报表

3. **消息通知**
   - 实时接收系统通知和业务提醒
        `
      }
    ]
  }
};

// This function will be used in Server Components
export function getAcademyData(): Record<string, AcademySection> {
  try {
    const content = getAcademyContent();
    if (Object.keys(content).length > 0) {
      return content;
    }
    return FALLBACK_ACADEMY_DATA;
  } catch (error) {
    console.error('Failed to load academy content:', error);
    return FALLBACK_ACADEMY_DATA;
  }
}

export function getAcademySection(id: string): AcademySection | undefined {
  const data = getAcademyData();
  return data[id];
}

export function getAcademyItem(sectionId: string, slug: string): AcademyItem | undefined {
  const section = getAcademySection(sectionId);
  if (!section) return undefined;
  return section.items.find(item => item.slug === slug);
}

export function getAllAcademyItems(): (AcademyItem & { sectionId: string; sectionTitle: string })[] {
  const items: (AcademyItem & { sectionId: string; sectionTitle: string })[] = [];
  const data = getAcademyData();
  Object.values(data).forEach(section => {
    section.items.forEach(item => {
      items.push({
        ...item,
        sectionId: section.id,
        sectionTitle: section.title,
      });
    });
  });
  return items;
}
