---
feature: refill_deliveries
module: department-refills
doc_type: capability
actors: [warehouse_manager]
permission_codes: [prepare_department_refill, confirm_department_delivery]
requirement_ref: null
related_capabilities: [refill_requests]
related_ui_flows: [department-refills.request_detail, department-refills.delivery_detail]
related_glossary: [batch_type]
tags: [refills, delivery, fefo, warehouse]
last_updated: 2026-08-14
---

## What this is

Once a refill request is `preparing` (or `partially_complete`, for follow-up shipments), the warehouse manager
ships physical stock from Central Warehouse batches to the requesting department. This is a **Delivery** — a
separate record from the request itself, and a request can have multiple deliveries over time.

## Creating a delivery — how batch selection works

The warehouse manager (or whoever holds `prepare_department_refill`) picks, per approved line item, which
specific warehouse **batch** to ship from and how much. The system checks:
- The chosen batch must actually be stocked at the Central Warehouse (not some other department).
- The batch's variant must match the refill item's requested variant.
- There must be enough quantity in that specific batch — the system does not automatically split across
  multiple batches for you; you (the human) choose which batch(es) to draw from if you want to split.

This is a **manual FEFO-adjacent process** — unlike consumption/dispensing (which auto-picks earliest-expiring
stock via FEFO), delivery shipping requires you to explicitly pick the batch, so you can make an informed choice
about which expiration dates to send out.

## The `batch` vs `final_batch` type on a delivery

Every delivery has a `type`: `batch` (default) or `final_batch`. This directly affects whether the parent
request's status becomes `complete` or `partially_complete` once the department confirms receipt — see
`glossary/batch_type.md` for the exact rule. In short: mark a delivery `final_batch` when you know this is the
last shipment you intend to send for this request, even if the department ends up receiving less than the full
approved amount (e.g. supplier shortage) — it forces the request to closed status rather than leaving it stuck
"partially complete" forever.

## Confirming a delivery (the receiving department's job)

Once a delivery arrives, someone with `confirm_department_delivery` — either the original requester, or any
staff member in the requesting department, or a hospital manager — confirms it by entering the **actually
received quantity per line item** (may differ from what was shipped, e.g. breakage in transit). This is where
warehouse stock is decremented and department stock is incremented — the delivery isn't "real" in terms of
inventory movement until confirmed.

Confirming requires quantities for **every single line item** on that delivery — you cannot partially confirm a
delivery and leave some items unconfirmed.

## Why you can't ship more than once and mess up totals

Each confirmation is added to a running cumulative total per refill line item. The system uses this cumulative
figure (not the single delivery's amount) to decide whether the overall request line item is now fully
satisfied — so multiple partial deliveries against the same request correctly stack up rather than overwrite
each other.
