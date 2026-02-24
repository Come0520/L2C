
export interface SalesTargetDTO {
    userId: string;
    userName: string;
    userAvatar: string | null;
    targetId: string | null;
    targetAmount: number;
    updatedAt: Date | null;
}
