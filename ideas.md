# FootyScores Pro — Design Directions

## Three possible approaches

### 1. Matchday Ledger
**Very Brief Intro:** A refined sports desk that blends a live-score terminal with the material tactility of a bookmaker's printed fixture card. It feels trusted, focused, and editorial rather than noisy.
**Probability:** 0.06

### 2. Stadium Afterglow
**Very Brief Intro:** A dramatic night-match interface with floodlight gradients, soft motion, and illuminated competition badges. It creates energy and spectacle without turning into neon gaming UI.
**Probability:** 0.03

### 3. Continental Signal
**Very Brief Intro:** A crisp, international broadcast-control-room aesthetic built from deep blue fields, warm paper panels, and map-like competition indexing. It emphasizes discovery across regional competitions.
**Probability:** 0.08

## Selected approach — Matchday Ledger

### Design Movement
**Modern editorial sports desk**: the tactility and hierarchy of a premium sports paper reinterpreted as a responsive live-data workspace.

### Core Principles
1. **Clarity before spectacle:** status, score, and copy-ready update are visible in a glance.
2. **Editorial hierarchy:** assertive display typography, restrained labels, and deliberate dividers make dense match information calm.
3. **Tactile utility:** cards read like fixture slips, while controls behave like lightweight professional tools.
4. **Live data earns color:** ink and paper dominate; coral is reserved for active/live moments and cobalt for interaction.

### Color Philosophy
Warm off-white paper carries the page to reduce glare. Graphite ink gives the app authority, a deep midnight blue frames the professional toolset, and a concentrated signal-coral announces live states and important actions. Competition logos provide the remaining variation, never decorative gradients.

### Layout Paradigm
An **editorial rail + match ledger**. On wide screens, a narrow fixed context rail anchors date, filters, and selection state while the match ledger flows in an asymmetric reading column. On mobile, the rail becomes a compact sticky command strip so cards remain primary.

### Signature Elements
1. **Signal dot** — a coral dot and subtle pulse used only for current live data.
2. **Fixture rule** — a thin double-rule divider that separates competitions and appears in cards, drawers, and search results.
3. **Copy slate** — a dark, monospace output surface that makes generated match updates feel deliberate and ready to send.

### Interaction Philosophy
Interactions feel like operating a trusted desk: immediate, reversible, and explicit. Copying gives a compact confirmation; selecting a league toggles instantly; browsing opens a responsive command drawer. No hidden hover-only actions or decorative motion.

### Animation
Cards enter with a short 180ms opacity-and-rise cascade; drawers use a 240ms slide with a custom ease-out; active filter and style controls use crisp color transitions. Live dots pulse slowly. All nonessential motion disables under reduced-motion preferences.

### Typography System
**Archivo** is the expressive, high-contrast display face for scores, competition titles, and time. **IBM Plex Mono** is the compact utility face for copy-ready output, timestamps, and controls. Body text uses Archivo at comfortable proportions; titles are uppercase only for small labels and status metadata.

### Brand Essence
**FootyScores Pro is the personal match desk for football fans who want live results and ready-to-publish updates without the noise.**

**Personality:** precise, editorial, assured.

### Brand Voice
Headlines are direct and data-led; CTAs name the result of an action, not a vague invitation. Microcopy stays calm and factual.

Example lines: “The matchdesk for the moments that matter.” and “Copy the update. Keep the context.”

### Wordmark & Logo
A bold, text-free **split-pitch signal mark**: a squared coral disc cut by a slim vertical field line, with one offset ink semicircle suggesting both a ball and a broadcast indicator. The mark should remain recognizable at favicon scale.

### Signature Brand Color
**Signal Coral — #F5523D.**

## Style Decisions

- Signal Coral is reserved for live or active match signals, the split-pitch brand mark, and the single most important copy action. Routine controls use midnight blue, graphite, or paper.
- The system favors fixture-card rules, tabular alignment, paper texture, and editorial type hierarchy over generic rounded dashboard treatments.
- The FootyScores Pro lockup always pairs the split-pitch signal mark with a custom-feeling, tightly tracked FOOTY/SCORES/PRO typographic construction.
