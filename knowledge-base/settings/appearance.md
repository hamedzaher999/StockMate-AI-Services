---
feature: settings.appearance
module: settings
doc_type: settings
platform: web
routes: [/settings]
requires_permission: null
related_capability: null
component_source: src/features/settings/pages/SettingsPage.tsx
tags: [settings, theme, appearance, personalization]
last_updated: 2026-08-14
---

## Where this is

Click the gear/**Settings** icon (bottom of the sidebar, or via the user menu in the top bar). No special
permission is required — every logged-in user can change their own appearance settings.

## Changing the theme color

1. On the Settings page, under **"Theme Color"**, click one of the five preset color swatches, OR
2. Use the custom color picker (the small color-swatch input next to the hex code field) to pick any color, OR
3. Type a hex code directly into the text field next to it (e.g. `#1A56DB`).

The change applies immediately across the whole app — no save button needed.

## Changing font size

Under **"Appearance" → "Font Size"**, click one of four buttons: Small, Base, Large, Extra Large. Applies
immediately.

## Changing border radius (how rounded corners look)

Under **"Appearance" → "Border Radius"**, click one of five buttons: None, Small, Medium, Large, Full (pill-shaped).

## Dark mode

Under **"Appearance"**, there is a toggle switch labeled **"Dark Mode"**. Click to switch instantly.

## Density (compact vs comfortable spacing)

Under **"Appearance" → "Density"**, choose **Compact** or **Comfortable**.

## Currency display

Under **"Regional" → "Currency"**, choose **ILS (₪)** or **USD ($)**. This only changes how money amounts are
*displayed* throughout the app (purchase prices, estimated costs) — it does not do currency conversion.

## Language

Under **"Regional" → "Language"**, choose **EN** or **AR** (Arabic). This also flips the whole interface to
right-to-left layout when Arabic is selected.

## Resetting everything

A **"Reset"** button at the bottom of the Settings page reverts all appearance/regional choices back to defaults
(red theme, 14px font, medium radius, comfortable density, ILS, English).

## Important: these settings are personal, not organizational

All settings on this page are stored in the browser only (per-device), not synced to the user's account on the
server. Switching devices or browsers resets them to default.
