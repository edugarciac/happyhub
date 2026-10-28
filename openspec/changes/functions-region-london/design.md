## Decision

Use `lhr1` (London) because Neon is in `eu-west-2` (London). Function ↔ database latency matters most: it is paid once per query, many times per request. Browser ↔ function latency from Spain to London is ~30 ms, paid once per request.

- Rejected: `cdg1` (Paris) — closer to Spain by a few ms, but adds ~10 ms per database query.
- Rejected: moving the database — riskier (data migration) for no extra gain.

Set in `vercel.json` (versioned) rather than only in the dashboard, so the choice is reviewable and survives project re-creation.
