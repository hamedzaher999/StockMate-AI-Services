---
feature: manage_suppliers
module: suppliers
doc_type: capability
actors: [warehouse_manager, hospital_manager]
permission_codes: [manage_suppliers]
requirement_ref: WS-21
related_capabilities: [manage_variants]
related_ui_flows: [suppliers.list]
related_glossary: []
tags: [suppliers, vendors]
last_updated: 2026-08-14
---

## What this is

A Supplier is a vendor record: name, phone, email, address. Registering a supplier does **not** by itself link
it to any material — it's a standalone contact record that gets *linked* to product variants separately (see
`manage_variant_suppliers` in the catalog module) or referenced when creating a purchase receipt / department
refill delivery.

## Uniqueness rules

- A supplier is considered duplicate if the **same name + same phone** OR **same name + same email** already
  exists. Different suppliers can share a name if their contact details differ (e.g. two branches).
- At least one of phone or email should be provided, though the schema does not hard-require either at the
  database level.

## Deactivation

Setting `isActive: false` on a supplier does not delete or unlink anything. It simply should prevent (at the
UI/business level) new links to variants — inactive suppliers cannot be newly linked via
`manage_variant_suppliers` ("Cannot link an inactive supplier to a variant"), but existing links and historical
batches/receipts referencing that supplier remain untouched and viewable.

## Who can do what

- Create/edit/activate/deactivate suppliers: `manage_suppliers` permission (warehouse manager, hospital manager
  by default).
- View suppliers and their linked variants: open to any authenticated user, no permission required.

## Related: viewing what a supplier supplies

There's a dedicated endpoint to list all variants linked to a given supplier (paginated) — useful for "what do
we buy from Supplier X" questions. This is separate from the supplier's own record.
