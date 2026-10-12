## 2. Discount logic

- [x] 2.1 `src/config/promotions.ts` with config, `isOpeningDiscountEligible` and `openingDiscountAmount`
- [x] 2.2 Unit tests (eligible, extras excluded, event after 30/12, request after 18/10, Madrid timezone edge)

## 3. Booking flow

- [x] 3.1 `BookingContext`: `calculateDiscount`; total = base − discount + extras
- [x] 3.2 `PriceSummary`: discount line
- [x] 3.3 `Step3CustomerData`: send `discountAmount`
- [x] 3.4 `webhook-reserva`: server-side eligibility check; pass discount to emails
- [x] 3.5 `emailTemplates`: discount row in customer and admin emails

## 4. Communication

- [x] 4.1 `PricingTable`: promotion notice while active

## 5. Existing requests (manual)

- [ ] 5.1 Run listing SQL; apply −10% on rental in `/admin/reservations` for eligible requests
