## 1. Update Copy

- [x] 1.1 Update the terms and conditions bullet in `Step3CustomerData.tsx` to read "El resto del pago se realizará antes de comenzar el evento."
- [x] 1.2 Update the terms and conditions line in `src/lib/pdf.ts` (`generateContractPDF`) to read "El resto del importe debe abonarse antes de comenzar el evento."
- [x] 1.3 Update `src/pages/mi-reserva/[id].tsx` ("A pagar el día del evento" → "A pagar antes de comenzar el evento")
- [x] 1.4 Update `src/pages/disponibilidad.tsx` ("El resto se abona el día del evento." → "...antes de comenzar el evento.")
- [x] 1.5 Update `src/components/PricingTable.tsx` ("Resto el día del evento" → "Resto antes de comenzar el evento")
- [x] 1.6 Update `src/components/booking/PriceSummary.tsx` ("...el día del evento" → "...antes de comenzar el evento")
- [x] 1.7 Update `src/components/booking/Step4Confirmation.tsx` ("...se abonará el día del evento" → "...se abonará antes de comenzar el evento")
- [x] 1.8 Update `src/lib/whatsapp.ts` WhatsApp confirmation message ("a pagar el día del evento" → "a pagar antes de comenzar el evento")
- [x] 1.9 Update `src/pages/terminos.tsx` ("...antes o el día del evento." → "...antes de comenzar el evento.")
- [x] 1.10 Update `src/pages/como-funciona.tsx` FAQ answer ("...se abona el día del evento." → "...se abona antes de comenzar el evento.") — left the unrelated "¿A qué hora puedo acceder el día del evento?" FAQ question unchanged (refers to arrival time, not payment)

## 2. Verify

- [x] 2.1 Confirm the updated text renders correctly in the Step 3 terms and conditions box
- [x] 2.2 Confirm the updated text appears in the generated contract PDF
- [x] 2.3 Confirm no other client-facing occurrence of "el día del evento" remains for the remaining-balance payment timing (searched full codebase)
