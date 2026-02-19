# Audit Report: Installation Module (Round 2)

> **Date**: 2026-01-17
> **Scope**: Re-audit of `docs/02-requirements/modules/安装单/安装单.md` against codebase.
> **Status**: **Partial Completion** (Major flows done, secondary features missing).

## Executive Summary

Following the first round of rectification (Electronic Signature, Conflict Detection, Logistics), a second deep-dive audit reveals missing features in "Standardized Operations" (Checklist), "Customer Self-Scheduling", and "Field Discovery". The basic "Rework" flows are technically supported by schema but lack specialized UI/API handling.

## 1. Discrepancy Matrix

| Requirement ID | Feature                      | Requirement Description                                                               | Current State                     | Gap Analysis                                                                                                       | Severity   |
| :------------- | :--------------------------- | :------------------------------------------------------------------------------------ | :-------------------------------- | :----------------------------------------------------------------------------------------------------------------- | :--------- |
| **12.1**       | **Standardized Checklist**   | Worker must complete specific checklist items (e.g., Steam Ironing) before Check-out. | Schema `checklist_status` exists. | **Missing Logic**: `checkOut` action does not validate if checklist is complete. No API to update checklist items. | **High**   |
| **13.1**       | **Customer Self-Scheduling** | Link sent to customer to choose time slot; auto-updates task.                         | None.                             | **Completely Missing**: No API, no UI, no notification trigger.                                                    | **Medium** |
| **14.1**       | **Field Discovery**          | Worker records upsell opportunities (e.g., "Old curtain needs replacement").          | Schema `field_discovery` exists.  | **Missing**: No API to add/update discovery items.                                                                 | **Low**    |
| **11.2**       | **Fee Breakdown**            | Detailed fee structure (Base + High Altitude + Distance).                             | Schema `fee_breakdown` exists.    | **Partial**: `laborFee` is a simple number. No logic to calculate or store the structured JSON breakdown.          | **Low**    |
| **12.1**       | **Photo Requirement**        | Checklist items must have photos.                                                     | Schema `install_photos` exists.   | **Missing Validation**: No enforcement that specific checklist items have associated photos.                       | **Medium** |

## 2. Detailed Findings

### 2.1 Standardized Operations (Checklist)

The schema has `checklist_status` (JSONB), but the backend `checkOutInstallTaskAction` only takes signature and location. It blindly accepts completion without checking if the mandatory steps (defined in Req 12.1) are done.

- **Action Required**:
  - Add API to `updateChecklist(taskId, items)`.
  - Add Validation in `checkOut`: `if (!allCompleted) throw Error`.

### 2.2 Customer Self-Scheduling

The requirement describes a flow where a unique link is generated and sent to the customer. This entire subsystem is absent.

- **Recommendations**: Postpone to a dedicated "Customer Portal" task if prioritizing internal efficiency first.

### 2.3 Fee Breakdown

Currently, the system treats `laborFee` as a single flat rate. Requirement 11.1 lists "Base Fee", "High Altitude Fee", etc.

- **Action Required**: Update `dispatch` and `complete` actions to accept `feeBreakdown` JSON object, not just a number.

## 3. Rectification Plan (Round 2)

### Priority 1: Checklist Enforcement (Quality Control)

1.  Implement `updateInstallChecklist` action.
2.  Update `checkOutInstallTaskAction` to validate `checklistStatus`.

### Priority 2: Fee Breakdown (Financial Accuracy)

1.  Update `dispatchTaskSchema` and `confirmInstallationSchema` to include `feeBreakdown`.

### Priority 3: Field Discovery (Sales Growth)

1.  Implement `submitFieldDiscovery` action.

### Defer

- **Customer Self-Scheduling**: Complex feature requiring public-facing pages. Defer to "Customer Experience" phase.

## 4. Conclusion

The module is functional for core operations (Assign -> Install -> Sign -> Complete), but lacks the **Quality Control** (Checklist) and **Upsell** (Discovery) features defined in requirements. We should address Priority 1 (Checklist) immediately to ensure service quality.
