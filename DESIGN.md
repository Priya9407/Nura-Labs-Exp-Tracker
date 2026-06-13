# DESIGN.md — Crowz Dashboard Design System

A warm, friendly analytics dashboard aesthetic. Peach/cream backgrounds, soft rounded surfaces, and punchy coral/teal accents. Feels approachable and modern without being cold.

---

## Color Palette

| Token | Value | Usage |
|---|---|---|
| `--bg-page` | `#F4BCAA` | Outer page background (warm peach) |
| `--bg-sidebar` | `#FFFFFF` | Sidebar background |
| `--bg-surface` | `#FFFFFF` | Cards and panels |
| `--bg-surface-alt` | `#F7F4F0` | Muted rows, alternate surfaces, channel card bg |
| `--bg-highlight` | `#F2EDE8` | Hover rows, subtle fills |
| `--accent-coral` | `#E8593C` | Primary CTA, active state, badges |
| `--accent-teal` | `#3FBFA0` | "Full Stats" CTA, positive trend accent |
| `--accent-orange` | `#F4A62A` | Warning, graph line, mid-range accent |
| `--text-primary` | `#1A1A1A` | Headings, primary values |
| `--text-secondary` | `#7A7A7A` | Labels, captions, secondary info |
| `--text-muted` | `#B0B0B0` | Disabled, placeholder, timestamps |
| `--border` | `rgba(0,0,0,0.07)` | Card outlines, dividers |

### Avatar accent colors (for user/channel initials)
- Dribble: `#E8593C` (coral)
- Behance: `#4A90D9` (blue)
- Instagram: `#9B59B6` (purple)
- Pinterest: `#E74C3C` (red)
- Fallback sequence: coral → blue → amber → teal → purple

---

## Typography

| Role | Font | Size | Weight |
|---|---|---|---|
| Page title (h1) | DM Serif Display | 28px | 400 (italic optional) |
| Section title (h2) | DM Sans | 14px | 600 |
| Stat value (hero number) | DM Sans | 24–28px | 700 |
| Body / label | DM Sans | 13px | 400 |
| Caption / timestamp | DM Sans | 11px | 400 |
| Metric delta (+2%) | DM Sans | 12px | 600 |

> Import: `https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap`

---

## Spacing & Layout

```
Page padding:      24px (desktop), 16px (mobile)
Page bg radius:    none (full bleed)
Sidebar width:     200px
Main content:      flex-1
Card padding:      20px 24px
Card gap:          16px
Section gap:       24px
Border radius — card:    16px
Border radius — button:  10px
Border radius — badge:   20px (pill)
Border radius — avatar:  50%
Border radius — icon:    10px
```

---

## Components

### Sidebar
- White background, `border-radius: 16px`, soft box shadow
- Logo at top (icon + wordmark, small)
- Avatar + name + role below logo
- Nav links: icon + label, 13px, `--text-secondary`
- Active nav: coral dot to the right, `--text-primary` weight 600
- Bottom: logout link with icon

```css
.sidebar {
  background: var(--bg-surface);
  border-radius: 16px;
  padding: 24px 16px;
  width: 200px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.06);
}
.nav-item.active { color: var(--text-primary); font-weight: 600; }
.nav-item.active::after {
  content: '';
  width: 6px; height: 6px;
  background: var(--accent-coral);
  border-radius: 50%;
  margin-left: auto;
}
```

### Stat Badge (Views / Followers / Reports)
- Inline layout: label → big number → colored dot indicator
- Dot colors: green (up), red (down), gray (neutral)
- Number: 24px, weight 700, `--text-primary`
- Label: 11px, `--text-muted` above; dot + delta below

```css
.stat-badge { display: flex; flex-direction: column; gap: 4px; }
.stat-badge .value { font-size: 24px; font-weight: 700; }
.stat-badge .dot { width: 8px; height: 8px; border-radius: 50%; }
.dot.up { background: #4CAF50; }
.dot.down { background: #E74C3C; }
```

### Upgrade Banner Card
- Warm cream background (`#F5EFE6`)
- Bold "Upgrade Your Crowd" text, 2 lines, large
- Coral "NOW" pill button
- Decorative arc/donut graphic (right side, CSS only using border tricks or SVG arc)
- `border-radius: 16px`

```css
.upgrade-banner {
  background: #F5EFE6;
  border-radius: 16px;
  padding: 20px;
  position: relative;
  overflow: hidden;
}
.upgrade-banner .cta {
  background: var(--accent-coral);
  color: white;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 12px; font-weight: 700;
  text-transform: uppercase;
}
```

### Activity Chart
- White card, `border-radius: 16px`
- Title + date picker dropdown (right)
- Smooth curved line chart (SVG `<path>` with cubic bezier)
- Line color: `--accent-orange`
- Fill beneath: orange at 15% opacity
- Data point: white circle with orange border, larger on hover/active
- Active tooltip: white card, coral number, subtle shadow
- X-axis: dates (Q1–Q7), 11px `--text-muted`
- Y-axis: 0–40k labels, 11px `--text-muted`
- Grid lines: 0.5px `rgba(0,0,0,0.06)` horizontal only

### Top Performers Card
- White card, `border-radius: 16px`
- Row layout: avatar (32px circle) → name + handle → percentage (right-aligned)
- Avatar: real image or colored initial circle
- Name: 13px weight 600; handle: 11px `--text-muted`
- Percentage: 13px weight 700 `--text-primary`
- Divider between rows: 0.5px `--border`
- "View More" text link at bottom, `--accent-coral`

### Channel Stats Row
- Horizontal scroll row of channel cards
- Background: `var(--bg-surface-alt)` (`#F7F4F0`), `border-radius: 16px`
- Left section: label "Channels" + subtitle "Your channel stats for 1 week period."
- Each channel card: icon circle (colored per platform) + name + metric + delta pill
  - Delta positive: green text + green tinted bg
  - Delta negative: red text + red tinted bg
- Last card "Full Stats" teal card: `background: var(--accent-teal)`, white text, bold

```css
.channel-card { text-align: center; padding: 16px 12px; min-width: 90px; }
.channel-icon { width: 40px; height: 40px; border-radius: 50%; margin: 0 auto 8px; }
.channel-name { font-size: 11px; color: var(--text-muted); }
.channel-metric { font-size: 12px; font-weight: 700; color: var(--text-primary); }
.delta.positive { background: #E8F5E9; color: #2E7D32; border-radius: 10px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
.delta.negative { background: #FFEBEE; color: #C62828; border-radius: 10px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
.full-stats-card { background: var(--accent-teal); color: white; border-radius: 12px; }
```

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  PAGE (--bg-page peach, p-24)                               │
│  ┌──────────┐  ┌──────────────────────────────────────────┐ │
│  │ SIDEBAR  │  │ MAIN (white card, border-radius: 20px)   │ │
│  │ 200px    │  │                                          │ │
│  │          │  │  [Dashboard h1]  [stat] [stat] [stat]   │ │
│  │ [logo]   │  │  ─────────────────────────────────────  │ │
│  │ [avatar] │  │  [Activity chart 2/3]  [Top Performers] │ │
│  │          │  │  ─────────────────────────────────────  │ │
│  │ Nav      │  │  [Channels row ─────────────────────── ]│ │
│  │          │  └──────────────────────────────────────────┘ │
│  └──────────┘                                               │
└─────────────────────────────────────────────────────────────┘
```

Main panel uses `background: white; border-radius: 20px; padding: 28px 32px`.
Two-column layout for activity + top performers: `grid-template-columns: 2fr 1fr; gap: 24px`.

---

## Micro-interactions

- Card hover: `transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1)`
- Button hover: `filter: brightness(1.06)`
- Nav item hover: `background: var(--bg-highlight); border-radius: 8px`
- Chart data point hover: scale up to 1.3x, show tooltip
- Channel delta: bounce-in animation on mount (`@keyframes bounceIn`)
- Avatar: subtle ring on hover (`box-shadow: 0 0 0 2px var(--accent-coral)`)

---

## Shadows

```css
--shadow-card:    0 2px 12px rgba(0,0,0,0.06);
--shadow-hover:   0 8px 24px rgba(0,0,0,0.10);
--shadow-sidebar: 0 2px 16px rgba(0,0,0,0.06);
--shadow-tooltip: 0 4px 16px rgba(0,0,0,0.12);
```

---

## Dark Mode

Not present in the reference design. If adding:
- Page bg: `#2A1F1A` (warm dark, mirrors the peach hue)
- Surface: `#1E1916`
- Cards: `#2C2420`
- Retain coral and teal accents unchanged

---

## Do's & Don'ts

✅ Use DM Serif Display for the main page title for warmth  
✅ Keep card borders very subtle (0.5px, low-opacity)  
✅ Use colored circle icons for channels/platforms  
✅ Keep delta badges as pills with matching tinted backgrounds  
✅ Peach page background bleeds to the edge — don't constrain it  

❌ Don't use hard drop shadows — keep them soft and small  
❌ Don't use blue as a primary accent — coral and teal own those roles  
❌ Don't use gray backgrounds for cards — always white or warm cream  
❌ Don't use tight letter-spacing on numbers — let them breathe  
❌ Don't use square corners anywhere — minimum 8px radius on all elements