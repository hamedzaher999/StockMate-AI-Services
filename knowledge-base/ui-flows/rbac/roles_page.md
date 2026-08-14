---
feature: rbac.roles_page
module: rbac
doc_type: ui_flow
platform: web
routes: [/rbac/roles]
requires_permission: manage_roles
related_capability: permission_model
component_source: src/features/rbac/pages/RolesPage.tsx
tags: [rbac, ui, roles]
last_updated: 2026-08-14
---

## How to get here

Sidebar → **Administration** → **Roles** (tag icon). Requires `manage_roles`.

## Layout

Two panels side by side: a role list on the left (with a search box), and a permission matrix on the right that
appears once you click a role.

## Editing a role's default permissions

1. Click a role name in the left list.
2. The right panel shows every permission, grouped by category, each with a checkbox.
3. Check/uncheck as needed.
4. Click **"Save Permissions"** at the bottom.

Note: if the selected role is the super-admin role, every checkbox is disabled and there's no save button — see
capability doc for why.

## Creating a new custom role

1. Click **"New Role"** button, top-right.
2. Dialog asks for **Name** (must be lowercase snake_case, e.g. `lab_technician` — the form validates this
   pattern and shows an error if you type something else) and optional **Description**.
3. Click **Create**. The new role is auto-selected in the left panel afterward so you can immediately assign it
   permissions.

## Where you assign this role TO a user (not on this page)

This page only manages what a role *can* do in the abstract. To put a specific user into a role, go to
**Users** → click a user → **Profile tab** → change the **Role** dropdown → **Save**. See
`ui-flows/users.detail_permissions_tab.md` for per-user permission overrides specifically.
