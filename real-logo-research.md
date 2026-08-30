# Real Competition Logo Audit

Source checked: `https://sports.core.api.espn.com/v2/sports/soccer/leagues/eng.1?lang=en&region=us`

The live ESPN Core league detail returned authoritative identifiers including `slug: eng.1`, `alternateId: 23`, and `uid: s:600~l:700`, but the visible payload did not include a `logos` array or direct league-logo href. It did include an authoritative ESPN league page link and country flag metadata. Therefore, the current `https://a.espncdn.com/i/teamlogos/soccer/500/{alternateId}.png` construction is not proven to be a competition-logo path; it can return unrelated or missing artwork. The implementation should first consume an explicit logo/image field when a scoreboard or directory payload provides one, then use a validated ESPN league-artwork resolver or checked-in per-slug mapping, and only then use initials as a last-resort fallback.
