/**
 * 自动填充审计字段
 * @param data 原始数据对象
 * @param userId 当前用户ID
 * @param isUpdate 是否为更新操作 (true: 填充 updatedBy, false: 填充 createdBy)
 */
export function withAuditFields<T>(data: T, userId: string, isUpdate = false) {
    if (isUpdate) {
        return {
            ...data,
            updatedBy: userId,
            updatedAt: new Date(),
        };
    }
    return {
        ...data,
        createdBy: userId,
        updatedBy: userId, // 创建时也将 updatedBy 设为创建人
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}
