export const siteConfig = {
    name: "销售管理系统",
    shortName: "L2C",
    description: "企业级销售管理系统",
    company: "Slideboard Inc.",
    links: {
        github: "https://github.com/your-repo/l2c",
    },
} as const;

export type SiteConfig = typeof siteConfig;
