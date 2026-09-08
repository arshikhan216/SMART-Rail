---
name: Mission Engineering
colors:
  surface: '#fcf9f1'
  surface-dim: '#dddad2'
  surface-bright: '#fcf9f1'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3eb'
  surface-container: '#f1eee6'
  surface-container-high: '#ebe8e0'
  surface-container-highest: '#e5e2da'
  on-surface: '#1c1c17'
  on-surface-variant: '#504537'
  inverse-surface: '#31312b'
  inverse-on-surface: '#f4f1e8'
  outline: '#827565'
  outline-variant: '#d4c4b1'
  surface-tint: '#805600'
  primary: '#805600'
  on-primary: '#ffffff'
  primary-container: '#f2b759'
  on-primary-container: '#6c4800'
  inverse-primary: '#f8bc5d'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e4e2e1'
  on-secondary-container: '#656464'
  tertiary: '#615e56'
  on-tertiary: '#ffffff'
  tertiary-container: '#c5c1b6'
  on-tertiary-container: '#514f47'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffddb0'
  primary-fixed-dim: '#f8bc5d'
  on-primary-fixed: '#281800'
  on-primary-fixed-variant: '#614000'
  secondary-fixed: '#e4e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e7e2d7'
  tertiary-fixed-dim: '#cbc6bc'
  on-tertiary-fixed: '#1d1c15'
  on-tertiary-fixed-variant: '#49473f'
  background: '#fcf9f1'
  on-background: '#1c1c17'
  surface-variant: '#e5e2da'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.005em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  code-dense:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit-2: 0.125rem
  unit-4: 0.25rem
  unit-8: 0.5rem
  unit-12: 0.75rem
  unit-16: 1rem
  unit-20: 1.25rem
  unit-24: 1.5rem
  unit-32: 2rem
  gutter-compact: 0.75rem
  gutter-standard: 1rem
  panel-padding: 1rem
  screen-edge: 1.5rem
---

## Brand & Style

This design system serves a high-stakes, mission-critical operations environment where train controllers, track engineers, and dispatch managers orchestrate complex maintenance windows, track possessions, and resource routing. The aesthetic rejects consumer software trends—avoiding frivolous floating layers, oversized playful geometry, or pill-shaped buttons—in favor of rigorous mechanical precision, architectural clarity, and utilitarian restraint.

The design identity fuses the quiet functionalism of railway technical diagrams with modern operational ergonomics:
- **Tone:** Authoritative, disciplined, calm under pressure, and ultra-precise.
- **Visual Stance:** Dense operational layouts, crisp structural gridlines, tactile contrast, and purposeful information hierarchy.
- **Physical Metaphor:** The tactile precision of physical switchboards and transit dispatch consoles, translated into sharp high-density web surfaces that prioritize legibility over decoration.

## Colors

The palette establishes a high-performance balance between long-shift visual comfort and immediate alerting contrast.

### Environmental & Structural Surfaces
- **Environment Base (`#F2EFE7`):** Warm industrial alabaster. Acts as the master background, outer frame, and structural canvas. It eliminates the glaring eye fatigue of pure white while preserving crisp contrast against foreground layers.
- **Surface Elevation (`#FFFFFF`):** Pure optical white reserved strictly for interactive tiles, dense data grids, floating detail drawers, and form modules.
- **Structural Borders (`#E5E0D5`):** Architectural boundary line. A mechanical warm gray used for 1px partition lines, table row dividers, and track diagram markers. A secondary subtle border token (`rgba(37, 37, 37, 0.12)`) provides reinforced edge contrast when surfaces rest against alabaster.

### Typography & Structure
- **Charcoal Solid (`#252525`):** The primary structural and ink tone. High-contrast, resolute, and grounded. Used for primary typography, dominant system icons, acute focus boundaries, and critical technical callouts.
- **Muted Ink (`#615D56`):** Secondary label text, column headers, units of measure, and non-active icons.
- **Subtle Ink (`#8C867D`):** Ghost track lines, disabled states, and auxiliary timestamps.

### Functional Accent & AI Engine
- **Khaki Orange (`#F2B759`):** The primary interaction and intelligence accent. Applied with disciplined restraint: primary commitment buttons, active route indicators, critical AI allocation highlights, selected timeline nodes, and focus rings. High-density surfaces must not become washed in accent; it serves purely as the pointer for action and algorithmic suggestion.

### Telemetry & Safety Status
- **Urgent / Red Line (`#D9383A`):** Emergency track closures, conflict collisions, overrunning maintenance work, and hardware failures.
- **Warning / Amber (`#D9822B`):** Schedule compression, speed restrictions, pending inspection intervals, and predicted wear thresholds.
- **Nominal / Green (`#2E7D32`):** Clear track possession, verified crew safety lockouts, operational telemetry, and executed work packages.
- **Telemetry / Blue (`#1976D2`):** Informational sensors, automated dispatch heartbeats, and standard rolling stock tracking.

## Typography

Typography is calibrated for maximum data ingestion speed under intense operational pressure. A single, rigorous typeface (`Inter`) is applied globally to prevent visual dissonance and preserve systematic cohesion across dynamic Gantt charts, telemetry grids, and diagnostic reports.

### Key Rules
- **Tabular Numerals (`font-feature-settings: "tnum" 1, "cv05" 1`):** Mandated for all timestamps, milepost markers, track IDs, speed limits, train numbers, and telemetry counters. This ensures columns do not jitter during live data feeds.
- **Tight Vertical Metrics:** Compact line-height ratios preserve screen real estate on tactical engineering dashboards.
- **Micro Labels:** Operational metadata (e.g., `TRK-SEC-04A`, `INTERLOCK-OK`, `ETA 04:18:22`) relies on uppercase, letter-spaced `label-sm` weights to ensure quick skimming across multi-monitor control centers.

## Layout & Spacing

The operational dashboard layout operates on an immutable 4px base rhythm, favoring high information density without visual crowding.

### Architectural Layout Structure
- **Master Grid:** An integrated viewport architecture featuring a fixed 64px collapsed/240px expanded navigation spine on the left, an operational utility header (48px fixed height), and an elastic multi-pane content staging area.
- **Information Density:** High density by default. Content modules utilize `unit-8` (8px) and `unit-12` (12px) padding intervals for internal data rows and cell definitions to allow dozens of rail segments to be analyzed simultaneously.
- **Data Workspaces:** Split-view layouts divide track topological schematics (top or left, 60% viewport share) from timeline/resource dispatch queues (bottom or right, 40% viewport share).
- **Responsive Adaptations:**
  - **Desktop (≥1440px):** Multi-column concurrent workflows (Track Topology + Crew Manifest + AI Conflict Inspector).
  - **Tablet Field Terminals (768px - 1439px):** Sidebar collapses to rail icons; secondary side panels convert to bottom-anchored sheets with persistent primary action triggers.
  - **Mobile Tactical (<768px):** Single-column stacked vertical cards with sticky status bars and pinned acknowledgment actions.

## Elevation & Depth

Visual depth is achieved through structural planar layering and crisp low-contrast delineations, never through diffused, floaty shadows.

- **Level 0 (App Canvas):** Alabaster (`#F2EFE7`). The non-elevated mechanical bedrock of the interface.
- **Level 1 (Operational Tiles & Panels):** Pure White (`#FFFFFF`) with a mandatory 1px border (`#E5E0D5`). Zero box shadow in resting state. Separation is achieved strictly through tonal contrast between Alabaster and White.
- **Level 2 (Active Modals, Floating Inspections, Flyouts):** Pure White surface with a sharp, controlled drop shadow: `0 4px 12px rgba(37, 37, 37, 0.08), 0 1px 2px rgba(37, 37, 37, 0.06)` combined with a 1px border (`rgba(37, 37, 37, 0.16)`).
- **Interactive States:** Hovering over a clickable table row or track card does not elevate it on the Z-axis; it tints the background with an intentional Alabaster wash (`#F2EFE7`) and activates a crisp left-rail accent border (`3px solid #F2B759`).

## Shapes

Shapes are disciplined, mechanical, and restrained:
- **Base Components (Inputs, Buttons, Badges, Tabs):** 4px border radius (`rounded-sm`).
- **Containers (Panels, Cards, Tables, Dialogs):** 6px to 8px border radius (`rounded-md`).
- **Strict Exclusion:** Pill shapes (fully rounded ends) are strictly prohibited. Curved geometric styling diminishes the engineered, data-dense utility required for mission-critical precision.
- **Accent Lines:** Sub-components frequently leverage industrial linear markers (e.g., 2px to 3px solid vertical or horizontal bars simulating track corridors) to indicate system state, AI verification, or asset priority.

## Components

### Buttons
- **Primary / Commitment Button:** Solid Khaki Orange (`#F2B759`) background, Charcoal (`#252525`) text, 4px border radius. Bold, 12px uppercase label (`label-md`). Hover transitions to `#E0A340`. Active focus shows a 2px offset Charcoal ring.
- **Secondary / Tactical Button:** Pure White background, 1px solid Charcoal (`#252525`) border, Charcoal text. Clean, robust, and utilitarian.
- **Destructive / Abort Button:** White background, 1px solid Red Line (`#D9383A`) border, Red Line text. On hover, fills solid Red with White text.
- **Compact Button Variant:** 28px height for high-density table action cells and Gantt toolbars.

### Input Fields & Selects
- **Resting:** Pure White background, 1px solid `#E5E0D5` border, 32px height, 8px horizontal padding, Charcoal text.
- **Active / Focused:** 1px solid `#252525` border with an immediate non-diffuse 1px outer ring in Khaki Orange (`#F2B759`).
- **Integrated Unit Badges:** Fixed right-aligned mechanical unit blocks (e.g., `km/h`, `min`, `t`) formatted in Muted Ink on an Alabaster sub-fill.

### Data Tables & Track Schematics
- **Table Headers:** Alabaster background (`#F2EFE7`), 32px height, uppercase `label-sm` typography, 1px solid `#E5E0D5` bottom border.
- **Data Rows:** Alternating hover state (`#F8F6F1`), 36px standard compact row height, pure White resting background, 1px bottom border. Tabular numbers enforced across all coordinate, time, and speed columns.
- **Linear Status Indicators:** In-cell track occupancy bars rendered as 4px thick continuous horizontal segments colored in Red, Amber, Green, or Blue.

### Status Chips & Priority Badges
- **Form:** 4px radius, 20px fixed height, padding `2px 6px`, text rendered in `label-sm`.
- **Urgent / Out of Service:** Soft Red tint background (`#FCE8E8`), 1px solid `#F3B2B3`, Red Line text (`#D9383A`).
- **Maintenance / Possession Active:** Soft Amber tint background (`#FDF1E2`), 1px solid `#F7CD9F`, Amber text (`#D9822B`).
- **Operational / Clear:** Soft Green tint background (`#EAF3EB`), 1px solid `#A5D2A8`, Green text (`#2E7D32`).
- **AI Recommendation Tag:** Solid Charcoal background (`#252525`), Khaki Orange text (`#F2B759`), accompanied by a mechanical diamond symbol (`◆`).

### Cards & Module Containers
- **Visuals:** Surface White, 1px border (`#E5E0D5`), 6px radius.
- **Section Headers:** Clean structural divider separating card headers from body content, accompanied by an optional 3px left-accent rail indicating block status.

### Selection Controls (Checkboxes & Radios)
- **Checkboxes:** 16x16px square, 2px radius, 1px solid Charcoal border. Checked state fills solid Charcoal with a pure White check icon.
- **Radio Buttons:** 16x16px circle with a solid Charcoal perimeter, displaying an inner 8px solid dot when active.