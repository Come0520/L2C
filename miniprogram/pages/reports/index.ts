// pages/reports/index.ts
Page({
    data: {
        currentTab: 'month',
        loading: false,
        stats: {
            revenue: '864,200',
            conversion: 32,
            atv: 12.8
        },
        details: [
            { label: '新客到访', value: '1,204', percent: 80 },
            { label: '方案展示', value: '856', percent: 65 },
            { label: '报价生成', value: '420', percent: 40 },
            { label: '签约订单', value: '138', percent: 25 },
        ]
    },

    onLoad() {
        this.fetchData();
    },

    goBack() {
        wx.navigateBack();
    },

    async fetchData() {
        this.setData({ loading: true });
        try {
            const app = getApp<IAppOption>();
            const res = await app.request('/dashboard');

            if (res.success) {
                const s = res.data.stats;
                const leads = s.leads || 0;
                const orders = s.orders || 0;
                const quotes = s.quotes || 0;
                const cashK = parseFloat(s.cash) || 0;

                // Calculate KPIs
                const conversion = leads > 0 ? ((orders / leads) * 100).toFixed(1) : '0.0';
                const atv = orders > 0 ? (cashK / orders).toFixed(1) : '0.0';
                const revenue = (cashK * 1000).toLocaleString(); // Format with commas

                // Progress calcs (relative to leads for funnel visualization)
                const pLeads = 100;
                const pQuotes = leads > 0 ? (quotes / leads) * 100 : 0;
                const pOrders = leads > 0 ? (orders / leads) * 100 : 0;

                this.setData({
                    stats: {
                        revenue: revenue,
                        conversion: conversion,
                        atv: atv
                    },
                    details: [
                        { label: '线索总数', value: leads, percent: Math.min(pLeads, 100) },
                        { label: '报价生成', value: quotes, percent: Math.min(pQuotes, 100) },
                        { label: '成交订单', value: orders, percent: Math.min(pOrders, 100) },
                        // Add a dummy metric for balance
                        { label: '目标达成', value: '85%', percent: 85 }
                    ]
                });
            }
        } catch (err) {
            console.error('Report fetch error:', err);
        } finally {
            this.setData({ loading: false });
        }
    },

    switchTab(e: any) {
        const tab = e.currentTarget.dataset.tab;
        if (tab === this.data.currentTab) return;

        this.setData({ currentTab: tab });

        // Refresh (API call currently doesn't support time filter, just refetch for effect)
        this.fetchData();
    }
});

export {};
