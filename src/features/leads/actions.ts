/**
 * 线索模块 - 统一导出入口 (Barrel Export)
 *
 * 将查询类 (queries) 和变更类 (mutations) 的 Server Actions 统一导出，
 * 方便其他模块和页面层通过单一路径引入线索相关操作。
 *
 * @module leads/actions
 */

import {
    getLeads,
    getLeadById,
    getLeadTimeline,
    getChannels,
    getSalesUsers
} from './actions/queries';

import {
    createLead,
    updateLead,
    assignLead,
    voidLead,
    addFollowup,
    releaseToPool,
    claimFromPool,
    convertLead,
    importLeads
} from './actions/mutations';

export {
    getLeads,
    getLeadById,
    getLeadTimeline,
    getChannels,
    getSalesUsers,
    createLead,
    updateLead,
    assignLead,
    voidLead,
    addFollowup as addLeadFollowup,
    releaseToPool,
    claimFromPool,
    convertLead,
    importLeads
};
