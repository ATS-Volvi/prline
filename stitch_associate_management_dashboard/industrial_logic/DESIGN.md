---
name: Industrial Logic
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45474c'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fc'
  on-secondary-container: '#57657a'
  tertiary: '#00190e'
  on-tertiary: '#ffffff'
  tertiary-container: '#00301e'
  on-tertiary-container: '#00a472'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#d5e3fc'
  secondary-fixed-dim: '#b9c7df'
  on-secondary-fixed: '#0d1c2e'
  on-secondary-fixed-variant: '#3a485b'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
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
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
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
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  margin-mobile: 16px
  gutter-mobile: 12px
---

## Brand & Style

The design system is engineered for high-stakes production environments where clarity, speed, and reliability are paramount. It adopts a **Functional Industrial** style—a synthesis of high-contrast corporate professionalism and utilitarian efficiency. The aesthetic prioritizes data density without sacrificing legibility, ensuring operators and managers can make split-second decisions under varying lighting conditions.

The UI evokes a sense of "digital machinery": robust, precise, and dependable. By utilizing a restrained color palette and structured grid, the interface fades into the background, allowing critical production metrics and status indicators to command the user's focus.

## Colors

This design system utilizes a high-contrast palette designed for "glanceability" in industrial settings.

- **Primary (Deep Slate):** Used for top-level navigation, primary headers, and high-emphasis UI containers. It provides a grounded, authoritative foundation.
- **Secondary (Charcoal):** Applied to secondary actions and icons, providing enough contrast against light backgrounds while remaining distinct from primary elements.
- **Backgrounds:** A clean `white` (#FFFFFF) is used for main content areas to maximize contrast, with `light gray` (#F1F5F9) used for grouping sections and background depth.
- **Status Accents:** 
    - **Active:** Emerald Green is the signature "Go" color, used exclusively for active machinery, healthy metrics, and successful states.
    - **Inactive:** Slate/Light Gray denotes standby or idle states, intentionally receding to reduce visual noise.

## Typography

The system relies on **Inter** for its exceptional legibility and neutral tone. It is optimized for small screens with tight tracking and high x-height. 

- **Data-Heavy Display:** For machine IDs, serial numbers, and specific numeric values, the system introduces a monospaced variant (`data-mono`) to ensure character alignment and prevent "jumping" during real-time data updates.
- **Labels:** Small caps or uppercase labels with increased letter spacing are used for table headers and metadata categories to differentiate them clearly from user-generated content.
- **Scale:** Typographic steps are tight (mostly 2-4px increments) to maintain a high information density suitable for professional tools.

## Layout & Spacing

This design system uses a strictly **fluid-to-fixed** hybrid approach optimized for mobile hardware.

- **Grid:** A 4-column grid for mobile with 16px side margins. 
- **Rhythm:** An 8pt linear scale governs all spacing. Vertical rhythm is tight (8px or 12px) between related data points to keep information "above the fold."
- **Touch Targets:** Despite the high density, all interactive elements (buttons, toggles, list items) maintain a minimum 44px hit area to ensure usability in environments where users may be moving or wearing light gloves.

## Elevation & Depth

To maintain an industrial and efficient feel, depth is communicated through **low-contrast outlines** and **tonal layering** rather than heavy shadows.

- **Outlines:** Containers and cards use 1px solid borders (#E2E8F0) to define boundaries. 
- **Tonal Stacking:** Surfaces "lift" by changing background color. The base floor is #F8FAFC; cards and primary inputs are #FFFFFF.
- **Active State Elevation:** Only primary action buttons and urgent alerts use a subtle, tight shadow (0px 2px 4px rgba(0,0,0,0.05)) to suggest interactability. Everything else remains flat and architectural.

## Shapes

The shape language is structured and professional. 

- **Standard Elements:** Buttons, cards, and input fields use a `0.5rem` (8px) radius. This provides a modern, approachable feel while maintaining a rigid enough structure to feel "industrial."
- **Status Badges:** Small badges and chips use a more pronounced `rounded-xl` or pill shape to distinguish them from structural UI elements and buttons.
- **Icons:** Use a 2px stroke width with slightly rounded joins to match the component corner radius.

## Components

- **Cards:** White background with a 1px #E2E8F0 border and 8px corner radius. Used for machine summaries and production batches. Header areas within cards should have a subtle #F8FAFC bottom border.
- **Status Badges:** High-contrast text on a low-opacity background of the same color (e.g., Emerald Green text on 10% Emerald Green background).
- **Primary Buttons:** Deep Slate (#1E293B) background with White text. Use 16px horizontal padding and 12px vertical padding. Bold weight.
- **Input Fields:** 1px #CBD5E1 border, 8px radius. Use #94A3B8 for placeholders. Focus state should use a 2px Deep Slate border.
- **Production Lists:** Tight list items (56px height) with a subtle separator line. Right-aligned "Chevron" or "Status Dot" to indicate detail navigation.
- **Admin Toggles:** Large, tactile switches that use the Emerald Green accent when in the "Active/On" position to provide immediate visual confirmation of machine status.