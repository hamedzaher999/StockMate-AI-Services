---
feature: refill_requests
module: department-refills
doc_type: capability
actors: [warehouse_manager, hospital_manager]
permission_codes: [create_department_refill_request, approve_department_refill_request_hospital, approve_department_refill_request_manager]
requirement_ref: null
related_capabilities: [refill_deliveries, periodic_refill_schedules]
related_ui_flows: [department-refills.requests_list, department-refills.request_detail]
related_glossary: [request_status, batch_type, refill_request_type]
tags: [refills, department, approval, workflow]
last_updated: 2026-08-14
---

## What this is

A Department Refill Request is how a clinical department (not the Central Warehouse itself) asks to be
restocked from the Central Warehouse. It follows the **exact same approval lifecycle** as Purchase Requests —
see `glossary/request_status.md` — draft → hospital approval → manager approval (warehouse manager, in this
case) → preparing → deliveries → complete.

## Who can create one

Any user with `create_department_refill_request` who is assigned to a non-Central-Warehouse, active department.
The Central Warehouse itself cannot submit refill requests — it fulfills them, it doesn't request from itself.
The requesting department is auto-derived from the creator's own assigned department; you cannot request on
behalf of a different department.

## One-time vs recurring requests

A request has a `requestType`: `normal` (one-off), or `daily`/`weekly`/`monthly` (recurring).
- **Normal** requests must NOT include a `frequencyInterval`.
- **Recurring** requests MUST include a `frequencyInterval` (e.g. "every 2 weeks" = weekly + interval 2).

## What happens when a recurring request gets manager-approved (this is the tricky part)

If this is the **first time** this particular recurring pattern is being approved (no periodic schedule exists
for it yet), the approving manager must also choose an `approvalPolicy`:
- **`auto_approved`** — future occurrences skip the hospital-approval stage entirely and go straight to
  `pending_manager_approval` when auto-generated.
- **`approval_required_each_cycle`** — every future occurrence still needs full hospital + manager approval,
  same as the first one.

Once this choice is made, a **Periodic Refill Schedule** is created and linked. See `periodic_refill_schedules`
capability doc for how future occurrences get auto-generated on their due date and what happens if no Central
Warehouse manager or hospital manager is configured to receive the "needs approval" notification.

If this recurring request is **not** the first occurrence (a schedule already exists and generated it), the
`approvalPolicy` field must NOT be provided at approval time — it's a one-time choice, not a per-occurrence one.

## Completion mechanics — identical to purchase requests

Auto-complete vs partially-complete vs manual-complete works exactly like purchase requests. See
`glossary/batch_type.md`. The key actors differ though: here it's the warehouse manager creating deliveries
(shipping from warehouse stock) and the department's own staff confirming receipt — see `refill_deliveries`
capability doc for that half.

## Common questions this answers

- **"Why do I need to pick auto-approve vs approval-required?"** → Only asked once, the first time you approve a
  brand-new recurring pattern; it decides whether future auto-generated requests from that schedule skip
  hospital approval.
- **"Can the Central Warehouse request refills for itself?"** → No, structurally blocked.
- **"I'm a department staff member, why can't I request for another department?"** → Requests are always tied to
  your own assigned department; there's no way to request on behalf of someone else's.
