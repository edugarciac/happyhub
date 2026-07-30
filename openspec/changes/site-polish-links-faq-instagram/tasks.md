## 1. Fix footer links

- [ ] 1.1 Replace `scrollToSection` buttons with real `<Link>`s in `src/components/Footer.tsx` ("Inicio" → `/`, "Características" → `/#features`, "Servicios" → `/servicios`)
- [ ] 1.2 Fix "Preguntas frecuentes" → `/como-funciona`
- [ ] 1.3 Fix "Política de cancelación" → `/como-funciona`
- [ ] 1.4 Remove unused `scrollToSection` function

## 2. FAQ accordion DOM content

- [ ] 2.1 Change `como-funciona.tsx` to always render the answer div, toggling visibility via className instead of conditional mount

## 3. Instagram fallback copy

- [ ] 3.1 Update fallback message in `src/pages/index.tsx` to remove "Proximamente" tone

## 4. Verify

- [ ] 4.1 Browser-check footer links from a non-home page (e.g. `/contacto`)
- [ ] 4.2 Browser-check FAQ toggle still works visually and view-source shows answer text
- [ ] 4.3 Browser-check Instagram fallback section on homepage
