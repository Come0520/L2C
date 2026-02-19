'use server';

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


