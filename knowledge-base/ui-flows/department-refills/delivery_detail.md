---
feature: department-refills.delivery_detail
module: department-refills
doc_type: ui_flow
platform: web
routes: [/refills/deliveries/:id]
requires_permission: null
related_capability: refill_deliveries
component_source: src/features/department-refills/pages/DeliveryDetailPage.tsx
tags: [refills, ui, confirm, delivery]
last_updated: 2026-08-14
---

## How to get here

Either the **Deliveries** page (sidebar → Department Refills → Deliveries), or by clicking a delivery row from
inside a refill request's detail page.

## Confirming a delivery

1. **"Confirm"** button appears only if the delivery is still pending (not yet confirmed) and you hold
   `confirm_department_delivery`.
2. Dialog opens listing every item on the delivery, each pre-filled with the **shipped quantity** as a starting
   value in an editable "received" input.
3. Adjust any quantity that arrived different from what was shipped (e.g. breakage — enter the lower actual
   count).
4. Optional notes field.
5. Click **"Confirm"**. You must provide a value for every item — you can't leave any blank.

## What the table shows after confirmation

Once confirmed, two extra columns appear: **Received Qty** and **Discrepancy** (shipped minus received — shown
in red if non-zero, meaning something was lost/damaged in transit).

## Reading delivery status elsewhere

The Deliveries list page shows all deliveries hospital-wide if you hold `prepare_department_refill`
(warehouse-side view), or scoped to your own department if you only hold `confirm_department_delivery`
(receiving-side view) — the subtitle on that list page tells you which mode you're in.
