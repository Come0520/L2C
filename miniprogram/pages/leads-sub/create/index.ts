
interface ChannelContact {
    id: string;
    name: string;
}

interface ChannelChild {
    id: string;
    name: string;
    level: number;
    contacts: ChannelContact[];
}

interface ChannelNode {
    id: string;
    name: string;
    level: number;
    children: ChannelChild[];
}

Page({
    data: {
        form: {
            customerName: '',
            customerPhone: '',
            address: '',
            intentionLevel: '',
            channelId: '',      // 二级渠道 ID
            channelContactId: '',      // 联系人 ID
            remark: ''
        },

        // 意向等级选项
        intentionOptions: ['A', 'B', 'C', 'D'],
        intentionIndex: -1,

        // 多级选择器状态
        showSourcePicker: false,
        channelTree: [] as ChannelNode[],
        level2Options: [] as ChannelChild[],
        level3Options: [] as ChannelContact[],
        selectedLevel1: '',
        selectedLevel2: '',
        selectedLevel3: '',
        sourceDisplay: '',      // 显示文本

        // 临时选择（确认前）
        tempLevel1: '',
        tempLevel2: '',
        tempLevel3: '',
        tempLevel1Name: '',
        tempLevel2Name: '',
        tempLevel3Name: '',

        submitting: false,
        errors: {
            customerName: false,
            customerPhone: false
        }
    },

    onLoad() {
        this.fetchChannels();
    },

    async fetchChannels() {
        try {
            const app = getApp<IAppOption>();
            const res = await app.request('/channels');
            if (res.success) {
                this.setData({ channelTree: res.data });
            }
        } catch (err) {
            console.error('Fetch channels error:', err);
        }
    },

    onInput(e: WechatMiniprogram.Input) {
        const field = e.currentTarget.dataset.field;
        const value = e.detail.value;

        const updateData: Record<string, unknown> = {
            [`form.${field}`]: value
        };

        if (field === 'customerName' || field === 'customerPhone') {
            updateData[`errors.${field}`] = false;
        }

        this.setData(updateData);
    },

    onIntentionChange(e: any) {
        const index = e.detail.value;
        this.setData({
            intentionIndex: index,
            'form.intentionLevel': this.data.intentionOptions[index]
        });
    },

    // --- Channel Picker Logic Start (Copied & Adapted from CRM) ---

    onShowSourcePicker() {
        this.setData({
            showSourcePicker: true,
            tempLevel1: this.data.selectedLevel1,
            tempLevel2: this.data.selectedLevel2,
            tempLevel3: this.data.selectedLevel3,
            tempLevel1Name: '', // Reset names to avoid stale display issues or re-find them if needed
            // For simplicity, we just reset the temp selection logic or keep previous if matched
        });
    },

    onHideSourcePicker() {
        this.setData({ showSourcePicker: false });
    },

    onSelectLevel1(e: WechatMiniprogram.TouchEvent) {
        const item = e.currentTarget.dataset.item as ChannelNode;
        this.setData({
            tempLevel1: item.id,
            tempLevel1Name: item.name,
            tempLevel2: '',
            tempLevel2Name: '',
            tempLevel3: '',
            tempLevel3Name: '',
            level2Options: item.children || [],
            level3Options: []
        });
    },

    onSelectLevel2(e: WechatMiniprogram.TouchEvent) {
        const item = e.currentTarget.dataset.item as ChannelChild;
        this.setData({
            tempLevel2: item.id,
            tempLevel2Name: item.name,
            tempLevel3: '',
            tempLevel3Name: '',
            level3Options: item.contacts || []
        });
    },

    onSelectLevel3(e: WechatMiniprogram.TouchEvent) {
        const item = e.currentTarget.dataset.item as ChannelContact;
        this.setData({
            tempLevel3: item.id,
            tempLevel3Name: item.name
        });
    },

    onConfirmSource() {
        const { tempLevel1, tempLevel2, tempLevel3, tempLevel1Name, tempLevel2Name, tempLevel3Name } = this.data;
        let display = tempLevel1Name;
        if (tempLevel2Name) display += ' > ' + tempLevel2Name;
        if (tempLevel3Name) display += ' > ' + tempLevel3Name;

        this.setData({
            selectedLevel1: tempLevel1,
            selectedLevel2: tempLevel2,
            selectedLevel3: tempLevel3,
            'form.channelId': tempLevel2 || tempLevel1,
            'form.channelContactId': tempLevel3,
            sourceDisplay: display,
            showSourcePicker: false
        });
    },

    // --- Channel Picker Logic End ---

    validate(): boolean {
        const { customerName, customerPhone } = this.data.form;
        let isValid = true;
        const errors = {
            customerName: false,
            customerPhone: false
        };

        if (!customerName.trim()) {
            errors.customerName = true;
            isValid = false;
        }

        if (!customerPhone.trim() || !/^1\d{10}$/.test(customerPhone)) {
            errors.customerPhone = true;
            isValid = false;
        }

        this.setData({ errors });

        if (!isValid) {
            wx.vibrateShort({ type: 'medium' });
            const msg = errors.customerName ? '请输入客户姓名' : '手机号格式不正确';
            wx.showToast({ title: msg, icon: 'none' });
        }

        return isValid;
    },

    async onSubmit() {
        if (!this.validate()) return;
        if (this.data.submitting) return;

        this.setData({ submitting: true });
        wx.showLoading({ title: '提交中...', mask: true });

        try {
            const app = getApp<IAppOption>();
            const { form } = this.data;

            const res = await app.request('/leads', {
                method: 'POST',
                data: {
                    customerName: form.customerName.trim(),
                    customerPhone: form.customerPhone.trim(),
                    address: form.address.trim() || undefined,
                    intentionLevel: form.intentionLevel || undefined,
                    channelId: form.channelId || undefined,
                    channelContactId: form.channelContactId || undefined,
                    remark: form.remark.trim() || undefined
                }
            });

            if (res.success) {
                wx.hideLoading();
                wx.showToast({ title: '创建成功', icon: 'success' });

                setTimeout(() => {
                    const pages = getCurrentPages();
                    const prevPage = pages[pages.length - 2];
                    if (prevPage && typeof prevPage.fetchList === 'function') {
                        prevPage.fetchList(true); // Refresh list
                    }
                    wx.navigateBack();
                }, 1500);
            } else {
                // Determine error message (handle duplicate specifically if needed)
                let msg = res.error || '创建失败';
                if (res.code === 409) {
                    msg = '线索已存在 (重复)';
                }
                throw new Error(msg);
            }
        } catch (err: unknown) {
            wx.hideLoading();
            console.error('Create lead error:', err);
            const message = err instanceof Error ? err.message : '创建失败';
            wx.showToast({ title: message, icon: 'none' });
        } finally {
            this.setData({ submitting: false });
        }
    }
});

export {};
