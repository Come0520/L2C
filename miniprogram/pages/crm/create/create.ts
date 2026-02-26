/**
 * 新建客户页面
 * 
 * 功能：
 * 1. 录入客户基本信息（姓名、手机号必填）
 * 2. 多级来源选择器（一级渠道 > 二级渠道 > 联系人）
 * 3. 选填微信号、地址、备注
 * 4. 提交后返回列表页并刷新
 */
import { throttleTap } from '../../../utils/throttle-tap';

// 渠道数据类型定义
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
            name: '',
            phone: '',
            wechat: '',
            address: '',
            channelId: '',      // 二级渠道 ID
            contactId: '',      // 联系人 ID
            notes: ''
        },

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
            name: false,
            phone: false
        }
    },

    onLoad() {
        this.fetchChannels();
    },

    /**
     * 获取渠道树
     */
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

    /**
     * 表单输入处理
     */
    onInput(e: WechatMiniprogram.Input) {
        const field = e.currentTarget.dataset.field;
        const value = e.detail.value;

        const updateData: Record<string, unknown> = {
            [`form.${field}`]: value
        };

        // 清除对应字段的错误状态
        if (field === 'name' || field === 'phone') {
            updateData[`errors.${field}`] = false;
        }

        this.setData(updateData);
    },

    /**
     * 显示来源选择器
     */
    onShowSourcePicker() {
        // 初始化临时选择为当前选择
        this.setData({
            showSourcePicker: true,
            tempLevel1: this.data.selectedLevel1,
            tempLevel2: this.data.selectedLevel2,
            tempLevel3: this.data.selectedLevel3
        });
    },

    /**
     * 隐藏来源选择器
     */
    onHideSourcePicker() {
        this.setData({ showSourcePicker: false });
    },

    /**
     * 选择一级渠道
     */
    onSelectLevel1(e: WechatMiniprogram.TouchEvent) {
        const item = e.currentTarget.dataset.item as ChannelNode;
        const children = item.children || [];

        this.setData({
            tempLevel1: item.id,
            tempLevel1Name: item.name,
            tempLevel2: '',
            tempLevel2Name: '',
            tempLevel3: '',
            tempLevel3Name: '',
            level2Options: children,
            level3Options: []
        });
    },

    /**
     * 选择二级渠道
     */
    onSelectLevel2(e: WechatMiniprogram.TouchEvent) {
        const item = e.currentTarget.dataset.item as ChannelChild;
        const contacts = item.contacts || [];

        this.setData({
            tempLevel2: item.id,
            tempLevel2Name: item.name,
            tempLevel3: '',
            tempLevel3Name: '',
            level3Options: contacts
        });
    },

    /**
     * 选择三级联系人
     */
    onSelectLevel3(e: WechatMiniprogram.TouchEvent) {
        const item = e.currentTarget.dataset.item as ChannelContact;

        this.setData({
            tempLevel3: item.id,
            tempLevel3Name: item.name
        });
    },

    /**
     * 确认来源选择
     */
    onConfirmSource() {
        const { tempLevel1, tempLevel2, tempLevel3, tempLevel1Name, tempLevel2Name, tempLevel3Name } = this.data;

        // 构建显示文本
        let display = tempLevel1Name;
        if (tempLevel2Name) display += ' > ' + tempLevel2Name;
        if (tempLevel3Name) display += ' > ' + tempLevel3Name;

        this.setData({
            selectedLevel1: tempLevel1,
            selectedLevel2: tempLevel2,
            selectedLevel3: tempLevel3,
            'form.channelId': tempLevel2 || tempLevel1, // 优先使用二级渠道 ID
            'form.contactId': tempLevel3,
            sourceDisplay: display,
            showSourcePicker: false
        });
    },

    /**
     * 表单验证
     */
    validate(): boolean {
        const { name, phone } = this.data.form;
        let isValid = true;
        const errors = {
            name: false,
            phone: false
        };

        if (!name.trim()) {
            errors.name = true;
            isValid = false;
        }

        if (!phone.trim() || !/^1\d{10}$/.test(phone)) {
            errors.phone = true;
            isValid = false;
        }

        this.setData({ errors });

        if (!isValid) {
            wx.vibrateShort({ type: 'medium' }); // 震动反馈
            const msg = errors.name ? '请输入客户姓名' : '手机号格式不正确';
            wx.showToast({ title: msg, icon: 'none' });
        }

        return isValid;
    },

    /**
     * 提交表单
     */
    onSubmit: throttleTap(async function (this: any) {
        if (!this.validate()) return;
        if (this.data.submitting) return;

        this.setData({ submitting: true });
        wx.showLoading({ title: '创建中...', mask: true });

        try {
            const app = getApp<IAppOption>();
            const { form, sourceDisplay } = this.data;

            const res = await app.request('/customers', {
                method: 'POST',
                data: {
                    name: form.name.trim(),
                    phone: form.phone.trim(),
                    wechat: form.wechat.trim() || undefined,
                    address: form.address.trim() || undefined,
                    channelId: form.channelId || undefined,
                    contactId: form.contactId || undefined,
                    source: sourceDisplay || undefined,
                    notes: form.notes.trim() || undefined
                }
            });

            if (res.success) {
                wx.hideLoading();
                wx.showToast({ title: '创建成功', icon: 'success' });

                setTimeout(() => {
                    const pages = getCurrentPages();
                    const prevPage = pages[pages.length - 2];
                    if (prevPage && typeof prevPage.fetchList === 'function') {
                        prevPage.fetchList();
                    }
                    wx.navigateBack();
                }, 1500);
            } else {
                throw new Error(res.error || '创建失败');
            }
        } catch (err: unknown) {
            wx.hideLoading();
            console.error('Create customer error:', err);
            const message = err instanceof Error ? err.message : '创建失败';
            wx.showToast({ title: message, icon: 'none' });
        } finally {
            this.setData({ submitting: false });
        }
    })
});

export { };
