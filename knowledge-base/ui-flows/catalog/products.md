---
feature: catalog.products
module: catalog
doc_type: ui_flow
platform: web
routes: [/catalog/products]
requires_permission: manage_materials
related_capability: manage_products
component_source: src/features/catalog/pages/ProductsPage.tsx
tags: [products, catalog, ui, create]
last_updated: 2026-08-14
---

## How to get here

1. In the left sidebar, open the **Administration** section.
2. Click **Products** (box/layers icon).
3. You land on a page with four tabs: **Products**, **Variants**, **Units**, **Categories**. It opens on the
   Products tab by default.

## Creating a new product

1. On the Products tab, click the **"Add Product"** button in the top-right corner of the page.
2. A dialog titled "New Product" opens with these fields:
   - **Name** — free text.
   - **Category** — dropdown, optional, populated from existing categories.
   - **Type** — dropdown with two choices: "Consumable" or "Fixed Asset".
   - **Description** — free text box, optional.
3. Click **Create** at the bottom of the dialog.
4. The dialog closes and the new product appears in the table.

## Reading the products table

Columns shown: Name, Category, Type (badge — blue for consumable, orange for fixed asset), Status (badge —
green "active" / gray "inactive").

There is no inline "activate/deactivate" toggle on the Products tab specifically (unlike the Variants tab, which
has one) — status changes for products currently go through the update-status API but are not wired to a button
in this page as of this version.

## Where creating a Variant happens (different tab, same page)

1. Click the **Variants** tab at the top.
2. Click **"Add Variant"** button.
3. Dialog fields: **Product** (dropdown — must pick an existing product first), **Variant Name**, **SKU**,
   **Unit** (dropdown, from Units tab data).
4. Click **Create**.
5. Each row in the Variants table has a **status switch** you can click directly to activate/deactivate — no
   dialog needed for that one.

## Where Units and Categories are managed (same page, different tabs)

Both the Units tab and Categories tab use a simple inline form (name input + button) above a table, no dialog —
type the name, click the **+** button, it's added immediately. Each row has a trash-can icon to delete.

## Mobile differences

None specific to this page beyond the general mobile shell — see `ui-flows/shell/navigation.md` for how the
sidebar becomes a drawer. All dialogs render full-width on mobile.

## Common "why can't I..." answers for this specific page

- **"I don't see the Add Product button"** → the user's role lacks `manage_materials`. Confirm via
  `permissions/roles/{their_role}.md`.
- **"I can't select a category when creating a product"** → no categories exist yet; direct them to the
  Categories tab first.
