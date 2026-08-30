# FootyScores Pro — React Rebuild

FootyScores Pro is a **client-only personal football match desk**. It calls ESPN’s public football score and summary endpoints from the browser, turns verified match moments into copy-ready update strings, and keeps the user’s preferred competitions and output settings in local storage.

## What is included

| Capability | Implementation |
|---|---|
| Live score desk | Selected ESPN football competitions load by the chosen match date, with CAT / Africa-Blantyre as the display timezone. |
| Honest fixture policy | The interface does **not** seed or invent fixtures. A date without returned ESPN fixtures is shown as an empty state. |
| Match states | Scheduled fixtures are labelled **Upcoming** with kickoff time; live, finished, postponed, cancelled and FT-Pens states remain distinct. |
| Goal enrichment | Background event-summary requests enrich match cards with scorer names, goal minutes, added time, own-goal and penalty context where ESPN supplies it. |
| Copy-ready syntax | Cards produce `$ match at …`, goal updates, `$ end match`, `$ match postponed`, and penalty-set updates. Individual and full-card copy actions are available. |
| Dynamic competition directory | The directory is resolved from ESPN Core at runtime and cached locally for 24 hours, with a static safety fallback if the directory endpoint is unavailable. |
| Fuzzy competition search | Name, region, word-prefix and football shorthand queries are supported: `wafcon`, `afcon`, `ucl`, `cl`, `el`, `cwc`, `u17`, `bl`, and more. |
| Personal settings | Prefix, default output style, goal-credit preference, and competition selection automatically persist in the browser. |

## Design system

The **Matchday Ledger** visual system combines warm paper surfaces, fixture rules, bold Archivo editorial type, IBM Plex Mono utility copy, a midnight control rail, and **Signal Coral `#F5523D`** for live or active match signals. The responsive layout preserves the ledger structure on mobile without losing access to filters, card output, or the competition desk.

## Local development

```bash
pnpm dev
pnpm check
pnpm build
```

No server, database, private key, or API proxy is required for normal use. ESPN availability and CORS behavior can vary by network; the app handles individual competition failures without replacing real empty results with fake games.

## Key client modules

| Area | Path |
|---|---|
| App composition | `client/src/pages/Home.tsx` |
| Browser state and persistence | `client/src/hooks/useFootyScores.ts` |
| ESPN public API integration | `client/src/lib/espn.ts` |
| Match classification and output text | `client/src/lib/match-utils.ts` |
| Competition fuzzy matching | `client/src/lib/competition-search.ts` |
| Matchdesk components | `client/src/components/` |

## Mobile hierarchy decision

On narrow screens, the editorial hero and duplicate fixture-ledger heading are intentionally hidden so search, selected-day controls, and fixtures appear first. The desk rail remains below the fixture ledger as secondary context instead of adding another disclosure control; this keeps the primary match workflow uncluttered while preserving access to desk status and competition settings.
