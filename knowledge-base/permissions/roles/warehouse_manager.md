---
feature: role.warehouse_manager
module: rbac
doc_type: role_capability
role_name: warehouse_manager
tags: [permissions, role, warehouse_manager]
last_updated: 2026-08-14
generated_from: [permissions.constants.ts, rbac seed data]
---

## Role: Warehouse Manager

This document lists exactly what a user with the **warehouse_manager** role can and cannot do, based on their
default permission set. (Note: an individual user's *effective* permissions can differ from the role default if
a hospital manager has granted or revoked specific permissions for them — if unsure, check "My Profile" →
"Effective Permissions" in the app, which always shows the true current list.)

## What this role CAN do (default permissions)

- **Materials & Catalog**: create/edit products and variants (`manage_materials`), manage department-level
  material settings (`manage_department_materials`), manage units and categories, link suppliers to variants
  (`manage_material_suppliers`).
- **Suppliers**: register and manage suppliers (`manage_suppliers`).
- **Purchasing**: create purchase requests, and — as the role responsible for the Central Warehouse — approve
  department refill requests at the manager stage (`approve_department_refill_request_manager`), prepare and
  ship refill deliveries (`prepare_department_refill`).
- **Inventory**: view inventory, perform inventory adjustments, perform stock counts, transfer inventory between
  departments.
- **Periodic Refill Schedules**: manage recurring refill schedules (`manage_periodic_refill_schedules`).

## What this role CANNOT do by default

- **Cannot** create or manage user accounts (`manage_accounts` — hospital manager only).
- **Cannot** create or edit roles (`manage_roles`).
- **Cannot** approve purchase requests at the hospital-approval stage (`approve_purchase_request_hospital` —
  that's the hospital manager step, before it reaches the purchasing manager).
- **Cannot** confirm purchase receipts (`confirm_purchase_receipt`) — that permission belongs to whoever
  originally created the purchase request being received against, regardless of role; it's an ownership check,
  not a role check.
- **Cannot** dispense prescriptions or manage patient queues — those are pharmacy/reception functions.

## Department scoping note

Several list/view endpoints scope results to "your own department" for most roles, but the **warehouse manager
role is explicitly unrestricted** for: batches, refill requests, refill deliveries, adjustments — meaning a
warehouse manager sees data across *all* departments for these, not just their assigned one. This matches their
job of running the Central Warehouse for the whole hospital.

## Quick answers to common questions

- **"Can I create users?"** → No. Ask your hospital manager.
- **"Can I approve my own purchase request?"** → No — purchase requests go hospital manager → then
  purchasing/warehouse manager for the final approval; the same person who submitted it typically isn't the one
  who approves it, though the system does not technically block a warehouse manager from approving a request
  they personally submitted if they hold the permission (there is no explicit "not your own request" rule in
  approval, only in reject-after-approve).
- **"Why can't I see the confirm-receipt button on this purchase receipt?"** → Only the original requester of
  the linked purchase request can confirm it, not any user with a role-level permission.
