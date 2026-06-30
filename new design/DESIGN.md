---
name: Industrial Efficiency System
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fd'
  on-secondary-container: '#57657b'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#191c1e'
  on-tertiary-container: '#818486'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d5e3fd'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0d1c2f'
  on-secondary-fixed-variant: '#3a485c'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-display:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  edge-margin: 16px
  touch-target: 44px
---

## Brand & Style

The design system is engineered for the high-pressure environment of snack production facilities. The brand personality is **utilitarian, precise, and authoritative**, prioritizing functional clarity over aesthetic flourish. It balances the "Corporate / Modern" style with a "Data-Driven / Industrial" aesthetic, ensuring that operators can make split-second decisions based on clear visual signals.

The target audience consists of floor managers and production line operators who require a "heads-up display" experience. The UI evokes a sense of **stability and control**, utilizing high-contrast data visualizations and a rigorous grid to manage the inherent chaos of a manufacturing floor.

## Colors

This design system utilizes an **Industrial Blue and Grey** foundation to maintain a professional, low-fatigue environment. 

- **Primary & Neutrals:** Deep slate and navy tones provide a high-contrast background for data labels. Surfaces use cool greys to distinguish between different functional zones.
- **Functional Accents:** Status colors (Green, Amber, Red) follow international safety standards for immediate recognition of line health.
- **Brand Context:** Subtle 4px "line indicators" or icon accents use brand-specific colors (Orange, Yellow, Red) only to identify which product line is currently active, preventing visual clutter while maintaining context.

## Typography

The typography system is built on **Inter** for its exceptional legibility and neutral tone. It is supplemented by **JetBrains Mono** for technical data points (machine IDs, timestamps, and quantities) to ensure numbers are easily distinguishable and tabular data aligns perfectly.

Hierarchy is strictly enforced through weight and case. **Label-caps** are used for metadata and table headers to provide a clear anchor for the eye. On mobile, headlines are capped at 24px to maximize screen real estate for data density.

## Layout & Spacing

The layout follows a **Fluid Grid** model optimized for mobile-first factory floor usage. A 4-column grid is used for mobile, expanding to 12 columns for tablet/desktop dashboards.

- **Touch Safety:** All interactive elements (buttons, toggles, line selectors) adhere to a minimum 44px touch target to accommodate gloved hands or rapid movement.
- **Information Density:** Spacing is tight (8px-16px) to ensure as much critical information as possible is visible above the fold, reducing the need for excessive scrolling during high-intensity shifts.
- **Margins:** Consistent 16px side margins ensure content does not bleed into the bezel of ruggedized handheld devices.

## Elevation & Depth

This design system uses **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows. This "Flat Plus" approach ensures clarity under the harsh overhead lighting typical of a manufacturing plant.

- **Level 0 (Background):** Slate-50/100, used for the main application canvas.
- **Level 1 (Cards):** White surfaces with a 1px Slate-200 border. These house production line data.
- **Level 2 (Modals/Popovers):** Surface with a subtle, 4px blur ambient shadow to denote temporary focus.
- **Active State:** Elements being interacted with use a 2px primary-color stroke instead of a shadow to indicate "Focus."

## Shapes

The shape language is **Soft (0.25rem)**. This provides a professional, "tool-like" appearance that is more approachable than sharp corners but more serious than highly rounded "consumer" interfaces. 

Buttons and input fields use the standard `rounded` (4px), while large production cards use `rounded-lg` (8px) to create a clear container for grouped data. Progress bars use a `0px` radius on the inner fill to emphasize the precision of the manufacturing process.

## Components

- **Production Line Cards:** High-contrast containers featuring a brand-accented top border. Includes a prominent "Line ID," "Current Product," and a "Status Badge."
- **Status Badges:** Small, high-visibility pills using semantic colors. Text is bold and uppercase (e.g., "ACTIVE," "MAINTENANCE," "HALTED").
- **Action Buttons:** "Auto-Allocate" and "Emergency Stop" are visually distinct. Primary actions use a solid Blue-900 fill; critical stops use a Red-600 fill with high-contrast white text.
- **Progress Bars:** Two-tone bars with a neutral track and semantic fill (e.g., green for % completion). For stage tracking, segments are used to show discrete steps in the frying/seasoning/packaging process.
- **Data Inputs:** Stepper controls ([-] 00 [+] ) are preferred over standard text inputs for quantity adjustments on the floor to minimize typing errors.
- **Shift Toggle:** A segmented control at the top of the screen to quickly switch views between "Current Shift" and "Next Shift."