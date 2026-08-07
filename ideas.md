# DreamCarz Network — Design System

## Three Approaches Considered

**Approach A — Obsidian Vault** (probability: 0.04)
Deep matte black with gold leaf accents, editorial serif typography, gallery-style car showcases. Feels like a private members club.

**Approach B — Carbon Velocity** (probability: 0.07)
Carbon fiber texture backgrounds, electric amber highlights, racing-inspired diagonal layouts. Feels like a performance garage.

**Approach C — Midnight Prestige** (probability: 0.03)
Ultra-dark charcoal with warm champagne gold, asymmetric editorial layouts, cinematic photography. Feels like a luxury automotive concierge.

---

## Chosen Approach: **Midnight Prestige**

### Design Movement
Luxury automotive concierge — a fusion of high-end car magazine editorial design and premium fintech membership UI. Think Rolls-Royce meets Amex Black Card.

### Core Principles
1. **Darkness as luxury** — near-black backgrounds (#0A0A0B, #111114) make gold and white elements feel precious
2. **Editorial asymmetry** — content breaks the grid intentionally; oversized type anchors sections
3. **Cinematic depth** — layered photography, gradient overlays, and subtle blur create dimensional space
4. **Earned restraint** — generous whitespace signals confidence; nothing screams for attention

### Color Philosophy
- **Background**: #0A0A0B (near-black, warm undertone) and #111114 (card surfaces)
- **Signature Gold**: #C9A84C — warm champagne gold, the single ownable brand color
- **Gold Light**: #E8C96A — hover states and highlights
- **Foreground**: #F5F0E8 — warm white, never pure white
- **Muted**: #6B6860 — secondary text
- **Border**: rgba(201,168,76,0.15) — gold-tinted borders
- Emotional intent: wealth, exclusivity, trust, aspiration

### Layout Paradigm
Asymmetric editorial columns — hero sections break into 60/40 splits, car showcase uses offset grid, membership tiers use staggered card heights. Navigation is minimal and horizontal with a centered logo mark.

### Signature Elements
1. **Gold rule lines** — thin 1px horizontal gold lines separate sections and accent headings
2. **Oversized DCP counter** — large typographic number displays for points/values
3. **Frosted glass cards** — `backdrop-blur` panels with gold border glow for membership and vehicle cards

### Interaction Philosophy
Deliberate and weighty — hover states reveal depth (cards lift with shadow), CTAs have a subtle press-down feel, scroll reveals are staggered and cinematic. Nothing feels cheap or instant.

### Animation
- Entrance: fade-up with 40px Y offset, 600ms ease-out, staggered 80ms per item
- Hero car: subtle float animation (translateY ±8px, 4s ease-in-out infinite)
- Gold shimmer: keyframe shimmer on DCP counters and tier badges
- Nav: background transitions from transparent to black/80 backdrop-blur on scroll
- Hover: cards scale(1.02) with gold border glow, 200ms ease-out
- Reduced motion: all animations respect prefers-reduced-motion

### Typography System
- **Display**: Cormorant Garamond (serif) — headlines, hero text, section titles. Sizes: 72px / 56px / 40px
- **UI**: DM Sans (sans-serif) — body, labels, navigation, buttons. Sizes: 16px / 14px / 12px
- **Mono**: JetBrains Mono — DCP numbers, stats, prices
- Hierarchy: Display Bold for hero → Display Regular for section titles → DM Sans Medium for subheads → DM Sans Regular for body

### Brand Essence
The only automotive ecosystem where loyalty literally pays — for members who demand more than a car, they demand a relationship.
Personality: **Prestigious. Empowering. Trustworthy.**

### Brand Voice
Headlines: "Your Loyalty Has a Dollar Value." / "Drive Free. Own Everything."
CTAs: "Claim Your Membership" / "See Your Purchasing Power"
Banned: "Welcome to our website" / "Get started today" / "Learn more"

### Wordmark & Logo
A bold diamond/shield mark combining a stylized "D" with a road-horizon line inside. The mark sits above the wordmark "DREAMCARZ" in wide-tracked DM Sans uppercase. Gold on black.

### Signature Brand Color
**#C9A84C** — Champagne Gold. Unmistakably DreamCarz.

---

## Style Decisions
- All section dividers use a 1px gold rule at 15% opacity
- Vehicle cards use 16:9 aspect ratio photography with bottom gradient overlay
- DCP values always render in JetBrains Mono with gold color
- Membership tier cards have a subtle gold glow on the recommended tier (Pro/Elite)
- All CTAs are either solid gold (primary) or outlined gold (secondary) — never generic blue
