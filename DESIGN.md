---
name: SnackPro Industrial
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e3'
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
  secondary: '#5d5e64'
  on-secondary: '#ffffff'
  secondary-container: '#dfdfe6'
  on-secondary-container: '#616268'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271902'
  on-tertiary-container: '#97805e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fc'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465b'
  secondary-fixed: '#e2e2e9'
  secondary-fixed-dim: '#c6c6cd'
  on-secondary-fixed: '#1a1b21'
  on-secondary-fixed-variant: '#45464c'
  tertiary-fixed: '#fbdeb6'
  tertiary-fixed-dim: '#dec39c'
  on-tertiary-fixed: '#271902'
  on-tertiary-fixed-variant: '#564426'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e3'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
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
  data-mono-lg:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
  data-mono-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
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
  base-unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  touch-target-min: 48px
---

## Brand & Style
The design system is engineered for efficiency, reliability, and high-stakes operational accuracy. It serves a user base operating in industrial environments where precision is paramount and information density is a requirement for performance.

The aesthetic is **Utilitarian Modernism**. It prioritizes function over form, utilizing a structured grid, high-contrast indicators, and a technical typographic scale. The emotional response is one of authority and stability—evoking the feeling of professional-grade hardware. Visual noise is minimized to ensure that "Signal" (data, alerts, and actions) is never lost to "Noise" (decoration).

## Colors
This design system utilizes a palette rooted in industrial hardware. 

- **Primary (Dark Navy):** Used for structural elements, headers, and primary actions to establish a grounded, authoritative base.
- **Canvas (Cool Slate Gray):** A subtle, neutral backdrop that reduces eye strain compared to pure white while maintaining high contrast for text.
- **Signal Colors:** Green, Amber, and Red are reserved strictly for status communication (Success, Warning, Critical Error). These must not be used for decorative purposes.
- **Neutral/Borders:** A medium-gray (#c6c6cd) is used for structural definition and wire-framing components without adding visual weight.

## Typography
The typography is split between two distinct functional roles:
1. **Inter:** Used for general interface prose, navigation, and structural headings. It provides modern legibility and a professional tone.
2. **JetBrains Mono:** Reserved for technical data, numerical values, timestamps, and status labels. Its monospaced nature ensures that columns of numbers align perfectly, aiding in rapid data scanning.

For mobile environments, headlines scale down by one tier (e.g., `headline-lg` becomes `headline-md`) to maximize screen real estate for data tables.

## Layout & Spacing
The layout follows a strict **4px baseline grid**. Information density is high, but accessibility is maintained through generous touch targets.

- **Grid:** A 12-column fluid grid on desktop, transitioning to a 4-column grid on mobile. 
- **Density:** Components use tight internal padding (8px–12px) to pack data, but the minimum hit area for any interactive element must be **48px** to accommodate users with gloved hands or those using ruggedized mobile devices.
- **Reflow:** On mobile, data tables should transform into stacked list items or "cards" to maintain legibility.

## Elevation & Depth
Depth is conveyed through **Flat Tonal Layering** rather than shadows. This ensures visibility in high-glare environments and keeps the UI feeling "flush" like a physical control panel.

- **Tier 1 (Background):** Canvas (#fcf8fa).
- **Tier 2 (Surface):** Flat White (#ffffff) cards with a 1px border (#c6c6cd).
- **Tier 3 (Active/Pop-over):** High-contrast Primary Navy surfaces.

Shadows are entirely avoided. Instead, "depth" is created by the 4px top-border accent on cards, which provides a visual "cap" to separate elements in a vertical scroll.

## Shapes
The shape language is rigid and geometric to reflect industrial precision.
- **Interactive Elements:** Buttons, input fields, and checkboxes use a **4px radius** (Soft-minimal).
- **Containers:** Cards and modal dialogs use an **8px radius** to provide a subtle visual distinction between the layout structure and the individual controls.

## Components

### Cards
Cards are the primary container for data modules.
- **Surface:** Pure white background.
- **Border:** 1px solid #c6c6cd.
- **Accent:** A 4px solid top-border using the Primary Navy (or Signal colors for status-specific cards).

### Buttons
- **Primary:** Primary Navy background, white monospaced text, 48px height minimum.
- **Secondary:** White background, 1px Primary Navy border.
- **Signal:** Buttons that trigger critical actions (Stop/Error) use Signal Red with white text.

### Inputs
- **Style:** 1px border (#c6c6cd) with an 8px horizontal padding.
- **Focus:** 2px solid Primary Navy border.
- **Labels:** Always use `label-caps` in JetBrains Mono positioned above the field.

### Data Lists
- **Style:** High-density rows with 1px bottom dividers.
- **Data Points:** Use JetBrains Mono for all numeric metrics to ensure vertical alignment across rows.

### Chips/Indicators
Small, rectangular tags with 2px radius. Use subtle background tints of Signal colors with high-contrast text for status indication (e.g., "ON TRACK", "DELAYED").