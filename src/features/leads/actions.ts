'use server';

import {
    getLeads,
    getLeadDetail,
    getLeadTimeline,
    getChannels
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
    getLeadDetail,
    getLeadTimeline,
    getChannels,
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


