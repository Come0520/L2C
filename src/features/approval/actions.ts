'use server';
/**
 * 审批模块 Server Actions (Barrel File)
 * Logic split into ./actions/*
 */



import * as submission from './actions/submission';
import * as processing from './actions/processing';
import * as queries from './actions/queries';
import * as utils from './actions/utils';

export const {
    submitApprovalRequest
} = submission;

export const {
    processApprovalDecision
} = processing;

export const {
    findActiveApprovalFlow,
    getPendingApprovals
} = queries;

export const {
    // Add exports from utils if any
} = utils;
