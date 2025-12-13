
import fs from 'fs';
import path from 'path';

import matter from 'gray-matter';

import { AcademyItem, AcademySection } from '@/data/academy';

const CONTENT_DIR = path.join(process.cwd(), 'src/content/academy');

export function getAcademyContent(): Record<string, AcademySection> {
  const sections: Record<string, AcademySection> = {};
  
  if (!fs.existsSync(CONTENT_DIR)) {
    return {};
  }

  const dirs = fs.readdirSync(CONTENT_DIR);

  dirs.forEach(dir => {
    const dirPath = path.join(CONTENT_DIR, dir);
    if (fs.statSync(dirPath).isDirectory()) {
      const items: AcademyItem[] = [];
      const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.md'));

      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = matter(fileContent);
        
        items.push({
          slug: file.replace('.md', ''),
          title: data.title || file.replace('.md', ''),
          description: data.description || '',
          content: content,
          icon: data.icon,
        });
      });

      // Map directory names to section titles (this could be enhanced with a config file)
      const sectionTitles: Record<string, string> = {
        'systems': '系统应用',
        'knowledge': '产品知识'
      };

      const sectionDescriptions: Record<string, string> = {
        'systems': '掌握 L2C 系统和其他业务系统的使用方法',
        'knowledge': '深入了解罗莱产品体系'
      };

      sections[dir] = {
        id: dir,
        title: sectionTitles[dir] || dir,
        description: sectionDescriptions[dir] || '',
        items: items
      };
    }
  });

  return sections;
}
