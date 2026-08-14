---
feature: glossary.batch_type
module: shared
doc_type: glossary
tags: [glossary, enum, batch_type, completion]
last_updated: 2026-08-14
source: prisma BatchType enum, used by PurchaseReceipt and DepartmentRefillDelivery
---

## BatchType: `batch` vs `final_batch`

Set on every purchase receipt and every refill delivery. Controls how completion is decided once quantities are
confirmed.

## The exact rule

For a given request (purchase or refill), after any receipt/delivery is confirmed:

- If **every** line item's cumulative confirmed quantity has met or exceeded its approved quantity →
  status becomes **`complete`**, regardless of batch type.
- Otherwise, if the receipt/delivery that was just confirmed was marked **`final_batch`** → status becomes
  **`complete`** anyway, even though some items are short. This is the escape hatch for "the supplier can't
  deliver the rest, close this out."
- Otherwise (batch type `batch`, and items still short) → status becomes **`partially_complete`**, expecting
  more shipments to come later.

## Why this matters when shipping/receiving

Mark a receipt or delivery as `final_batch` **only when you know it's the last one you'll send/record for this
request** — even if quantities don't fully match. If you're not sure and more may follow, leave it as the
default `batch` type.

## What happens after `partially_complete`

The approving manager can later manually push it to `complete` (see the "Mark Complete" action in the relevant
capability doc) once every outstanding receipt/delivery has itself been confirmed — this is a deliberate human
decision, not automatic.
