---
feature: manage_products
module: catalog
doc_type: capability
actors: [warehouse_manager, hospital_manager]
permission_codes: [manage_materials]
requirement_ref: WS-5
related_capabilities: [manage_variants, manage_categories, manage_units, department_stock_settings]
related_ui_flows: [catalog.products]
related_glossary: [material_type]
tags: [products, catalog, materials]
last_updated: 2026-08-14
---

## What this is

A **Product** is the general definition of a material (e.g. "Paracetamol 500mg", "Infusion Pump"). It does not itself
hold stock — stock is tracked per **Variant** (see `manage_variants`), which belongs to a Product. A Product only
carries shared attributes: name, category, material type, description, active status.

## Material types and what they change

A product's `materialType` is either:
- **`consumable`** — normal stock that gets used up (medications, disposables). Can be recorded as department
  consumption (see `record_department_consumption`), and adjusted as damaged, expired, shrinkage, or found.
- **`fixed_asset`** — durable equipment (infusion pumps, monitors). **Cannot** be recorded as department
  consumption — the system rejects this with "Fixed assets cannot be consumed -- report damaged or shrinkage
  instead." Can only be adjusted as `damaged` or `shrinkage` (not `expired` or `found`).

This distinction is set once at product creation and is not editable afterward via the update endpoint.

## Creation rules

- `categoryId` is optional; if provided, the category must already exist.
- Name is not required to be unique — uniqueness is enforced at the **Variant** level via SKU, not at the Product
  level, because the same product name can have many variants (different unit sizes, formulations).
- New products default to `isActive: true`.

## Deactivation effects

Setting a product inactive (via status toggle) does not cascade to its variants automatically. However:
- New variants cannot be created under an inactive product ("Cannot create a variant under an inactive product").
- Existing variants of an inactive product can still be viewed but the product-level inactivity should be checked
  by staff before requesting or consuming — the system does check parent-product activity in several places
  (refill requests, purchase requests, stock settings all reject if `!product.isActive`).

## Who can do what

- **Create / edit / activate / deactivate products**: requires `manage_materials` permission. In practice this is
  the warehouse manager role and the hospital manager role (hospital manager is typically unrestricted across the
  system).
- **View products**: no special permission required — the product list and detail endpoints are open to any
  authenticated user.

## What this is NOT

- This is not where you set minimum/maximum stock thresholds — that's `department_stock_settings`, configured
  per variant per department.
- This is not where you link a product to a supplier — suppliers link to **variants**, not products, see
  `manage_variant_suppliers`.
