export default function DemoPage() {
  return (
    <html>
      <head>
        <title>暖宣纸主题演示 - L2C销售管理系统</title>
        <meta name="description" content="基于暖宣纸主题的现代化销售管理系统" />
        <style dangerouslySetInnerHTML={{
          // eslint-disable-next-line @typescript-eslint/naming-convention
          __html: `
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
                'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
                sans-serif;
              background-color: #FBF8EE;
              color: #3B3A35;
            }
            .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 2rem;
            }
            .card {
              background-color: #F1EEDE;
              border: 1px solid #E3DFCD;
              border-radius: 8px;
              padding: 1.5rem;
              margin-bottom: 1rem;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            .card-header {
              border-bottom: 1px solid #E3DFCD;
              padding-bottom: 1rem;
              margin-bottom: 1rem;
            }
            .title {
              font-size: 2rem;
              font-weight: bold;
              margin-bottom: 2rem;
              color: #3B3A35;
            }
            .subtitle {
              font-size: 1.25rem;
              font-weight: 600;
              margin-bottom: 1rem;
              color: #3B3A35;
            }
            .text-secondary {
              color: #757365;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 1.5rem;
              margin-bottom: 2rem;
            }
            .color-demo {
              display: flex;
              align-items: center;
              gap: 1rem;
              margin-bottom: 1rem;
            }
            .color-box {
              width: 60px;
              height: 60px;
              border-radius: 8px;
              border: 1px solid #E3DFCD;
            }
            .bg-paper-200 { background-color: #FBF8EE; }
            .bg-paper-300 { background-color: #F1EEDE; }
            .bg-ink-600 { background-color: #3B3A35; }
            .bg-ink-500 { background-color: #757365; }
          `
        }} />
      </head>
      <body>
        <div className="container">
          <h1 className="title">暖宣纸主题 - L2C销售管理系统</h1>
          
          <div className="card">
            <div className="card-header">
              <h2 className="subtitle">系统功能模块</h2>
            </div>
            <div className="grid">
              <div className="card">
                <h3 className="subtitle" style={{fontSize: '1.1rem'}}>工作台</h3>
                <p className="text-secondary">业务概览与快速操作</p>
              </div>
              <div className="card">
                <h3 className="subtitle" style={{fontSize: '1.1rem'}}>客户管理</h3>
                <p className="text-secondary">装企合作与CRM系统</p>
              </div>
              <div className="card">
                <h3 className="subtitle" style={{fontSize: '1.1rem'}}>订单管理</h3>
                <p className="text-secondary">订单流程与状态跟踪</p>
              </div>
              <div className="card">
                <h3 className="subtitle" style={{fontSize: '1.1rem'}}>商品库存</h3>
                <p className="text-secondary">产品与库存管理</p>
              </div>
              <div className="card">
                <h3 className="subtitle" style={{fontSize: '1.1rem'}}>供应链</h3>
                <p className="text-secondary">服务与供应商管理</p>
              </div>
              <div className="card">
                <h3 className="subtitle" style={{fontSize: '1.1rem'}}>积分商城</h3>
                <p className="text-secondary">积分系统与商品兑换</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h2 className="subtitle">主题色彩系统</h2>
            </div>
            <div className="color-demo">
              <div className="color-box bg-paper-200"></div>
              <div>
                <div style={{fontWeight: '600', color: '#3B3A35'}}>背景色 #FBF8EE</div>
                <div className="text-secondary">主背景色，营造温暖氛围</div>
              </div>
            </div>
            <div className="color-demo">
              <div className="color-box bg-paper-300"></div>
              <div>
                <div style={{fontWeight: '600', color: '#3B3A35'}}>卡片色 #F1EEDE</div>
                <div className="text-secondary">卡片和侧边栏背景色</div>
              </div>
            </div>
            <div className="color-demo">
              <div className="color-box bg-ink-600"></div>
              <div>
                <div style={{fontWeight: '600', color: '#3B3A35'}}>主文本 #3B3A35</div>
                <div className="text-secondary">主要文字颜色</div>
              </div>
            </div>
            <div className="color-demo">
              <div className="color-box bg-ink-500"></div>
              <div>
                <div style={{fontWeight: '600', color: '#3B3A35'}}>副文本 #757365</div>
                <div className="text-secondary">次要文字和提示信息</div>
              </div>
            </div>
            
            <div className="card" style={{marginTop: '2rem'}}>
              <h3 className="subtitle" style={{fontSize: '1.1rem'}}>设计理念</h3>
              <p style={{color: '#3B3A35', lineHeight: '1.6'}}>
                采用暖沙色、米色调的变体，比纯白更护眼，比深色模式更适合长时间阅读文字和图表，
                给人一种温暖、复古、类似纸张的高级感。核心理念是<strong>“柔和的纸上书写体验”</strong>。
              </p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h2 className="subtitle">实现的功能模块</h2>
            </div>
            <div style={{color: '#3B3A35', lineHeight: '1.8'}}>
              <p>✅ <strong>工作台仪表盘</strong> - 业务概览、统计数据、待办事项</p>
              <p>✅ <strong>客户管理</strong> - 装企合作、CRM系统、客户跟踪</p>
              <p>✅ <strong>订单管理</strong> - 订单流程、状态跟踪、支付管理</p>
              <p>✅ <strong>商品库存</strong> - 产品管理、库存预警、价格管理</p>
              <p>✅ <strong>供应链管理</strong> - 服务商管理、合同管理、评价体系</p>
              <p>✅ <strong>积分商城</strong> - 积分系统、商品兑换、用户等级</p>
              <p>✅ <strong>财务报告</strong> - 收支管理、发票管理、财务报表</p>
              <p>✅ <strong>通知审批</strong> - 消息通知、审批流程、工作流</p>
              <p>✅ <strong>系统管理</strong> - 用户权限、系统配置、规则设置</p>
              <p>✅ <strong>文件分享</strong> - 文件管理、分享功能、权限控制</p>
              <p>✅ <strong>账户设置</strong> - 个人资料、安全设置、偏好设置</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}