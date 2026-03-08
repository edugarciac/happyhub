# Project: happyhub
HappyHub platform - employee experience and internal portal.

## Owner
Edu Garcia Casas - Enterprise Architect, Allianz Technology

## Status
Active

## Key Files
- `amplify.yml` - AWS Amplify build configuration
- `docs/project_notes/decisions.md` - Architectural Decision Records (ADRs)
- `src/utils/pricing.ts` - Centralized pricing logic
- `pages/api/` - API routes for authentication and webhooks

## Deployment
**AWS Amplify** (not Vercel)
- Push to `main` branch triggers automatic deployment
- Configuration in `amplify.yml`
- Environment variables managed in AWS Amplify Console
- See ADR-008 in `docs/project_notes/decisions.md` for details

## Notes for Claude
- This project uses AWS infrastructure exclusively (see ADR-006, ADR-008)
- `vercel.json` exists for historical reference only - do NOT use Vercel
- All deployment is through AWS Amplify with auto-deploy from GitHub
