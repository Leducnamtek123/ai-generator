# 🎨 Auth UI Design System

The authentication pages use a premium split-screen layout with advanced CSS effects.

## 🌈 Design Tokens (OKLCH)
We use the **OKLCH** color space for better perceptual uniformity and vibrant colors.

| Token | Value | Purpose |
|-------|-------|---------|
| `--auth-surface-base` | `oklch(0.13 0.005 260)` | Main background |
| `--auth-accent-primary` | `oklch(0.65 0.25 270)` | Primary Purple |
| `--auth-accent-secondary`| `oklch(0.60 0.22 300)` | Secondary Pink |

## ✨ Visual Effects
- **Mesh Gradient**: A dynamic background using 3 overlapping radial gradients with a `mesh-drift` animation.
- **Floating Orbs**: 4 animated blurred circles that move independently to create depth.
- **Glassmorphism**: Feature pills use `backdrop-filter: blur(16px)` and subtle borders.

## 📐 Layout Architecture
The layout is organized using CSS `@layer` for clear specificity management:
1. `tokens`: CSS Variables.
2. `base`: Global resets.
3. `layout`: Grid/Flex structures.
4. `components`: Specific UI elements (Cards, Buttons).
5. `effects`: Animations and visual polish.

## 📱 Responsiveness
- **Desktop (>=1024px)**: 1:1 Split-screen (Visual | Form).
- **Mobile**: Form only, full width.
