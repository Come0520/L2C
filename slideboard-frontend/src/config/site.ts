export const siteConfig = {
    name: "销售管理系统",
    shortName: "L2C",
    description: "企业级销售管理系统",
    company: "罗莱软装设计（上海）有限公司",
    links: {
        github: "https://github.com/your-repo/l2c",
    },
} as const;

export type SiteConfig = typeof siteConfig;
