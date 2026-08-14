---
feature: glossary.permission_effect
module: shared
doc_type: glossary
tags: [glossary, enum, permissions, rbac]
last_updated: 2026-08-14
source: prisma PermissionEffect enum
---

## PermissionEffect: `grant` vs `revoke`

Used only on individual **override** rows (`UserPermission` records) — not on role-permission rows, which are
always additive by nature (a role simply has or doesn't have a permission).

- **`grant`** — this specific user gets this specific permission, even if their role doesn't include it by
  default.
- **`revoke`** — this specific user is explicitly denied this specific permission, even if their role includes
  it by default.

## Order of evaluation

Effective permission for a user = (their role's default permissions) with overrides applied on top. A `grant`
override always wins if the role lacks it; a `revoke` override always wins if the role has it. There's no
"partial" or "conditional" permission — it's binary per user per permission code.

See `capabilities/rbac/permission_model.md` for the full behavior including bulk operations.
