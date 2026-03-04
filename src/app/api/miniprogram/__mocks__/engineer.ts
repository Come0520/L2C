/**
 * 开发环境 mock 任务数据生成
 * 按前端传入的 status 参数返回对应状态的虚拟任务
 */
export function generateMockTasks(status: string | null) {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000);
  const dayAfter = new Date(now.getTime() + 2 * 86400000);
  const yesterday = new Date(now.getTime() - 86400000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 86400000);

  /** 待接单任务 */
  const pendingTasks = [
    {
      id: 'mock-task-001',
      taskNo: 'IT-2026-0301',
      sourceType: 'ORDER',
      category: 'CURTAIN',
      status: 'PENDING_ACCEPT',
      customerName: '张明华',
      customerPhone: '138****5678',
      address: '杭州市西湖区文三路 268 号 12 楼 1203 室',
      scheduledDate: tomorrow.toISOString(),
      scheduledTimeSlot: '09:00-12:00',
      remark: '客户要求安装浅灰色遮光窗帘，共 3 个房间',
      items: [
        {
          id: 'mock-item-001',
          productName: '遮光卷帘-浅灰',
          roomName: '主卧',
          quantity: '1',
          isInstalled: false,
        },
        {
          id: 'mock-item-002',
          productName: '遮光卷帘-浅灰',
          roomName: '次卧',
          quantity: '1',
          isInstalled: false,
        },
        {
          id: 'mock-item-003',
          productName: '纱帘-白色',
          roomName: '客厅',
          quantity: '1',
          isInstalled: false,
        },
      ],
      createdAt: now.toISOString(),
    },
    {
      id: 'mock-task-002',
      taskNo: 'IT-2026-0302',
      sourceType: 'ORDER',
      category: 'CURTAIN',
      status: 'PENDING_DISPATCH',
      customerName: '李婷',
      customerPhone: '139****8901',
      address: '杭州市滨江区星光大道 88 号万科翡翠滨江 5-2-801',
      scheduledDate: dayAfter.toISOString(),
      scheduledTimeSlot: '14:00-17:00',
      remark: '新房安装，百叶窗和电动窗帘',
      items: [
        {
          id: 'mock-item-004',
          productName: '木百叶窗-胡桃色',
          roomName: '书房',
          quantity: '2',
          isInstalled: false,
        },
        {
          id: 'mock-item-005',
          productName: '电动遮光帘-米白',
          roomName: '主卧',
          quantity: '1',
          isInstalled: false,
        },
      ],
      createdAt: now.toISOString(),
    },
    {
      id: 'mock-task-003',
      taskNo: 'IT-2026-0303',
      sourceType: 'AFTER_SALES',
      category: 'CURTAIN',
      status: 'PENDING_ACCEPT',
      customerName: '王建国',
      customerPhone: '137****2345',
      address: '杭州市余杭区良渚文化村随园嘉树 3-1-502',
      scheduledDate: tomorrow.toISOString(),
      scheduledTimeSlot: '09:00-12:00',
      remark: '售后维修 - 轨道松动需要重新固定',
      items: [
        {
          id: 'mock-item-006',
          productName: '罗马杆-金属银',
          roomName: '客厅',
          quantity: '1',
          isInstalled: false,
        },
      ],
      createdAt: now.toISOString(),
    },
  ];

  /** 进行中任务 */
  const inProgressTasks = [
    {
      id: 'mock-task-004',
      taskNo: 'IT-2026-0298',
      sourceType: 'ORDER',
      category: 'CURTAIN',
      status: 'IN_PROGRESS',
      customerName: '陈思远',
      customerPhone: '136****6789',
      address: '杭州市拱墅区申花板块万象城悦府 8-1-1501',
      scheduledDate: now.toISOString(),
      scheduledTimeSlot: '09:00-12:00',
      actualStartAt: new Date(now.getTime() - 3600000).toISOString(),
      remark: '正在安装中，已完成主卧和次卧',
      items: [
        {
          id: 'mock-item-007',
          productName: '蜂巢帘-灰蓝',
          roomName: '主卧',
          quantity: '1',
          isInstalled: true,
        },
        {
          id: 'mock-item-008',
          productName: '蜂巢帘-灰蓝',
          roomName: '次卧',
          quantity: '1',
          isInstalled: true,
        },
        {
          id: 'mock-item-009',
          productName: '垂直帘-米色',
          roomName: '客厅',
          quantity: '1',
          isInstalled: false,
        },
        {
          id: 'mock-item-010',
          productName: '卷帘-白色',
          roomName: '厨房',
          quantity: '1',
          isInstalled: false,
        },
      ],
      createdAt: yesterday.toISOString(),
    },
    {
      id: 'mock-task-005',
      taskNo: 'IT-2026-0299',
      sourceType: 'ORDER',
      category: 'CURTAIN',
      status: 'ACCEPTED',
      customerName: '赵雅静',
      customerPhone: '135****4321',
      address: '杭州市上城区近江板块滨江壹号 22-2-2203',
      scheduledDate: tomorrow.toISOString(),
      scheduledTimeSlot: '08:30-11:30',
      remark: '已接单，明天上午施工',
      items: [
        {
          id: 'mock-item-011',
          productName: '遮光窗帘-深灰',
          roomName: '主卧',
          quantity: '1',
          isInstalled: false,
        },
        {
          id: 'mock-item-012',
          productName: '遮光窗帘-深灰',
          roomName: '儿童房',
          quantity: '1',
          isInstalled: false,
        },
      ],
      createdAt: yesterday.toISOString(),
    },
  ];

  /** 已完成任务 */
  const completedTasks = [
    {
      id: 'mock-task-006',
      taskNo: 'IT-2026-0290',
      sourceType: 'ORDER',
      category: 'CURTAIN',
      status: 'COMPLETED',
      customerName: '孙浩然',
      customerPhone: '158****7890',
      address: '杭州市萧山区奥体板块融创城 16-3-1802',
      scheduledDate: yesterday.toISOString(),
      scheduledTimeSlot: '14:00-17:00',
      actualStartAt: new Date(yesterday.getTime() + 14 * 3600000).toISOString(),
      actualEndAt: new Date(yesterday.getTime() + 16.5 * 3600000).toISOString(),
      rating: 5,
      ratingComment: '师傅手艺很好，安装仔细认真',
      items: [
        {
          id: 'mock-item-013',
          productName: '电动蜂巢帘-白色',
          roomName: '客厅',
          quantity: '1',
          isInstalled: true,
        },
        {
          id: 'mock-item-014',
          productName: '遮光帘-浅灰',
          roomName: '主卧',
          quantity: '1',
          isInstalled: true,
        },
        {
          id: 'mock-item-015',
          productName: '遮光帘-浅灰',
          roomName: '次卧',
          quantity: '1',
          isInstalled: true,
        },
      ],
      completedAt: yesterday.toISOString(),
      createdAt: twoDaysAgo.toISOString(),
    },
    {
      id: 'mock-task-007',
      taskNo: 'IT-2026-0285',
      sourceType: 'ORDER',
      category: 'CURTAIN',
      status: 'CONFIRMED',
      customerName: '刘晓梅',
      customerPhone: '150****5432',
      address: '杭州市江干区钱江新城来福士广场 A 座 3205',
      scheduledDate: twoDaysAgo.toISOString(),
      scheduledTimeSlot: '09:00-12:00',
      actualStartAt: new Date(twoDaysAgo.getTime() + 9 * 3600000).toISOString(),
      actualEndAt: new Date(twoDaysAgo.getTime() + 11 * 3600000).toISOString(),
      rating: 4,
      ratingComment: '整体不错',
      laborFee: '380.00',
      items: [
        {
          id: 'mock-item-016',
          productName: '木百叶窗-原木色',
          roomName: '办公室',
          quantity: '3',
          isInstalled: true,
        },
      ],
      completedAt: twoDaysAgo.toISOString(),
      createdAt: new Date(twoDaysAgo.getTime() - 86400000).toISOString(),
    },
    {
      id: 'mock-task-008',
      taskNo: 'IT-2026-0280',
      sourceType: 'AFTER_SALES',
      category: 'CURTAIN',
      status: 'COMPLETED',
      customerName: '周伟强',
      customerPhone: '133****8765',
      address: '杭州市富阳区银湖板块春江花园 7-2-601',
      scheduledDate: new Date(twoDaysAgo.getTime() - 86400000).toISOString(),
      scheduledTimeSlot: '14:00-17:00',
      rating: 5,
      ratingComment: '售后维修很及时，态度好',
      items: [
        {
          id: 'mock-item-017',
          productName: '罗马杆-黑色哑光',
          roomName: '主卧',
          quantity: '1',
          isInstalled: true,
        },
      ],
      completedAt: new Date(twoDaysAgo.getTime() - 86400000).toISOString(),
      createdAt: new Date(twoDaysAgo.getTime() - 2 * 86400000).toISOString(),
    },
  ];

  // 按 status 过滤返回
  switch (status) {
    case 'pending':
      return pendingTasks;
    case 'in_progress':
      return inProgressTasks;
    case 'completed':
      return completedTasks;
    default:
      return [...pendingTasks, ...inProgressTasks, ...completedTasks];
  }
}
