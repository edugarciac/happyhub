## 1. Implementation

- [x] 1.1 `src/lib/kb.ts`: load any KB folder; `getManualIndexProps` / `getManualDocProps` for `content/interno`
- [x] 1.2 Extract `KbDocBody` from `GuideDoc`
- [x] 1.3 `/admin/manual` and `/admin/manual/[...slug]` with a server-side admin check
- [x] 1.4 "Manual interno" in `DashboardNav`
- [x] 1.5 `outputFileTracingIncludes` for `content/interno`
- [x] 1.6 Initial content: Home Assistant scripts and how to update the room guide
- [x] 1.7 Tests: internal folder valid; public KB never includes internal docs

## 2. Verify

- [x] 2.1 `npx tsc --noEmit`, `npm test`, `npm run build`
- [x] 2.2 Without a session, `/admin/manual` and its `/_next/data` JSON redirect and contain no manual text
- [ ] 2.3 After deploying, open the manual on Vercel as admin (checks the files are included)
