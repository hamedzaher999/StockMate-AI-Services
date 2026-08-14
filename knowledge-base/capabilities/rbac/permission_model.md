---
feature: permission_model
module: rbac
doc_type: capability
actors: [hospital_manager]
permission_codes: [manage_roles, manage_user_permissions, manage_accounts]
requirement_ref: null
related_capabilities: []
related_ui_flows: [rbac.roles_page, users.detail_permissions_tab]
related_glossary: [permission_effect]
tags: [rbac, permissions, roles, security]
last_updated: 2026-08-14
---

## How access control works — three layers

1. **Role defaults**: every user has exactly one role (e.g. `warehouse_manager`, `doctor`). Each role has a set
   of default permission codes attached to it.
2. **Per-user overrides**: a hospital manager can grant a user a permission their role doesn't normally have, or
   revoke a permission their role does have — without changing their role. This is an "override."
3. **Effective permissions**: what a user can actually do = role defaults, with overrides applied on top.
   `grant` overrides add a permission even if the role lacks it; `revoke` overrides remove a permission even if
   the role has it.

## What happens if a role is deactivated

If a role itself is marked inactive, **all** role-default permissions for every user with that role become
void — except any individual `grant` overrides that user has, which still apply. In other words, deactivating a
role doesn't touch personal overrides.

## The four bulk operations, and what each actually does

- **Grant/Revoke one permission** — the basic single override.
- **Apply Permission Group** — grant or revoke a whole list of permission codes at once. Smart behavior: if
  granting a permission the user's role *already* includes by default, no override row is created (it's
  redundant) — it only creates an override row for permissions the role doesn't already grant. Same logic in
  reverse for revoking.
- **Revoke All Role Permissions** — wipes every existing override for the user, then creates explicit `revoke`
  overrides for every permission their role would normally grant. Net effect: the user ends up with **zero**
  effective permissions (unless later re-granted).
- **Override With Role** — copies another role's permission set onto this user as personal overrides, without
  changing their actual assigned role. Useful for temporary coverage (e.g. giving a nurse doctor-level view
  access for a shift without reassigning their role).

## Rules that always apply, no exceptions

- **A user can never modify their own permission overrides** — not even a hospital manager can self-grant via
  this mechanism. This includes grant, revoke, revoke-all, override-role, and reset-to-default — all blocked for
  your own account.
- **The super-admin role cannot be edited or overridden** — its permission set is implicitly "everything,"
  computed dynamically, not stored as explicit role-permission rows. Attempting to set permissions on it, or
  apply overrides to a super-admin user, is rejected.
- **The Hospital Manager account is a singleton** — cannot be created via the normal "create user" flow, its
  role cannot be reassigned, and it can never be deactivated (the system blocks all three).

## Where to check what's really in effect right now

The single source of truth for "what can this user actually do right now" is the effective-permissions list
shown on their profile (or the Permissions tab on their user-management detail page). Role docs in
`permissions/roles/*.md` describe **defaults**, but overrides can change the real picture — always defer to the
live effective-permissions list when the two disagree.
