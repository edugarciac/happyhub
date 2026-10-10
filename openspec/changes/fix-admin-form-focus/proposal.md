## Why

En los formularios de festivos y tarifas del panel admin, cada letra hacía perder el foco del campo y no se podía escribir con normalidad.

Causa: `HolidayFormFields` y `PricingFormFields` estaban definidos **dentro** del componente de la página y se usaban como `<HolidayFormFields />`. En cada tecla React crea una función nueva, la trata como otro tipo de componente, desmonta el formulario y lo vuelve a montar, y el campo pierde el foco.

## What Changes

- Festivos y tarifas: se llaman como función (`{renderHolidayFormFields()}`, `{renderPricingFormFields()}`), igual que ya hacían `services` y `event-types`.
- Test `noNestedComponents` que recorre `src/**/*.tsx` y falla si vuelve a aparecer un componente anidado usado como JSX.

## Impact

- `src/pages/admin/holidays.tsx`, `src/pages/admin/pricing.tsx`, test nuevo.
