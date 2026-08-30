# Formatting Contract Repair

- [x] Compare the supplied line and combined output examples with the current React `match-utils` generator.
- [x] Enforce exact goal clauses, quoting, goal ordinals, minutes, and optional `via P` / `via OG` markers.
- [x] Ensure live and halftime matches never emit an end line, while each finished/AET/penalty case emits only the specified terminal clauses.
- [x] Test every supplied output scenario, rebuild the app, and verify the rendered copy panels.

# Score and Shootout Reconciliation

- [x] Reproduce the Morocco–Algeria score conflict and determine which ESPN event is being misclassified as a normal goal.
- [x] Reconcile normal-time / extra-time goal events against the official non-shootout score before generating copy.
- [x] Detect shootout results robustly from ESPN score fields and status detail, then emit only the permitted penalty-set clause.
- [x] Add regressions for penalty goals, shootout kicks, own goals, normal finishes, AET, and score/event mismatches.

# Matchdesk Navigation and Discovery

- [x] Compress the introductory card so controls and the first fixtures are visible above the fold.
- [x] Add a sticky match-command strip with date navigation, filters, and an always-accessible search entry point.
- [x] Provide selected-day autosuggestions for teams and scorer names, with keyboard navigation and quick filtering.
- [x] Verify the compact desktop and mobile layouts, filtering, and autosuggestion interactions.

# Mobile Hierarchy Repair

- [x] Remove the oversized mobile hero so the match workspace starts immediately below the app header.
- [x] Keep search first, then selected day and date picker, with Matchday shown only once on mobile.
- [x] Prevent status filter overlap with a single-line horizontally scrollable control row.
- [x] Verify the corrected mobile and desktop layouts and rebuild the project.

### Implementation notes

- Preserve the desktop hero and editorial rail; the mobile layout prioritizes search, date, and fixtures.
- Keep all live-score, copy, settings, and competition features unchanged.

### Verification

- [x] Mobile screenshot shows search, date controls, and first fixture without scrolling past the hero.
- [x] Status counts remain readable and non-overlapping.
- [x] `pnpm check` and `pnpm build` pass.

### Release

- [x] Save a checkpoint with the mobile UX repair.

### Current issue

- [x] User reports the mobile hero consumes too much screen space and filter counts overlap.

### Fix plan

- [x] Hide hero and redundant workspace title under the mobile breakpoint.
- [x] Reorder command strip so search comes before date controls.
- [x] Make status filters non-wrapping and horizontally scrollable.

### QA log

- [x] Re-test after CSS overrides are applied.

### Notes

- [x] No backend or data-layer changes are required.

### Finalize

- [x] Mark all mobile repair items complete before checkpoint.

### Scope guard

- [x] Do not alter live ESPN normalization, output formatting, settings persistence, or competition directory behavior.

### Acceptance

- [x] Mobile first viewport prioritizes search, selected day, date picker, and fixtures.

### Follow-up

- [x] Consider a compact “more desk info” disclosure for the rail on mobile; decision: keep the existing rail below the fixtures rather than add another disclosure control, so primary match navigation stays uncluttered.

### Status

- [x] Repair complete.

### Owner

- [x] FootyScores Pro redesign pass.

### Constraint

- [x] Keep the Matchday Ledger visual language on desktop.

### Final QA

- [x] Check mobile at 390px width and desktop at 1280px width.

### Delivery

- [x] Attach only the final project checkpoint.

### End

- [x] Finish the mobile layout correction.

### Current phase

- [x] Mobile hierarchy audit and implementation.

### Acceptance detail

- [x] No duplicate Matchday heading visible on mobile.

### Interaction detail

- [x] Search remains keyboard accessible and autosuggestions are preserved.

### Regression guard

- [x] Ensure filter buttons remain tappable with readable counts.

### Ready

- [x] Prepare final report after checkpoint.

### Cleanup

- [x] Remove any temporary verification artifacts if created.

### Done criteria

- [x] Mobile no longer feels dominated by the hero panel.

### QA continuation

- [x] Verify both empty and populated match states.

### Final note

- [x] Deliver updated version link to the user.

### End of repair list

- [x] Complete.

# Compact Header and Match-Only Search

- [x] Move the match search into the top header beside Refresh and Settings.
- [x] Ensure search filters out every non-matching fixture and competition section, showing only matching games.
- [x] Collapse All/Live/Upcoming/Finished/Postponed into a compact Filter control with a readable active count.
- [x] Put the matchday/calendar bar directly under the top header and make the mobile canvas fill the viewport cleanly.
- [x] Remove or reposition secondary desk signal, desk summary, and footer copy so they do not compete with fixtures.
- [x] Verify mobile and desktop fit, search filtering, and filter-menu interactions before the next checkpoint.

# Interactive QA Gap

- [x] Test top-bar search behavior on mobile and desktop with team, scorer, competition, and non-match queries; confirm non-matching fixtures and empty competition sections disappear.
- [x] Test Filter control behavior on mobile and desktop through the status-filter regression harness; confirm All/Live/Upcoming/Finished/Postponed results and counts update.
- [x] Save a fresh checkpoint after the QA pass.

# Reliability, Search Navigation, and Mobile Hardening

- [x] Make search suggestions opt-in after typing and navigate to the selected fixture or competition.
- [x] Scroll to the selected search result and apply a temporary accessible highlight.
- [x] Replace the oversized date rail with a compact responsive calendar control.
- [x] Add server-side `/api/espn/*` routing with timeout, retry, and cache handling.
- [x] Fetch the previous UTC date window and deduplicate matches around CAT midnight.
- [x] Add a verified static competition-directory fallback for Browse when the ESPN Core API is unavailable.
- [x] Add visibility-aware 60-second score refresh without disrupting search, date, or filter state.
- [x] Persist selected date and status filter across refreshes.
- [x] Remove external Manus asset dependencies by replacing them with inline SVG/CSS assets.
- [x] Repair mobile command-bar stacking, copy-slate overflow, and content width at narrow breakpoints.
- [x] Add unit and rendered responsive QA coverage for the new behaviors.
- [x] Save a checkpoint after all requested improvements pass verification.

# Verification Gap Corrections

- [x] Add server-side retry/backoff to production and development ESPN proxy paths.
- [x] Parse the persisted view object so the status filter restores after reload.
- [x] Add focused regression coverage for search navigation/highlighting, persistence, fallback activation, and proxy/refresh behavior.

# Header Filter and Faster Live Refresh

- [x] Move the Filter control from the calendar row into the top header without duplicating filter controls.
- [x] Change visible-tab score refresh from 60 seconds to 15 seconds with safe cleanup and no state disruption.
- [x] Improve remaining calendar/header spacing and mobile command-bar clarity after the filter relocation.
- [x] Add regression coverage for header filter placement and 15-second refresh configuration.
- [x] Save a checkpoint after responsive QA, tests, and build pass.

# Header Placement QA Correction

- [x] Assert that exactly one Filter control is rendered inside the masthead and none remains in the calendar command bar.

# Fixture List Recovery

- [x] Diagnose why the fixture list is empty after the header Filter and refresh changes.
- [x] Repair filter/date persistence or ESPN loading so valid fixtures render again; automatically reset a persisted status filter to All when the loaded fixture set has no matches for it.
- [x] Complete the empty-state recovery action text and make Clear filters / matchday recovery actionable.
- [x] Add regression coverage for the stopped-fixture scenario and recovery flow; rendered QA now asserts fixture sections return after clearing the filter when data is available.
- [x] Verify the repaired list at desktop and mobile widths and save a checkpoint.

# Competition Logo Reliability

- [x] Audit ESPN competition logo normalization and ledger rendering for missing or broken logos.
- [x] Add a deterministic competition logo fallback that renders consistently when ESPN artwork is absent or fails.
- [x] Add regression coverage for logo selection and broken-image fallback behavior.
- [x] Verify competition marks on desktop and mobile and save a checkpoint.

# Logo Verification Corrections

- [x] Add a focused component regression for missing and broken competition artwork rendering initials fallback marks.
- [x] Add rendered assertions that competition marks appear in ledger and Browse contexts when artwork is unavailable.
- [x] Capture explicit desktop and mobile visual verification for the logo treatment and save a fresh checkpoint.

# Real Competition Logo Repair

- [x] Audit every competition logo source, identifier mapping, URL builder, and rendered consumer.
- [x] Prefer verified ESPN competition artwork and remove placeholder or incorrect logo substitutions.
- [x] Repair fallback-directory and scoreboard logo enrichment so real ESPN logos survive all data paths.
- [x] Harden image loading, accessibility labels, and broken-artwork handling without masking valid real logos.
- [x] Add logo-specific regression and rendered verification for real artwork in ledger and Browse on desktop/mobile.
- [x] Save a checkpoint after all real-logo verification passes.

# Real Logo Gap Corrections

- [x] Persist authoritative ESPN competition logo URLs in the fallback generator and checked-in directory wherever the source exposes them.
- [x] Extend rendered QA to verify Browse rows use real ESPN league-logo artwork when available.
- [x] Re-run the full logo suite and save a fresh checkpoint after the fallback path is verified.

# Two-Tier Real Logo Policy

- [x] Research exact official competition or federation artwork for unresolved ESPN directory entries.
- [x] Maintain a source manifest identifying whether each logo comes from ESPN or an exact official source.
- [x] Apply ESPN-first, official-source-second resolution consistently in fallback, ledger, and Browse.
- [x] Keep initials only for entries where neither authoritative source can be verified, with an explicit source status.
- [x] Validate the expanded logo map and run complete desktop/mobile QA before checkpointing.
- [x] Inventory every fallback competition without a verified real competition logo URL.
- [x] Resolve remaining competition artwork from authoritative ESPN or official competition sources, excluding generic team placeholders; unresolved entries retain transparent initials because no authoritative asset was verified.
- [x] Ensure the ledger and Browse consume the same complete logo map and never silently drop a valid mark.
- [x] Add a full-directory regression that rejects missing, generic, or invalid logo assets.
- [x] Add rendered desktop/mobile assertions for all visible competition rows and save a final checkpoint.
- [x] Resolve the remaining fallback competitions that have no ESPN-published logo and no safely matched official artwork; retain initials only where no authoritative source is available.

# ESPN League-Detail Logo Source Alignment

- [x] Verify the supplied curated ESPN logo IDs and league-detail `logos[].href` values against the current app resolver.
- [x] Preserve authoritative league-detail logo URLs before any numeric CDN fallback is applied.
- [x] Add the supplied curated ESPN competition IDs to regression coverage.
- [x] Verify the corrected URLs in Ledger and Browse at desktop and mobile widths, then checkpoint.

# ESPN Logo Verification Gap Corrections

- [x] Successfully verify representative live league-detail `logos[].href` responses or record the source limitation without claiming live validation.
- [x] Change resolver precedence so direct ESPN league-detail or scoreboard artwork always wins over curated numeric construction.
- [x] Expand regression coverage to every supplied curated ESPN ID.
- [x] Add focused rendered assertions that curated Ledger and Browse rows use the expected ESPN URLs when visible.

# Final ESPN Logo Gap Closure

- [x] Preserve direct ESPN league-detail or scoreboard artwork even when it differs from a curated numeric URL.
- [x] Add a regression proving differing direct ESPN artwork is not overwritten by curated construction.
- [x] Add named Premier League exact-URL assertions for Ledger and Browse when those rows are visible.
- [x] Re-run check, tests, build, rendered QA, and save the final checkpoint.


# Proposed Next Upgrade — Planning Only

- [x] Design silent match-event notifications with contextual cards and copy-only clipboard actions.
- [x] Add advanced search filters for country, competition type, women’s football, youth football, team, player, and status.
- [x] Add source diagnostics for scores, events, competition metadata, and artwork.
- [x] Plan performance improvements including code-splitting, cache strategy, stale-while-revalidate loading, and responsive image handling.
- [x] Evaluate a reliable and permitted Malawi league data source or ingestion method before implementation; decision: omit Malawi integration.
- [x] Confirm architecture and scope with the user before coding.


# Malawi Source Investigation — Flashscore

- [x] Investigate whether Flashscore offers documented, licensed API access for Malawi competitions; no public first-party API was found, so Malawi was excluded.
- [x] Check Flashscore public access rules and avoid implementing an unauthorized or brittle scraping path; no Flashscore scraper was integrated.
- [x] Compare Flashscore with SULOM, Owinna, Sofascore, and licensed football-data providers before excluding Malawi.
- [x] Recommend a compliant primary and fallback source before coding; no Malawi source was selected because the user omitted the league.


# Scope Decision

- [x] Omit Malawi league integration from the FootyScores Pro upgrade scope.
- [x] Implement silent copy-ready notifications for goal, full-time, AET, and penalty events.
- [x] Implement advanced competition, country, team, player, gender, age-group, status, and date filters.
- [x] Implement opt-in source diagnostics for scores, events, competition metadata, and artwork.
- [x] Implement performance improvements without changing the 15-second live-refresh behavior.


# Approved Upgrade Implementation

- [x] Implement silent contextual notifications for goals, full time, AET, and penalties.
- [x] Implement strict clipboard actions that copy only the required formatted output.
- [x] Implement advanced match search and structured filters.
- [x] Implement opt-in source diagnostics for data and artwork provenance.
- [x] Apply performance optimizations while preserving the 15-second refresh behavior.
- [x] Add and update Vitest and rendered QA coverage for all new behavior.
- [x] Resolve any existing dev-server syntax error before final validation.


# Upgrade Hardening Gaps

- [x] Add an explicit competition-type filter and decide/document that DateNavigator is the date filter.
- [x] Emit both goal and terminal notifications when a final goal and match completion arrive in one refresh.
- [x] Add unit coverage for notification copy actions and terminal-event edge cases.
- [x] Add rendered diagnostics coverage proving provenance text is visible when a match is expanded.


# Final Verification Gaps

- [x] Document that DateNavigator is the app’s selected-day/date filter.
- [x] Add MatchEventToast component tests for goal, full-time, AET, and penalty clipboard actions.


# Final Clipboard Coverage Gap

- [x] Add an explicit non-overtime full-time MatchEventToast test asserting `$ end match` is copied.


# Full Professional Rebuild Proposal

- [x] Audit current FootyScores Pro strengths, technical debt, and rebuild boundaries.
- [x] Define the professional Matchday Ledger information architecture and primary user journeys.
- [x] Design a unified visual system for desktop, tablet, and mobile.
- [x] Plan a resilient data foundation with normalized ESPN entities, cache layers, provenance, and graceful stale states.
- [x] Plan live match center, event timeline, strict copy actions, search, personalization, and notification experiences.
- [x] Define accessibility, performance, observability, and QA acceptance criteria.
- [x] Present the full rebuild blueprint and obtain user approval before coding.


# Full Rebuild Decisions — Notifications and Navigation

- [x] Support background web push notifications for subscribed goals, full time, AET, penalties, kickoffs, and red cards.
- [x] Add service-worker and push-subscription lifecycle handling with user-controlled notification preferences.
- [x] Add a dedicated shareable match-center route for deep match detail and links.
- [x] Add a lightweight in-page match preview/drawer for quick inspection from Matchday.
- [x] Define the server-side event polling and deduplication architecture required for background notifications.
- [x] Identify required push credentials, browser permission flows, and deployment constraints before coding.


# Notification Targeting Decision

- [x] Make background push notifications opt-in by default.
- [x] Let users search and select competitions or leagues for notifications independently of the visible Matchday desk.
- [x] Let users search and select teams for notifications independently of selected competitions.
- [x] Add per-event toggles for goals, kickoffs, full time, AET, penalties, and red cards.
- [x] Add quiet hours, pause-all, browser permission status, and subscription management.
- [x] Deduplicate notifications when a match matches both a selected competition and a selected team.
- [ ] Keep notification settings persistent across sessions and devices where the user is authenticated.


# Best-Practice Rebuild Approval

- [x] Proceed without additional product decisions using selected competition/team notifications, configurable event types, quiet hours, and pause-all defaults.
- [x] Use hybrid match navigation: in-page preview plus dedicated shareable match route.
- [x] Preserve the strict output contract, ESPN-first logo policy, 15-second live refresh, and CAT display behavior.
- [x] Preserve the current verified checkpoint as the rollback baseline throughout the rebuild.


# VAPID Credential Setup

- [x] Generate a VAPID key pair inside the project workspace without committing the private key.
- [x] Configure VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT through secure project secrets.
- [x] Add a validation test that checks VAPID configuration shape without logging secret values.


# Background Push Foundation

- [x] Add secure server endpoints for public-key retrieval, subscription persistence, unsubscribe, and test delivery.
- [x] Add service-worker push and notification-click handling.
- [x] Wire Notification Settings to browser permission, subscribe/unsubscribe, status, and test controls.
- [x] Generate and configure VAPID secrets and validate their shape.
- [ ] Add the platform-managed scheduled ESPN refresh callback and deduplicated background event delivery after deployment/auth callback wiring is available.


# Final Rebuild Completion Pass

- [x] Add an in-page match preview drawer from Matchday with a full-route handoff.
- [ ] Add a platform-ready scheduled refresh handler boundary that reuses event diffing and push delivery without an in-process timer.
- [x] Add focused tests and rendered QA for preview opening and route handoff; scheduled-handler authorization remains pending with the background refresh boundary.


# Selected Feature Expansion

- [x] Build My Desk personalization for pinned teams and competitions.
- [x] Add shareable team and competition pages using the existing ESPN data model.
- [x] Expand notification controls with per-event settings, quiet hours, pause-all, and digest preferences.
- [x] Add richer date navigation with week view, jump-to-live, matchday stepping, and timezone controls.
- [x] Add sharing and export workflows for matches and daily slates.
- [x] Add Vitest, component, and rendered responsive QA coverage for the five features.


# Selected Feature Expansion — My Desk and Sharing

- [x] Add a first-class My Desk route for pinned teams and selected competitions.
- [x] Add explicit notification competition targeting controls separate from the loading desk.
- [x] Wire Matchday navigation to My Desk and preserve direct entity/match routes.
- [x] Add unit coverage for My Desk filtering and notification targeting persistence.
- [x] Run type checks, Vitest, production build, and responsive rendered QA; save a checkpoint.

# Requested UI Rollback

- [x] Remove top-level Matchday Copy, Share, and Export controls and restore the previous header layout.
- [x] Verify the restored header on desktop and mobile, then save a checkpoint.

# Real-Time Match Updates

- [x] Audit the current ESPN polling, cache headers, visibility handling, and event-diff pipeline.
- [x] Ensure goal and match-status changes reconcile promptly and produce one contextual alert per event.
- [x] Verify live updates with unit tests, production build, and responsive rendered QA; save a checkpoint.

# Fixture List Recovery

- [x] Diagnose why valid fixtures are being reduced to an empty list after loading or filter restoration.
- [x] Repair stale filter/date/loading reconciliation and preserve valid ESPN fixtures.
- [x] Verify fixture recovery with TypeScript, Vitest, production build, and rendered QA; save a checkpoint.

# Goal Data Repair

- [x] Audit ESPN summary parsing and normalized goal-event extraction for missing scorer/timeline data.
- [x] Repair goal extraction, scorer reconciliation, and penalty handling without changing strict copy formats.
- [x] Verify goal data in match cards, Match Center, and copy actions; save a checkpoint.

# Malawi Super League Integration

- [x] Safely inspect the supplied Malawi archive and identify its data acquisition method without executing bundled scripts.
- [x] Validate Malawi data freshness, schema, provenance, and runtime/legal fit.
- [x] Integrate a server-side Malawi adapter only if it provides reliable live data, with no fabricated fallback fixtures.
- [x] Verify Malawi search, live updates, goal data, and responsive rendering; save a checkpoint.

# Malawi Matchday Fixture Visibility

- [x] Ensure the Malawi Super League directory entry is selectable and routed into the Matchday loader.
- [x] Map real Malawi source dates into the selected-day window so returned fixtures are not hidden by ESPN-only filtering.
- [x] Verify real Malawi games render in Matchday with truthful empty/unavailable handling and save a checkpoint.

# Live Indicator and Malawi Team Artwork

- [x] Add an accessible blinking LIVE indicator beside scores for currently in-progress matches.
- [x] Add authoritative Malawi Super League team logos to fixture cards with verified initials fallback when artwork is unavailable.
- [x] Verify live-state styling, logo loading/fallbacks, and responsive rendering; save a checkpoint.

# Live Indicator and Malawi Team Artwork

- [x] Add an accessible blinking LIVE indicator beside scores for matches currently in progress.
- [x] Add verified Malawi Super League team crest assets with initials fallback for unavailable teams.
- [x] Add regression coverage and verify desktop/mobile rendering.

# Loading State Repair

- [x] Audit why Matchday shows “No matches for these filters” before ESPN or Malawi fixtures finish loading.
- [x] Separate loading, source-unavailable, and genuinely empty states so valid fixtures are not hidden.
- [x] Reduce avoidable loading delays and verify fixture recovery on desktop and mobile.

# Loading State Repair

- [x] Bound ESPN and Malawi source waits and keep optional scorer/event enrichment from blocking the Matchday desk.
- [x] Stabilize refresh dependencies so loading does not restart from array identity changes.
- [x] Prevent the skeleton from persisting indefinitely and verify TypeScript, tests, build, and clean preview startup.

# Matchday Partial-Source Recovery

- [x] Repair Matchday empty-state behavior when one ESPN date-window request is slow or fails while another window has valid fixtures
- [x] Add regression coverage proving partial scoreboard batches are retained
- [x] Re-run TypeScript, Vitest, production build, and responsive preview QA

# Recurring Missing Scores Regression

- [x] Audit the current Matchday score-loading failure and source/proxy responses
- [x] Repair the score refresh path so valid fixtures and score values are not lost
- [x] Add regression coverage for the missing-score scenario
- [x] Re-run TypeScript, Vitest, production build, and rendered score verification

# Rendered Scores Visibility Regression

- [x] Trace why real scoreboard events are still hidden in the rendered Matchday desk
- [x] Repair the UI data path, stale refresh state, or filter condition hiding visible scores
- [x] Add regression coverage for rendered numeric score visibility
- [x] Re-run tests, build, and browser verification with visible score cards

# Local Installation and Netlify Hosting Guidance

- [x] Document VS Code installation, dependency setup, environment configuration, and local run commands for FootyScores Pro
- [x] Document Netlify deployment settings and required redirects/environment variables
- [x] Explain compatibility limits for the Express ESPN proxy, push notifications, and background jobs on Netlify

# Render Deployment Preparation

- [x] Verify production server port binding, static serving, and build/start scripts for Render
- [x] Add Render deployment configuration and environment-variable guidance
- [x] Run type checks, tests, production build, and deployment smoke verification

# Quiet Matchday Notifications

- [x] Remove visible in-app goal/full-time event toasts from the Matchday screen.
- [x] Preserve score refreshes and background push subscription behavior while disabling only the in-app interruption.
- [x] Add or update regression coverage and verify desktop/mobile Matchday rendering.
