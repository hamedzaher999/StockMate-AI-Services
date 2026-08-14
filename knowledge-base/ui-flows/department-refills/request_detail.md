---
feature: department-refills.request_detail
module: department-refills
doc_type: ui_flow
platform: web
routes: [/refills/requests/:id]
requires_permission: null
related_capability: refill_requests
component_source: src/features/department-refills/pages/RefillRequestDetailPage.tsx
tags: [refills, ui, workflow, ship]
last_updated: 2026-08-14
---

## Stepper and item table

Same pattern as purchase requests — a stepper (Draft → Hospital Approval → Manager Approval → Preparing →
Complete) and a table of items showing Requested / Approved / Delivered quantities (columns appear only once
relevant data exists).

## The "Ship Delivery" flow (this is the complex one)

1. Button **"Ship Delivery"** appears only when status is `preparing` or `partially_complete`, you hold
   `prepare_department_refill`, and there's at least one item still needing more shipment.
2. Dialog opens. First choose **Batch Type**: "Batch" or "Final Batch" — see the capability doc for what this
   controls (whether the request can later close as complete vs partially complete).
3. Below that, one row per item still needing shipment. Each row shows: the material name, how much is still
   needed, a **batch dropdown** (only shows batches actually in stock at the Central Warehouse for that
   specific variant, with quantity shown per batch), and a **quantity to ship** input.
4. You don't have to fill in every row — leaving a row's batch/quantity blank just means "not shipping this item
   in this delivery," you can ship it in a later delivery.
5. Click **"Ship Delivery"** at the bottom.

## Where deliveries already made are shown

Below the items table (only if at least one delivery exists), a **"Deliveries"** sub-table lists every delivery
made against this request, with a status (pending/confirmed). Click a row to go to that delivery's own detail
page for confirmation.

## Approval buttons

Identical pattern to purchase requests — Submit, Hospital Approve/Reject, Manager Approve/Reject, Mark Complete,
Cancel — same visibility rules, just swap the permission names for the refill-specific ones
(`approve_department_refill_request_hospital`, etc.)

## The one extra step purchase requests don't have: approval policy

When you click **"Manager Approve"** on a recurring request (`requestType` isn't `normal`) that has no periodic
schedule yet, the approval dialog shows an **extra dropdown**: "Auto Approved" or "Approval Required Each
Cycle." This dropdown does NOT appear for normal (one-time) requests, or for recurring requests that already
have a schedule from a prior approval.
