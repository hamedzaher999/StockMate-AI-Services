---
feature: glossary.request_status
module: shared
doc_type: glossary
tags: [glossary, enum, status, purchase_request, refill_request]
last_updated: 2026-08-14
source: prisma RequestStatus enum, used by both PurchaseRequest and DepartmentRefillRequest
---

## RequestStatus (shared by Purchase Requests and Department Refill Requests)

Both purchase requests and department refill requests use the exact same status lifecycle:

1. **draft** — being edited, not yet visible to approvers. Only the creator can edit or submit it.
2. **pending_hospital_approval** — submitted, waiting for a hospital manager to approve or reject.
3. **pending_manager_approval** — hospital approved it; now waiting for the purchasing manager (purchase
   requests) or warehouse manager (refill requests) to approve quantities and move it into preparation.
4. **hospital_rejected** — rejected at the first approval stage. Terminal — cannot be resubmitted, a new
   request must be created.
5. **manager_rejected** — rejected at the second approval stage (before preparation, or after — see note below).
   Terminal.
6. **preparing** — approved with quantities set; the warehouse can now generate receipts (purchasing) or
   deliveries (refills) against it.
7. **complete** — all approved quantities have been fully received/delivered.
8. **partially_complete** — some but not all approved quantities have arrived; a manual "complete" action by
   the approving manager can close it out early, but only once every linked receipt/delivery has been confirmed
   by the receiver.
9. **cancelled** — the requester withdrew it (only allowed from draft / pending_hospital_approval /
   pending_manager_approval).

## Important nuance: rejecting after approval

A request in **preparing** status can still be rejected → **manager_rejected**, but only by the same manager who
approved it, and only if **zero** receipts/deliveries have been generated yet. Once even one receipt or delivery
exists, rejection is blocked — the request must instead run its course to complete/partially_complete.

## How completion is decided (batch vs final_batch)

See `glossary/batch_type.md` for how the `type` field on a receipt/delivery (`batch` vs `final_batch`) determines
whether reaching this status is `complete` or `partially_complete`.
