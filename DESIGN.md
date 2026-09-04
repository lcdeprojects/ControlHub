---
name: NexumHub Design System
colors:
  bg: "#09090b"
  surface: "#18181b"
  surface-hover: "#27272a"
  border: "#27272a"
  text-primary: "#ffffff"
  text-secondary: "#a1a1aa"
  text-muted: "#71717a"
  primary: "#10b981"
  primary-hover: "#059669"
  accent-cyan: "#06b6d4"
  accent-amber: "#f59e0b"
  accent-rose: "#f43f5e"
typography:
  h1: { fontFamily: Inter, fontSize: 24px, fontWeight: 700, lineHeight: 1.2 }
  h2: { fontFamily: Inter, fontSize: 18px, fontWeight: 600, lineHeight: 1.3 }
  body-md: { fontFamily: Inter, fontSize: 14px, fontWeight: 400, lineHeight: 1.5 }
  body-sm: { fontFamily: Inter, fontSize: 12px, fontWeight: 400, lineHeight: 1.5 }
  label-xs: { fontFamily: Inter, fontSize: 10px, fontWeight: 700, lineHeight: 1.4 }
rounded:
  sm: 6px
  md: 12px
  lg: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
---

# NexumHub Visual Specification

## Overview
NexumHub is a modern, high-density financial management and administrative control platform. The visual aesthetic is dark-mode native with crisp contrasts, structured alignment, and semantic color-coded status badges.

## Colors
- **Background (`#09090b` / `zinc-950`):** Deep black foundation.
- **Surface (`#18181b` / `zinc-900`):** Elevated cards, modals, and container elements.
- **Border (`#27272a` / `zinc-800`):** Subdued borders for clean sectioning without visual noise.
- **Primary / Emerald (`#10b981`):** Success states, Active Pro status, key confirmation CTA.
- **Cyan (`#06b6d4`):** Free trial status, informational badges.
- **Amber (`#f59e0b`):** Warning, pending actions, reset password links.
- **Rose (`#f43f5e`):** Expired status, destructive actions, revoking tokens.

## Layout & Components
- **Backoffice User Management Table:**
  - Table row height: spacious padding for readability (`px-5 py-3.5`).
  - Dedicated Status column for badges.
  - Dedicated Actions column with clear grouping (Dropdown or Action pill buttons).
  - Clear visual hierarchy with non-wrapping elements (`whitespace-nowrap`).

## Do's and Don't's
- **Do:** Keep status badges compact with clear text contrast and subtle translucent background overlays.
- **Do:** Group table action buttons cleanly so they don't break table column alignments.
- **Don't:** Mix action buttons inside status cells. Keep status visual indicators separate from operational action triggers.
