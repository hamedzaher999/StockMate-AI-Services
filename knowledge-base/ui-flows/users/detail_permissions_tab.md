---
feature: users.detail_permissions_tab
module: rbac
doc_type: ui_flow
platform: web
routes: [/users/:id]
requires_permission: manage_user_permissions
related_capability: permission_model
component_source: src/features/users/pages/UserDetailPage.tsx
tags: [rbac, ui, users, permissions, overrides]
last_updated: 2026-08-14
---

## How to get here

**Users** page → click any user row → their detail page opens with two tabs: **Profile** and **Permissions**.
Click **Permissions**.

## What you see

Every permission in the system, grouped by category, each as a checkbox showing whether it's currently
*effective* for this user (checked = they have it right now, accounting for both role default and any
override).

If a permission has an override applied, a small colored badge appears next to it: green "grant" or red
"revoke" badge, plus a small **"clear override"** link to remove just that one override and fall back to the
role default.

## Toggling a single permission

Click the checkbox directly. This immediately creates (or updates) a `grant` or `revoke` override for that one
permission — no separate save button, it applies on click.

## Bulk actions

- **"Reset to Default"** button, top-right of the panel — wipes every override for this user, so they fall back
  purely to their role's defaults.

(Note: "Apply Permission Group", "Revoke All", and "Override With Role" described in the capability doc exist as
backend endpoints but are not currently exposed as buttons on this specific page in the web UI — they would need
to be called via API directly if needed today.)

## The one thing you can never do here

If you open your **own** user detail page, every checkbox is disabled and bulk buttons are hidden — see
capability doc: you cannot modify your own permissions through any path.
