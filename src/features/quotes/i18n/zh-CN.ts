export const quoteI18n = {
    title: '报价单',
    create: '新建报价单',
    edit: '编辑报价单',
    delete: '删除',
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    submit: '提交',
    approve: '审批',
    reject: '拒绝',
    status: {
        draft: '草稿',
        submitted: '已提交',
        approved: '已审批',
        expired: '已过期',
        rejected: '已拒绝'
    },
    messages: {
        createSuccess: '报价单创建成功',
        deleteConfirm: '确定要删除此报价单吗？',
        saveSuccess: '保存成功',
        submitSuccess: '提交成功',
        approveSuccess: '审批成功'
    },
    table: {
        productName: '产品名称',
        quantity: '数量',
        unitPrice: '单价',
        discount: '折扣',
        totalPrice: '总价',
        actions: '操作'
    }
} as const;
