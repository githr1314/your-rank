---
name: Luminous Precision
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#414755'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#717786'
  outline-variant: '#c1c6d7'
  surface-tint: '#005bc1'
  primary: '#0058bc'
  on-primary: '#ffffff'
  primary-container: '#0070eb'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#5d5e60'
  on-secondary: '#ffffff'
  secondary-container: '#dfdfe1'
  on-secondary-container: '#616365'
  tertiary: '#5b5c60'
  on-tertiary: '#ffffff'
  tertiary-container: '#747479'
  on-tertiary-container: '#fefcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#e2e2e4'
  secondary-fixed-dim: '#c6c6c8'
  on-secondary-fixed: '#1a1c1d'
  on-secondary-fixed-variant: '#454749'
  tertiary-fixed: '#e3e2e7'
  tertiary-fixed-dim: '#c6c6cb'
  on-tertiary-fixed: '#1a1b1f'
  on-tertiary-fixed-variant: '#46464b'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  tier-s-gradient: 'linear-gradient(135deg, #FFD700 0%, #FF9500 100%)'
  tier-a-crimson: '#FF3B30'
  tier-b-electric-purple: '#AF52DE'
  tier-c-graphite: '#48484A'
  tier-d-soft-gray: '#AEAEB2'
  background-secondary: '#F5F5F7'
  border-light: rgba(0, 0, 0, 0.08)
  glass-bg: rgba(255, 255, 255, 0.72)
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 41px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 25px
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  tier-marker:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 34px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  top-bar-height: 56px
  info-area-height: 80px
  status-bar-height: 32px
  gutter-md: 16px
  margin-edge: 24px
  stack-gap: 12px
---

## Brand & Style

The design system is a high-end, functional framework inspired by the meticulous clarity of modern premium hardware interfaces. It prioritizes the "at-a-glance" philosophy, ensuring that complex tier-based data remains legible and aesthetically pleasing within a constrained viewport.

The design style is **Minimalist with Glassmorphic accents**. It utilizes heavy white space (or deep, ink-like blacks in dark mode) to allow content to breathe, while employing sophisticated backdrop blurs and semi-transparent layers to establish depth and hierarchy without visual clutter. The emotional response is one of effortless sophistication—professional, reliable, yet vibrant where it matters.

Key visual principles:
- **Optical Balance:** Layouts are strictly aligned to a geometric grid.
- **Translucency:** Headers and floating panels use high-quality blur filters to maintain context.
- **Intentional Color:** Vibrancy is reserved for rank indicators and tier levels, ensuring they serve as the primary navigational anchors.

## Colors

The color strategy uses a neutral, high-key foundation to allow the Tier Hierarchy to provide the "soul" of the interface. 

- **Primary & Neutral:** The interface relies on pure `#FFFFFF` and the refined `#F5F5F7` (Apple Gray) to create a canvas of extreme clarity.
- **Tier-Semantic Colors:** These are the only high-saturation elements. 
    - **Tier S:** A metallic gold gradient to signify peak value.
    - **Tier A-D:** Follows a descending energy curve from Crimson to Soft Gray.
- **Glassmorphism:** Surfaces intended to float (Headers, Cards in flight) utilize a 72% opacity background with a 20px-30px backdrop blur. 
- **Dark Mode:** In dark mode, the neutral shifts to `#000000`, and secondary surfaces use `#1C1C1E`.

## Typography

This design system utilizes a systematic grotesque sans-serif (Inter) to achieve a "functionalist" aesthetic. 

- **Hierarchy:** Use font weight rather than massive size increases to denote importance. Semi-bold and Bold are used for structural headers, while Regular is reserved for all body and descriptive text.
- **Tracking:** Headlines should have a slight negative tracking (-1% to -2%) for a tighter, high-end "editorial" look. Labels and small captions use increased tracking (+2%) to ensure legibility.
- **Vertical Rhythm:** Line heights are strictly kept to a 1.2x - 1.5x ratio of the font size to maintain the airy, spacious feel of the 100vh layout.
- **Mobile Adaptation:** For mobile screens, `display-lg` scales down to 28px to prevent line-wrapping on tier titles.

## Layout & Spacing

The layout is a **fixed-height, no-scroll canvas** designed to fit perfectly within `100vh`. 

- **Vertical Structure:** The screen is divided into a rigid stack. The Top Bar, Info Area, and Status Bar are fixed. The "Core Drag Area" uses a flex-grow model to occupy all remaining vertical space. 
- **Tier Distribution:** Within the core area, the available height is divided into percentage-based rows (approx. 14% each). This ensures that all tiers are visible simultaneously regardless of screen aspect ratio.
- **Horizontal Flow:** While vertical scrolling is prohibited, horizontal scrolling is permitted within individual tier rows to accommodate a high volume of cards.
- **Grid:** Use a 12-column grid for the Info Area and Header, while the Tier Rows utilize a flex-row with `stack-gap` for card distribution.

## Elevation & Depth

Hierarchy is established through "Luminous Layering" rather than traditional heavy shadows.

- **Background Surfaces:** The primary app background is flat.
- **Tier Rows:** Use subtle 1px inner borders (`border-light`) or slight tonal shifts to define boundaries.
- **Active Cards:** When a card is picked up (drag start), it transitions from a flat state to an elevated state. This is achieved using a "High-End Ambient Shadow": `0 4px 24px rgba(0,0,0,0.04)` and a scale transform of `1.05x`.
- **The Glass Header:** The top navigation bar uses backdrop-blur (20px) to show hints of the tier colors moving beneath it, reinforcing the sense of physical layers.
- **Drop Zones:** Valid drop targets should not use shadows, but instead use a high-contrast dashed border highlight to indicate a "receptacle."

## Shapes

The shape language is defined by large, organic "Squircle-style" radii that evoke a premium hardware feel.

- **Container Cards:** Use the `rounded-xl` (1.5rem / 24px) setting to create a friendly, modern container for items.
- **Interactive Elements:** Buttons and input fields use `rounded-lg` (1rem / 16px) for a soft but distinct touch target.
- **Tier Badges:** Tier identifiers can be circular or use the same 12px radius as buttons to maintain consistency.
- **Image Clipping:** All uploaded thumbnails must be clipped to the container's radius to ensure no sharp corners break the "Luminous" aesthetic.

## Components

- **Tier Rows:** Large, horizontal containers with a fixed height. The left-most 64px is reserved for the Tier Badge (e.g., "S" with gradient). The background should be a very faint tint of the tier color (2-5% opacity).
- **Item Cards:** Minimalist blocks featuring a high-quality thumbnail. Text (Title) is placed at the bottom on a semi-transparent gradient overlay. No borders, just the subtle ambient shadow when active.
- **Action Buttons:** Use a "Glass-Primary" style—solid white text on a semi-transparent primary color background with a heavy blur.
- **Input Fields:** Clean, borderless designs with a light gray background fill (`#F5F5F7`). On focus, transition to a thin 1px primary color outline.
- **Thin-Stroke Icons:** Use 1pt or 1.5pt stroke weights. Icons should be monochrome (tertiary color) unless active, where they inherit the primary color.
- **Placeholder/Empty State:** Use a 1.5px dashed border in `tier-d-soft-gray` with a centered "+" icon to indicate available slots.