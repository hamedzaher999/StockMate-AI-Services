---
feature: purchase_requests
module: purchasing
doc_type: capability
actors: [warehouse_manager, purchasing_manager, hospital_manager]
permission_codes: [create_purchase_request, approve_purchase_request_hospital, approve_purchase_request_manager, view_purchasing_history]
requirement_ref: null
related_capabilities: [purchase_receiving, manage_suppliers]
related_ui_flows: [purchasing.requests_list, purchasing.request_detail]
related_glossary: [request_status, batch_type]
tags: [purchasing, approval, workflow]
last_updated: 2026-08-14
---

## What this is

A Purchase Request is how the hospital buys new stock from a supplier. It goes through a two-stage approval
before anything is actually purchased or received. See `glossary/request_status.md` for the full status
lifecycle shared with refill requests.

## The full lifecycle for a purchase request

1. **Create (draft)**: anyone with `create_purchase_request` builds a request with line items — variant,
   requested quantity, optional estimated price, optional notes. Saved as `draft`, editable, not yet visible to
   approvers.
2. **Submit**: creator submits → `pending_hospital_approval`. Cannot submit with zero items.
3. **Hospital approval**: a hospital manager either approves (→ `pending_manager_approval`) or rejects with a
   required reason (→ `hospital_rejected`, terminal).
4. **Manager approval**: a purchasing manager sets the **approved quantity per line item** (can be less than or
   equal to what was requested, never more) → `preparing`. Or rejects with reason → `manager_rejected`.
5. **Receiving**: once `preparing`, a warehouse staff member can record purchase receipts against it (see
   `purchase_receiving`) — this is where actual batches with expiration dates enter the warehouse.
6. **Completion**: as receipts get confirmed, the request auto-transitions to `complete` (all approved quantities
   fully received) or `partially_complete` (some short). See `glossary/batch_type.md` for how the receipt's
   `batch`/`final_batch` type affects this decision.
7. **Manual complete**: from `partially_complete`, the **same manager who approved it** can manually mark it
   `complete` — but only once every linked receipt has been confirmed by the receiver (no receipts left in
   `pending_confirmation`).

## Who can cancel, and when

Only the original requester, and only while the request is still in `draft`, `pending_hospital_approval`, or
`pending_manager_approval`. Once it reaches `preparing`, it can no longer be cancelled outright — it must be
rejected (if no receipts exist yet) or run to completion.

## The "reject after approval" edge case

A request already in `preparing` can still be rejected → `manager_rejected`, but only by the same manager who
approved it, and only if **zero purchase receipts exist yet**. The moment even one receipt has been created
against it, this door closes.

## Estimated price vs actual price

`estimatedPrice` (set at request creation) is just for budgeting/visibility — it has no effect on what actually
gets recorded. The real `purchasePrice` is entered later, per batch, at the receiving stage.

## Who sees what in the list view

Regular requesters only see purchase requests **they created**. Purchasing managers and hospital managers see
all requests regardless of who created them (they're "unrestricted" for this module).

## Common questions this answers

- **"Why can't I edit my purchase request anymore?"** → It's past `draft` status. Only drafts are editable.
- **"Can I request more than what gets approved?"** → Yes, that's expected — the approver sets the real quantity;
  your requested quantity is just a starting point/ask.
- **"My request says partially_complete, why isn't it done?"** → Not all approved quantity has arrived yet from
  the supplier, or (if it should be done) the approving manager needs to click "Mark Complete" manually once all
  outstanding receipts are confirmed.
