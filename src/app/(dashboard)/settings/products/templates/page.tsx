import { AttributeTemplateManager } from '@/features/products/components/attribute-template-manager';

export default function AttributeTemplatesPage() {
    return (
        <div className="container py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">属性模板配置</h1>
                <p className="text-muted-foreground mt-2">
                    管理各产品品类的动态属性字段。这些配置将直接影响产品录入表单。
                </p>
            </div>
            <AttributeTemplateManager />
        </div>
    );
}
