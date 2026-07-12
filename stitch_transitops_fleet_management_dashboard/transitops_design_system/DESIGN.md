---
name: TransitOps Design System
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363941'
  surface-container-lowest: '#0b0e15'
  surface-container-low: '#191b23'
  surface-container: '#1d2027'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e1e2ec'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#e1e2ec'
  inverse-on-surface: '#2e3038'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#b7c8e1'
  on-secondary: '#213145'
  secondary-container: '#3a4a5f'
  on-secondary-container: '#a9bad3'
  tertiary: '#ffb786'
  on-tertiary: '#502400'
  tertiary-container: '#df7412'
  on-tertiary-container: '#461f00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311400'
  on-tertiary-fixed-variant: '#723600'
  background: '#10131a'
  on-background: '#e1e2ec'
  surface-variant: '#32353c'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 24px
  gutter: 16px
---

## Brand & Style
The design system is engineered for high-stakes transport logistics and real-time operational monitoring. The brand personality is authoritative, precise, and technologically advanced, aiming to reduce cognitive load for operators managing complex transit networks.

The aesthetic blends **Modern Enterprise** efficiency with **Subtle Glassmorphism**. The interface prioritizes a "Dark Mode First" architecture to reduce eye strain during long shifts. Visual depth is achieved through layered semi-transparent surfaces and crisp, high-contrast accents, ensuring that critical data points are immediately identifiable against the deep slate background.

## Colors
The palette is optimized for a high-contrast dark environment. 
- **Primary Blue (#3b82f6)**: Used for primary actions, active states, and critical path highlights.
- **Background Slate (#0f172a)**: The foundational layer, providing a deep, non-distracting canvas.
- **Surface Gray (#1e293b)**: Used for cards and containers, providing enough contrast against the background to define structure.
- **Status Colors**: Success Green, Warning Orange, and Danger Red are calibrated for maximum legibility against dark surfaces, used strictly for semantic signaling (e.g., vehicle status, delays, system alerts).

## Typography
This design system utilizes **Inter** for all primary UI elements to ensure maximum legibility and a professional, systematic feel. A secondary monospace font, **JetBrains Mono**, is introduced for labels, telemetry data, and timestamps to emphasize the technical nature of the transit data.

Hierarchy is maintained through consistent weight application: bold for navigation/headers and regular/medium for data density. All caps should be reserved for `label` styles to denote metadata or secondary telemetry categories.

## Layout & Spacing
The layout follows a **Fluid Grid** model based on a 4px baseline shift. 
- **Desktop**: 12-column grid with 16px gutters. Sidebars are fixed at 280px to maximize the dashboard workspace.
- **Tablet**: 8-column grid with 16px gutters.
- **Mobile**: 4-column grid with 12px gutters and 16px side margins.

Data-heavy tables should utilize "Compact" spacing (8px cell padding) to maximize information density without sacrificing touch targets on hybrid devices.

## Elevation & Depth
Depth is created through **Glassmorphism** and tonal layering rather than traditional heavy shadows.
- **Level 0 (Base)**: Background Slate (#0f172a).
- **Level 1 (Cards)**: Surface Gray (#1e293b) with 80% opacity and a 1px solid border (White @ 10% opacity). A subtle 4px backdrop blur is applied to create a "glass" effect over moving map elements.
- **Level 2 (Modals/Popovers)**: Surface Gray (#1e293b) with 100% opacity, featuring a 1px Primary Blue border to denote focus and an ambient 20px blur shadow (Black @ 40% opacity).

## Shapes
The design system utilizes **Soft (Level 1)** roundedness to maintain a precise, enterprise feel while avoiding the harshness of sharp corners. 
- **Standard elements**: 0.25rem (4px) radius for inputs and small buttons.
- **Cards/Containers**: 0.5rem (8px) radius for a structural look.
- **Status Pills**: 0.75rem (12px) or full pill-shape to distinguish them from interactive buttons.

## Components
- **Buttons**: Primary buttons use a solid Primary Blue fill with white text. Secondary buttons use a ghost style with a subtle white-alpha border.
- **Data Tables**: Clean, borderless rows with a 1px separator (Slate-700). Header rows use `label-sm` typography with a subtle background tint. Active or hovered rows should highlight with a 5% Primary Blue overlay.
- **Cards**: Implement the glassmorphism style defined in Elevation. Use a 1px stroke (White @ 10%) to define the perimeter. Titles should be `headline-md`.
- **Inputs**: Dark-filled (#0f172a) with a 1px Surface Gray border. On focus, the border transitions to Primary Blue with a subtle outer glow.
- **Status Chips**: Use high-contrast backgrounds (Success/Warning/Danger) with black or high-contrast white text for immediate scanning.
- **Telemetry Indicators**: Small, monospaced data readouts used in conjunction with sparklines for real-time transit metrics.