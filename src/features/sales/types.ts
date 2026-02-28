export interface SalesTargetDTO {
  userId: string;
  userName: string;
  userAvatar: string | null;
  targetId: string | null;
  targetAmount: number;
  /** 已完成金额（ACCEPTED 报价合计） */
  achievedAmount: number;
  /** 完成率百分比（0~100+） */
  completionRate: number;
  updatedAt: Date | null;
}
