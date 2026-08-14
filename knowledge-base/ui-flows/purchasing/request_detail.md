---
feature: purchasing.request_detail
module: purchasing
doc_type: ui_flow
platform: web
routes: [/purchasing/requests/:id]
requires_permission: view_purchasing_history
related_capability: purchase_requests
component_source: src/features/purchasing/pages/PurchaseRequestDetailPage.tsx
tags: [purchasing, ui, approval, workflow]
last_updated: 2026-08-14
---

## The stepper at the top

A row of pill-shaped steps: Draft → Pending Hospital Approval → Pending Manager Approval → Preparing →
Complete. The current/passed steps are highlighted. "Complete" covers both `complete` and `partially_complete`
statuses.

## Buttons you might see, and exactly when

- **"Submit"** — visible only if status is `draft` AND you're the one who created it. Sends it for hospital
  approval.
- **"Hospital Approve"** — visible only if status is `pending_hospital_approval` AND you hold the
  `approve_purchase_request_hospital` permission. One click, no dialog.
- **"Hospital Reject"** — same visibility condition as above. Opens a dialog requiring a rejection reason
  (required text field) before confirming.
- **"Manager Approve"** — visible only if status is `pending_manager_approval` AND you hold
  `approve_purchase_request_manager`. Opens a dialog listing every line item with an editable "approved
  quantity" field (pre-filled with the requested quantity, capped so you can't type more than what was
  requested). Click **Approve** at the bottom to confirm.
- **"Manager Reject"** — visible if status is `pending_manager_approval` (any manager-permission holder), OR if
  status is `preparing` AND you're the specific manager who approved it AND no receipts exist yet for this
  request. Opens a dialog requiring a reason.
- **"Mark Complete"** — visible only if status is `partially_complete` AND you're the specific manager who
  originally approved it. If any linked receipt is still awaiting confirmation, clicking this will fail with an
  error telling you how many receipts are still pending.
- **"Cancel"** — visible if status is draft/pending-hospital/pending-manager AND you're the creator.

## Where receiving happens (not on this page)

This page shows the request and its approval trail, but recording an actual physical receipt (with batch
numbers, expiration dates, photos) happens on a separate page — see `ui-flows/purchasing/receipt_create.md`. You
get there via the **Purchase Receipts** section, not from a button on this request detail page.
