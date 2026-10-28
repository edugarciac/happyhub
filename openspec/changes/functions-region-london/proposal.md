## Why

Vercel runs every API route and server-rendered page in `iad1` (Washington, US), the default region. The Neon database is in `eu-west-2` (London) and the customers are in Spain. Every database query crosses the Atlantic (~75 ms round trip), and a page or API call often runs several queries, so the whole site and admin are slower than they need to be.

## What Changes

- Set `"regions": ["lhr1"]` in `vercel.json` so functions run in London, next to the database and close to Spain.

## Capabilities

### New Capabilities
- `function-region`: serverless functions run in the same region as the database.

## Impact

- **Config**: `vercel.json` only. No application code changes.
- **Plan**: Hobby allows one function region, which is all this needs.
- **Cron**: `/api/cron/expire-reservations` keeps its schedule; it just runs in London.
- **External APIs** (Stripe, Resend, WhatsApp, Anthropic) are global; no impact.
