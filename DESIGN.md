---
name: Orqly
description: Node-based visual editor for building, testing and simulating API workflows
colors:
  carbon-black: "#070606"
  graphite-surface: "#141313"
  graphite-raised: "#1e1e1f"
  canvas-dot: "#252424"
  steel-ink: "#d0dbda"
  voltage-orange: "#ff5a19"
  voltage-deep: "#f04400"
  on-accent: "#070606"
  signal-green: "#14DB7F"
  signal-red: "#e2314f"
  delete-method: "#dd2545"
  signal-amber: "#ffc107"
  signal-blue: "#2563EB"
  edge-light-faint: "rgb(255 255 255 / 0.08)"
  edge-light-soft: "rgb(255 255 255 / 0.12)"
  edge-light: "rgb(255 255 255 / 0.14)"
  edge-light-medium: "rgb(255 255 255 / 0.18)"
  edge-light-strong: "rgb(255 255 255 / 0.36)"
  edge-light-bright: "rgb(255 255 255 / 0.44)"
  email-muted: "#8fa09e"
  email-faint: "#6f7e7c"
typography:
  headline:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    letterSpacing: "-0.02em"
  subhead:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
  body:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  ui:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  control:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 500
  compact:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "10px"
    fontWeight: 700
    letterSpacing: "0.14em"
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  toolbar: "14px"
  node: "20px"
  confirm: "22px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  shell: "12px"
components:
  button-primary:
    backgroundColor: "{colors.voltage-orange}"
    # carbon ink, not white — white on voltage orange is 3.1:1, ink is 6.4:1 (AA)
    textColor: "{colors.carbon-black}"
    rounded: "{rounded.md}"
    padding: "9px 12px"
  button-primary-hover:
    backgroundColor: "{colors.voltage-deep}"
  button-ghost:
    backgroundColor: "rgba(208, 219, 218, 0.05)"
    textColor: "{colors.steel-ink}"
    rounded: "{rounded.md}"
    padding: "9px 12px"
  input-field:
    backgroundColor: "rgba(208, 219, 218, 0.05)"
    textColor: "{colors.steel-ink}"
    rounded: "{rounded.md}"
    padding: "8px 10px"
  chip-method:
    typography: "{typography.label}"
    rounded: "6px"
    padding: "2px 6px"
  nav-pill:
    backgroundColor: "rgba(208, 219, 218, 0.06)"
    textColor: "{colors.steel-ink}"
    rounded: "{rounded.pill}"
    height: "40px"
    typography: "{typography.label}"
---

# Design System: Orqly

## 1. Overview

**Creative North Star: "The Trading Desk at Night"**

A dark room, glass monitors, one orange signal cutting through. Orqly's surfaces
are near-black and calm; information arrives as colored light — a green GET, an
orange POST, a running edge pulsing across the canvas. The system is a
professional instrument, not a toy: density is welcome, decoration is not, and
nothing glows without meaning something.

This system explicitly rejects the generic SaaS template (cream heroes,
gradient text, identical feature cards), enterprise-dashboard heaviness
(blue-gray chrome, dense tables), and dev-terminal cosplay (matrix green,
ASCII borders). The premium feel comes from restraint executed precisely:
machined controls, structural glass, one voltage line.

**Key Characteristics:**
- Near-black canvas with a dotted grid; content floats on structural glass
- One accent (Voltage Orange) for action and identity; all other color is data
- Mono type marks everything machine-owned; Jakarta carries human prose
- Motion is spent on one live thing at a time (a running edge, a breathing glow)

## 2. Colors

A black room lit by signals: three graphite neutrals, one voltage accent, and a
strict semaphore of status hues.

### Primary
- **Voltage Orange** (#ff5a19): The single brand voltage — primary buttons, the
  active environment dot, selected states, the breathing auth glow, POST chips.
  Hover deepens to **Voltage Deep** (#f04400). It is an electrical signal, not
  a decoration.

### Neutral
- **Carbon Black** (#070606): Body and canvas background. The room itself.
- **Graphite Surface** (#141313): Base panel fill; glass layers mix from it.
- **Graphite Raised** (#1e1e1f): Inputs and raised interactive fills.
- **Canvas Dot** (#252424): Dotted grid texture on the workflow canvas.
- **Steel Ink** (#d0dbda): Primary text. **Muted** (72% mix) and **Faint** (58% mix)
  steps derive from it via `color-mix` — never independent grays.
- **Edge-light** (white at 8–44% over dark fills): Glass rim vocabulary — not
  independent grays. Key steps: faint 8%, soft 12%, default 14%, medium 18% (glass
  border), strong 36% (selection), bright 44% (active chrome).

### Semaphore (status & methods)
- **Signal Green** (#14DB7F): success, GET.
- **Signal Red** (#e2314f): danger status + error text (≥4.5:1 on Carbon Black).
  **Delete method** chip keeps the deeper #dd2545 for method-data contrast.
- **Signal Amber** (#ffc107): warning, PUT.
- **Signal Blue** (#2563EB): PATCH.
- Each pairs with a soft tint (`color-mix(… 10-12%, #141313)`) for chip fills.

### Named Rules
**The One Voltage Rule.** Voltage Orange is the only color allowed to mean
"Orqly". Status hues belong to data (methods, run states) and never moonlight
as decoration; orange never encodes data.

**The Derived Gray Rule.** Every gray on screen is a color-mix of Steel Ink
into Carbon Black. Independent hex grays are prohibited.

## 3. Typography

**Display/Body Font:** Plus Jakarta Sans (ui-sans-serif fallback)
**Machine Font:** JetBrains Mono (ui-monospace fallback)

**Character:** A humanist sans for people, a crisp mono for the machine. The
pairing *is* the interface's grammar: the moment something is mono, the user
knows the system owns it.

### Hierarchy
- **Headline** (700, 16–18px, -0.02em): Modal titles, card headings. Bold and
  tight, never large — this is an instrument, not a poster.
- **Title** (700, 15px): Workflow names, wizard card headings.
- **Body** (400–500, 13–14px, 1.5): Prose, descriptions, form labels.
- **UI** (400–500, 13px): Dense panel copy, hints, modal sublines.
- **Control** (500, 13.5px): Button labels and primary control text.
- **Compact** (400, 11px): Inspector hints, helper text under fields.
- **Label** (700, 10px, +0.14em, UPPERCASE, mono): Section headers, nav pills,
  status chips. The signature "etched into the panel" voice.
- **Code** (400–600, 11–12px, mono): URLs, template paths, JSON, counts.

### Named Rules
**The Mono Means Machine Rule.** URLs, methods, statuses, codes, counts and
section labels are always JetBrains Mono. Human sentences are always Jakarta.
Mixing them inside one phrase is prohibited.

## 4. Elevation

Structural glass, not ambient mood: blur depth encodes z-order. Three tiers —
`glass-light` (10px blur; floating controls), `glass` (18px; primary panels:
sidebar, nav, inspector), `glass-heavy` (28px + denser fill; modals and
dropdowns). Every glass layer keeps fills ≥60% opaque for legibility and
carries a 1px `{colors.edge-light-medium}` border. The **edge-light scale**
(white at 8–44% over dark fills) encodes glass rim depth — use named steps from
the color tokens, not ad-hoc opacities.
`prefers-reduced-transparency` swaps all glass for opaque Graphite Surface.

### Shadow Vocabulary
- **Node** (`0 1px 2px rgb(0 0 0/.5), 0 8px 24px rgb(0 0 0/.35)`): canvas
  nodes and file cards — objects floating over the dotted grid.
- **Panel** (`0 1px 3px rgb(0 0 0/.45)`): toolbars and shallow chrome.

### Named Rules
**The Blur-Is-Altitude Rule.** More blur = higher layer. A dropdown may never
blur less than the panel beneath it.

## 5. Components

Precise, instrument-grade: tight paddings, machined corners, restrained hovers.
Controls feel calibrated, not bouncy.

### Buttons
- **Shape:** Gently rounded (8px); pill (9999px) only in the nav row.
- **Primary:** Voltage Orange fill, carbon ink text (`--on-accent`), 9px/12px padding, 13.5px/500.
- **Hover / Focus:** Fill deepens to Voltage Deep; 2px accent `focus-visible`
  outline with 2px offset — focus is never invisible.
- **Ghost:** 5% Steel Ink fill, 15% white border; hover raises fill to 10%.

### Chips
- **Method chips:** mono 10px bold, method hue on its 10% tint (GET green,
  POST orange, PUT amber, PATCH blue, DELETE red), 6px radius.
- **Status chips:** same anatomy; hue follows run state (Ready/Running orange,
  OK green, Failed red, Skipped faint).

### Cards / Containers
- **Corner Style:** 16px panels/modals; 20px canvas nodes; 22px confirm dialogs.
- **Background:** glass tier by altitude (see Elevation); nodes use
  `workflow-node` fill over the dotted canvas.
- **Border:** 1px white/10–18%; selection swaps to accent.
- **Internal Padding:** 16–24px panels; 8px node shells.

### Inputs / Fields
- **Style:** 5% Steel Ink fill, 15% white 1px border, 8px radius, 13px text;
  36px height in inspector contexts (`inspector-field`).
- **Focus:** border snaps to accent + 1px accent shadow ring (or 2px accent/18%
  glow) — a wire going live.
- **Error:** border swaps to Signal Red; message in 13px red below.

### Navigation
- **Style:** 40px `nav-row`; controls are pills — mono 10px uppercase labels
  on 6% Steel Ink fills; icon buttons are 40px circles.
- **States:** hover raises fill to 9%; active pill carries the accent dot.

### Email (OTP)
- **Background:** Carbon Black outer, Graphite Surface card (#141313).
- **Muted prose:** `#8fa09e` (email-muted) — derived Steel Ink mix for email clients.
- **Faint footer:** `#6f7e7c` (email-faint).
- **Code display:** Voltage Orange mono at 36px with 8px tracking.

### Workflow Node (signature)
The identity component: 280×125 rounded-[20px] shell over the dotted canvas —
tinted title row (method-hue gradient at 8%, title + circled step badge),
mono URL field with method chip, status chip row, and 12px accent-ringed
connection handles top/bottom. A running node ring-pulses in accent; a
skipped node dims to 90%. Every other surface borrows this vocabulary.

## 6. Do's and Don'ts

### Do:
- **Do** keep Voltage Orange ≤10% of any screen; its rarity is the voltage.
- **Do** use mono + uppercase + 0.14em tracking for every section label and
  status — the etched-panel voice is the brand.
- **Do** encode meaning in the semaphore hues exactly as the canvas does
  (GET green, POST orange, PUT amber, PATCH blue, DELETE red).
- **Do** honor `prefers-reduced-motion` (animation: none) and
  `prefers-reduced-transparency` (opaque surfaces) for every new effect.
- **Do** keep body text ≥4.5:1 against Carbon Black — Steel Ink at full, muted
  at 60% minimum for prose.

### Don't:
- **Don't** build the generic SaaS template: no cream heroes, no gradient
  text (`background-clip: text` is prohibited), no identical feature-card grids.
- **Don't** drift toward enterprise-dashboard chrome: no blue-gray fills, no
  dense bordered tables as layout.
- **Don't** do dev-terminal cosplay: no matrix green on black, no ASCII-art
  borders, no scanline effects.
- **Don't** introduce independent grays or a second accent; grays derive from
  Steel Ink, identity stays orange.
- **Don't** use colored side-stripe borders (>1px `border-left`) on cards or
  alerts; use full borders or tinted fills.
- **Don't** add glass decoratively — if a blur doesn't encode altitude, it
  doesn't ship.
