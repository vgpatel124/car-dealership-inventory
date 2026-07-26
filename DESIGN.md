# Design System — Car Dealership Inventory

This document is the single source of truth for the visual design of the app.
Keep it in sync as the UI grows so the look stays consistent.

## Concept

A calm, editorial "showroom" feel. A dark **ink** sidebar anchors navigation on
the left, while the main workspace is a warm **paper** canvas. The signature
element is the **StockGauge** — a fuel-gauge-style dial that turns a boring
`Qty: 3` into an at-a-glance read on inventory health (empty → full).

## Color tokens

| Token   | Hex       | Usage                                   |
| ------- | --------- | --------------------------------------- |
| `ink`   | `#14183B` | Sidebar / nav / primary text on paper   |
| `paper` | `#F6F5F1` | Main canvas background                  |
| `amber` | `#E2A63B` | Primary actions, focus ring, low stock  |
| `moss`  | `#3E8F6F` | In-stock / healthy state                |
| `ember` | `#C1443A` | Sold-out / danger / destructive actions |

## Typography

| Family          | Role                                   |
| --------------- | -------------------------------------- |
| Space Grotesk   | Headings, make/model, prices (display) |
| Inter           | Body copy, forms, labels               |
| IBM Plex Mono   | Prices, quantities, VINs (numeric)     |

All three families are loaded via Google Fonts in `frontend/index.html`.

## Layout

- **Sidebar** (`ink`): fixed left column, ~240px on desktop, collapses on
  small screens. Nav items: Inventory, Search, Admin.
- **Main canvas** (`paper`): responsive grid of `VehicleCard`s
  (1 col mobile → 2 → 3 on wide screens).
- **VehicleCard**: make/model in display font, a category `Badge`, the
  `StockGauge`, price in mono font, and a Purchase button that disables and
  reads "Sold out" at `quantity === 0`.

## Accessibility

- Visible `:focus-visible` ring in `amber` on all interactive elements.
- Respect `prefers-reduced-motion`: disable non-essential transitions/animations.
- Color is never the only signal — pair state colors with text/labels.
