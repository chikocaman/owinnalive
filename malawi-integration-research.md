# Malawi League Integration Research

## Findings

The Super League of Malawi website (SULOM) is the strongest candidate for authoritative integration. Its public homepage exposes current-season club listings, matchweek groupings, fixture dates and times, completed scores, standings, club pages, and individual match URLs. The site showed 2026 MatchWeek 13 fixtures and results, including CAT times and sixteen clubs.

The Football Association of Malawi website is authoritative for federation news and national competitions, but its homepage is primarily editorial and does not present a structured top-flight fixture feed suitable for direct score polling.

Sofascore provides a public Malawi Super League competition page and broad football coverage, but the extracted page currently showed no available events for the selected season. It is therefore useful as a cross-check or fallback candidate, not as the first source without confirming permitted access and an appropriate API arrangement.

Owinna publicly displayed Malawi competitions and fixtures, including the FDH Bank Premiership and several lower divisions, with CAT times. It may provide broader coverage than SULOM, but its source authority and terms for automated extraction must be checked before use.

## Recommended data policy

Prefer an official or licensed structured source. Use SULOM as the first candidate for official competition metadata, fixtures, results, and standings. Do not scrape aggressively from the browser. If no supported API exists, create a low-frequency server-side adapter with caching, rate limiting, schema validation, source attribution, and a manual disable switch. Treat third-party sites as secondary cross-checks unless their terms explicitly permit automated access or the user supplies a licensed API key.

## Current source examples

- SULOM: https://sulommw.com/
- Football Association of Malawi: https://fam.mw/
- Sofascore Malawi Super League: https://www.sofascore.com/football/tournament/malawi/super-league/25902
- Owinna: https://owinna.com/

## Flashscore investigation

The research did not identify a public first-party Flashscore developer API. The available programmatic options found are third-party scraper products, including an Apify Actor that advertises structured fixtures, match IDs, tournament IDs, statuses, and date offsets. The Actor is community-developed, priced from $10 per 1,000 results, and should not be treated as an official Flashscore API.

Flashscore/Livesport terms state that, without prior written authorization, visitors are not authorized to copy, modify, distribute, transmit, display, reproduce, transfer, upload, download, or otherwise use or alter site content. The terms also reserve the right to block misuse. This means a direct custom scraper should not be implemented without written permission or a licensed intermediary agreement.

A more defensible alternative is a licensed football-data provider. Live-score-api.com explicitly lists Malawi coverage for the Super League and advertises fixtures, match events, standings, lineups, and related data. Sportmonks advertises broad league coverage, but Malawi availability must be confirmed against its league catalog before purchase; its published plans start at €29/month for five leagues.

## Recommendation

Do not call an unofficial Flashscore endpoint directly from the FootyScores app. If Flashscore data is mandatory, use a third-party provider only after confirming its authorization, terms, retention rules, and Malawi coverage. The preferred production route is a licensed provider with a server-side adapter, with SULOM used for official metadata or cross-checking. A community scraper such as an Apify Actor is suitable only for a temporary, low-volume prototype after the user accepts its cost and compliance risk; it should not be the sole live-score source.

Additional sources:

- Flashscore/Livesport terms: https://www.livesport.eu/terms/flashscore_ae/
- Apify Flashscore Data Extractor: https://apify.com/dataizi-srl/flashscore-data-extractor/api
- Live-score-api.com Malawi coverage: https://live-score-api.com/leagues/league/183/Malawi
- Sportmonks Football API: https://www.sportmonks.com/football-api/
