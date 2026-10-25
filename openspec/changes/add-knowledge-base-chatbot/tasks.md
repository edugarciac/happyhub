## 1. Knowledge base

- [ ] 1.1 Add `gray-matter` and a Markdown renderer
- [ ] 1.2 Move the `/como-funciona` FAQ to `content/kb/faq/*.md` (one file per category)
- [ ] 1.3 Write the room guide in `content/kb/guia-sala/*.md` (content pending from the owner)
- [ ] 1.4 `src/lib/kb.ts` (`getKbDocs`) + unit tests for frontmatter and `## ` parsing
- [ ] 1.5 `/como-funciona` reads the KB in `getStaticProps`; remove the hard-coded `categories`
- [ ] 1.6 New `/guia-sala` page from the KB

## 2. Shared data access

- [ ] 2.1 Extract `src/lib/pricingRules.ts` from `/api/pricing/current`
- [ ] 2.2 Extract `src/lib/bookedSlots.ts` from `/api/booked-slots`
- [ ] 2.3 Both APIs use the extracted functions (no behavior change)

## 3. Chat API

- [ ] 3.1 `src/lib/kbChat.ts`: system prompt (KB with `cache_control`), tools `get_pricing` and `check_availability`, tool-use loop
- [ ] 3.2 `POST /api/chat` with input validation (zod), length limits and per-IP rate limit
- [ ] 3.3 WhatsApp handoff (`handoff: true`)
- [ ] 3.4 Unit tests for the tools and request validation

## 4. Widget

- [ ] 4.1 `src/components/ChatWidget.tsx` (dynamic import), mounted on public pages, hidden on `/admin` and `/mis-eventos/[id]`
- [ ] 4.2 `/guia-sala/panel` with the widget open
- [ ] 4.3 GA4 events `chat_open`, `chat_message`, `chat_handoff_whatsapp`

## 5. Verify

- [ ] 5.1 `npx tsc --noEmit`, `npm test`, `npm run build`
- [ ] 5.2 Ask price, availability, cancellation and an off-topic question; check the answers and the handoff
