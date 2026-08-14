---
feature: suppliers.list
module: suppliers
doc_type: ui_flow
platform: web
routes: [/suppliers]
requires_permission: manage_suppliers
related_capability: manage_suppliers
component_source: src/features/suppliers/pages/SuppliersPage.tsx
tags: [suppliers, ui, create]
last_updated: 2026-08-14
---

## How to get here

Sidebar → **Administration** section → **Suppliers** (factory icon). Requires `manage_suppliers` permission to
even see this nav item — if it's missing from your sidebar, you don't have access.

## Adding a new supplier

1. Click **"Add Supplier"** button, top-right of the page.
2. Dialog opens with fields: Name, Contact Person, Phone, Email, Address.
3. Fill in what you have (Name is required; the rest are optional but at least a phone or email is recommended).
4. Click **Save**.

## Editing a supplier

1. In the suppliers table, click the pencil/edit icon on the row for that supplier.
2. Same dialog opens, pre-filled. Edit fields.
3. Click **Save**.

## The table columns

Name, Contact Person, Phone, Email, Address, then an edit icon. There is currently no active/inactive toggle
visible directly on this table row — status changes happen via the API but aren't wired to a UI control on this
page as of this version.

## Where to link this supplier to an actual material

This page does **not** do that. Go to **Administration → Products → Variants tab**, open a variant, and use its
supplier-linking control there. See `ui-flows/catalog/variants.md`.

## Where to view what this supplier has supplied historically

Not directly from this page in the current UI — the backend supports `/suppliers/:id/variants` but there is no
button here that navigates to it yet.
