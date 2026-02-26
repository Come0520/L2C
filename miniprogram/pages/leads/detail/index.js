import { formatTime } from '../../../utils/util';
const app = getApp();
Page({
    data: {
        id: '',
        lead: null,
        loading: true,
        // Followup Modal
        showFollowupModal: false,
        followupForm: {
            type: 'PHONE', // PHONE | WECHAT | VISIT | OTHER
            content: '',
            nextFollowupAt: '',
            status: '' // Optional new status
        },
        followupTypes: [
            { name: '电话', value: 'PHONE' },
            { name: '微信', value: 'WECHAT' },
            { name: '拜访', value: 'VISIT' },
            { name: '其他', value: 'OTHER' }
        ],
        statusOptions: ['PENDING_FOLLOWUP', 'FOLLOWING_UP'], // Simplified for modal
        // Void Modal
        showVoidModal: false,
        voidReason: ''
    },
    onLoad(options) {
        if (options.id) {
            this.setData({ id: options.id });
            this.fetchDetail(options.id);
        }
    },
    async fetchDetail(id) {
        wx.showNavigationBarLoading();
        try {
            const res = await app.request(`/leads/${id}`);
            if (res.success) {
                // Format dates
                const lead = res.data;
                if (lead.activities) {
                    lead.activities = lead.activities.map((a) => (Object.assign(Object.assign({}, a), { createdAt: formatTime(new Date(a.createdAt)) })));
                }
                if (lead.createdAt)
                    lead.createdAt = formatTime(new Date(lead.createdAt));
                if (lead.lastActivityAt)
                    lead.lastActivityAt = formatTime(new Date(lead.lastActivityAt));
                if (lead.nextFollowupAt)
                    lead.nextFollowupAt = formatTime(new Date(lead.nextFollowupAt)).split(' ')[0]; // Just date
                this.setData({
                    lead,
                    loading: false
                });
            }
        }
        catch (err) {
            console.error(err);
            wx.showToast({ title: '加载失败', icon: 'none' });
            return Promise.resolve();
        }
        finally {
            wx.hideNavigationBarLoading();
        }
    },
    onCall() {
        var _a;
        if ((_a = this.data.lead) === null || _a === void 0 ? void 0 : _a.customerPhone) {
            wx.makePhoneCall({ phoneNumber: this.data.lead.customerPhone });
        }
    },
    onCopy(e) {
        const text = e.currentTarget.dataset.text;
        if (text) {
            wx.setClipboardData({ data: text });
        }
    },
    // --- Followup Logic ---
    onShowFollowup() {
        this.setData({
            showFollowupModal: true,
            'followupForm.type': 'PHONE',
            'followupForm.content': '',
            'followupForm.nextFollowupAt': '',
            'followupForm.status': ''
        });
    },
    onHideFollowup() {
        this.setData({ showFollowupModal: false });
    },
    onFollowupTypeChange(e) {
        const type = e.currentTarget.dataset.type;
        this.setData({ 'followupForm.type': type });
    },
    onFollowupInput(e) {
        this.setData({ 'followupForm.content': e.detail.value });
    },
    onNextDateChange(e) {
        this.setData({ 'followupForm.nextFollowupAt': e.detail.value });
    },
    async onSubmitFollowup() {
        const { id, followupForm } = this.data;
        if (!followupForm.content.trim()) {
            wx.showToast({ title: '请输入跟进内容', icon: 'none' });
            return Promise.resolve();
        }
        wx.showLoading({ title: '提交中...' });
        try {
            const res = await app.request(`/leads/${id}/followup`, {
                method: 'POST',
                data: {
                    type: followupForm.type,
                    content: followupForm.content,
                    nextFollowUpAt: followupForm.nextFollowupAt || undefined,
                    status: followupForm.status || undefined
                }
            });
            if (res.success) {
                wx.showToast({ title: '记录成功', icon: 'success' });
                this.setData({ showFollowupModal: false });
                this.fetchDetail(id);
            }
            else {
                throw new Error(res.error);
            }
        }
        catch (err) {
            const message = err.message || '提交失败';
            wx.showToast({ title: message, icon: 'none' });
        }
        finally {
            wx.hideLoading();
        }
    },
    // --- Convert Logic ---
    onConvert() {
        wx.showModal({
            title: '确认转化',
            content: '确定将该线索转化为正式客户吗？转化后将自动创建客户档案。',
            success: async (res) => {
                if (res.confirm) {
                    this.doConvert();
                }
            }
        });
        return Promise.resolve(); // Added to fix TS7030
    },
    async doConvert() {
        wx.showLoading({ title: '转化中...' });
        try {
            const res = await app.request(`/leads/${this.data.id}/convert`, {
                method: 'POST',
                data: {} // Optional customerId can be added later if needed
            });
            if (res.success) {
                wx.showToast({ title: '转化成功', icon: 'success' });
                setTimeout(() => {
                    // Navigate to customer detail or list?
                    // For now, go back
                    wx.navigateBack();
                }, 1500);
            }
            else {
                throw new Error(res.error);
            }
        }
        catch (err) {
            const message = err.message || '转化失败';
            wx.showToast({ title: message, icon: 'none' });
        }
        finally {
            wx.hideLoading();
        }
    },
    // --- Void Logic ---
    onShowVoid() {
        this.setData({ showVoidModal: true, voidReason: '' });
    },
    onHideVoid() {
        this.setData({ showVoidModal: false });
    },
    onVoidReasonInput(e) {
        this.setData({ voidReason: e.detail.value });
    },
    async onSubmitVoid() {
        if (!this.data.voidReason.trim()) {
            wx.showToast({ title: '请输入作废原因', icon: 'none' });
            return Promise.resolve();
        }
        wx.showLoading({ title: '提交中...' });
        try {
            const res = await app.request(`/leads/${this.data.id}/void`, {
                method: 'POST',
                data: { reason: this.data.voidReason }
            });
            if (res.success) {
                wx.showToast({ title: '已作废', icon: 'success' });
                this.setData({ showVoidModal: false });
                this.fetchDetail(this.data.id);
            }
            else {
                throw new Error(res.error);
            }
        }
        catch (err) {
            const message = err.message || '操作失败';
            wx.showToast({ title: message, icon: 'none' });
        }
        finally {
            wx.hideLoading();
        }
    },
    async onClaim() {
        wx.showLoading({ title: '领取中...' });
        try {
            wx.showToast({ title: '功能开发中', icon: 'none' });
        }
        catch (err) {
            wx.hideLoading();
        }
    }
});
