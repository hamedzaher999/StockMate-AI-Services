---
feature: shell.navigation
module: shell
doc_type: ui_flow
platform: both
routes: []
requires_permission: null
related_capability: null
component_source: src/components/shared/Sidebar.tsx, src/components/shared/Topbar.tsx
tags: [navigation, shell, mobile, sidebar]
last_updated: 2026-08-14
---

## Desktop (web, wide screens)

A persistent sidebar on the left, always visible, grouped into sections: Clinical, Pharmacy, Inventory,
Department Refills, Purchasing, Administration. Each item only appears if your role/permissions allow it — if
you don't see a section at all, you have no permissions for anything in it.

A collapse button at the bottom of the sidebar shrinks it to icon-only mode (useful on smaller laptop screens) —
click again to expand.

## Mobile (narrow screens, or the mobile app)

The sidebar becomes a slide-out drawer instead of persistent. Tap the hamburger/menu icon in the top-left of the
top bar to open it; tapping any nav item closes it automatically after navigating.

## The top bar (both platforms)

Left: mobile menu button (mobile only). Right side, in order: language toggle (EN/AR), notification bell (shows
unread count badge, click to see a dropdown preview of recent notifications), then your name + role, then
Profile / Settings / Logout icon buttons.

## Notifications

Clicking the bell shows the 8 most recent notifications in a dropdown, auto-refreshing every 30 seconds. Click
any one to mark it read and navigate to the relevant page (currently only wired for batch-expiration alerts,
which take you to the Batches inventory page). Click "View All" at the bottom of the dropdown to go to the full
Notifications page, which lets you filter by category (Inventory, Pharmacy, Purchasing, Queue, AI Insight) and
mark all as read.

## Common questions

- **"I can't find [X] in the menu"** → almost always a permissions issue, not a bug — nav items are hidden
  entirely (not just disabled) if you lack the required permission. Check `permissions/roles/{your_role}.md`.
- **"The sidebar disappeared on my phone"** → that's expected; it's a drawer on mobile, tap the menu icon.
