---
feature: purchasing.requests_list
module: purchasing
doc_type: ui_flow
platform: web
routes: [/purchasing/requests]
requires_permission: view_purchasing_history
related_capability: purchase_requests
component_source: src/features/purchasing/pages/PurchaseRequestsPage.tsx
tags: [purchasing, ui, list, create]
last_updated: 2026-08-14
---

## How to get here

Sidebar → **Purchasing** section → **Purchase Requests** (shopping cart icon).

## Creating a new purchase request

1. Click **"New"** button, top-right.
2. A dialog opens. For each line item, pick: **Variant** (dropdown of active variants), **Quantity**,
   **Estimated Price** (optional, just for budgeting — see capability doc, this is not the real purchase price).
3. Click **"Add Item"** to add more lines, or the trash icon on a row to remove one (at least one item must
   remain).
4. Optional **Notes** field at the bottom.
5. Click **Create** — this saves it as a **draft**. It is NOT submitted for approval yet at this point.

## Submitting, approving, rejecting (all happen on the detail page, not the list)

Click any row in the list to open its detail page. See `ui-flows/purchasing/request_detail.md` for what happens
there — the buttons you see change entirely based on the request's current status and your role.

## Filtering the list

A status dropdown at the top lets you filter by: draft, pending hospital approval, pending manager approval,
hospital rejected, manager rejected, preparing, complete, partially complete, cancelled.

## What the columns mean

Request Number (e.g. `PR-20260814-A1B2`), Items count, Estimated Total (sum of quantity × estimated price across
lines), Requested By, Date, Status badge (color-coded — see the badge color key: gray=draft, amber=pending,
red=rejected, blue=preparing, green=complete).
