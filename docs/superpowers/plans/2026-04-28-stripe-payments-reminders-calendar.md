# Stripe Payments, Reminders & Calendar Delete — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add card payment for paga y señal, remaining balance payment from área privada/admin/email link, n8n email reminders at 30/7/3 days, and integral calendar event deletion.

**Architecture:** DB migration adds payment tracking columns; Stripe Checkout Sessions handle both deposit and remaining payments via a unified API; payment tokens enable email-link payments for non-registered users; n8n cron handles scheduled reminders; Google Calendar API deletes events on admin cancel.

**Tech Stack:** Next.js 14 Pages Router, TypeScript, Neon Postgres (`@neondatabase/serverless`), Stripe SDK (`stripe`), `googleapis`, n8n (cron + Postgres + HTTP nodes)

---

## File Map

| File | Action |
|---|---|
| `src/lib/db.ts` | Modify — add DB migration for new columns + `payment_tokens` table |
| `src/pages/api/create-checkout-session.ts` | Modify — accept `reservationId` param + `type` in metadata |
| `src/pages/api/stripe-webhook.ts` | Modify — handle `type: deposit` and `type: remaining` |
| `src/components/booking/Step3CustomerData.tsx` | Modify — redirect to Stripe when `paymentMethod === 'card'` |
| `src/pages/api/payments/remaining.ts` | Create — unified remaining payment (auth or token) |
| `src/pages/api/payments/token.ts` | Create — internal token generation endpoint |
| `src/pages/pagar/[token].tsx` | Create — public payment page for email links |
| `src/pages/api/user/reservations.ts` | Modify — return `paymentStatus` correctly |
| `src/pages/area-privada.tsx` | Modify — add remaining balance section per reservation |
| `src/pages/api/admin/reservations.ts` | Modify — return `paymentStatus` + `depositPaidAmount` |
| `src/pages/admin/reservations/index.tsx` | Modify — payment status column, generate-link button, cancel-full button |
| `src/pages/api/admin/reservations/[id]/cancel-full.ts` | Create — cancel reservation + delete Google Calendar event |
| `n8n/n8n-nodes/n8n-payment-reminder-cron.json` | Create — n8n cron workflow for payment reminders |

---

## Task 1: DB Migration — Payment columns + payment_tokens table

**Files:**
- Modify: `src/lib/db.ts`

- [ ] **Step 1: Add migration to `ensureUsersTable` / create a standalone `runPaymentsMigration` function**

Add this function at the end of `src/lib/db.ts` (before the final closing brace):

```typescript
// Idempotent migration for payment tracking columns
export async function runPaymentsMigration(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      -- Change deposit_paid from boolean to decimal amount
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='reservations' AND column_name='deposit_paid'
          AND data_type='boolean'
        ) THEN
          ALTER TABLE reservations RENAME COLUMN deposit_paid TO deposit_paid_bool;
          ALTER TABLE reservations ADD COLUMN deposit_paid DECIMAL(10,2) DEFAULT 0;
          UPDATE reservations SET deposit_paid = CASE WHEN deposit_paid_bool THEN deposit_amount ELSE 0 END;
          ALTER TABLE reservations DROP COLUMN deposit_paid_bool;
        END IF;
      END
      $$;

      -- Add deposit_paid as decimal if it doesn't exist yet
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS deposit_paid DECIMAL(10,2) DEFAULT 0;

      -- payment_status: 'pending' | 'pending_deposit' | 'deposit_paid' | 'fully_paid'
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'pending';

      -- Stripe session IDs for idempotency
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS stripe_deposit_session_id VARCHAR(255);
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS stripe_remaining_session_id VARCHAR(255);

      -- google_calendar_event_id already exists but ensure it
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255);

      -- Backfill payment_status from existing data
      UPDATE reservations
      SET payment_status = CASE
        WHEN status = 'cancelled' THEN 'pending'
        WHEN deposit_paid >= total_price AND total_price > 0 THEN 'fully_paid'
        WHEN deposit_paid > 0 THEN 'deposit_paid'
        ELSE 'pending'
      END
      WHERE payment_status = 'pending';

      -- payment_tokens table
      CREATE TABLE IF NOT EXISTS payment_tokens (
        id             SERIAL PRIMARY KEY,
        token          VARCHAR(64) UNIQUE NOT NULL,
        reservation_id INTEGER NOT NULL,
        token_type     VARCHAR(30) NOT NULL DEFAULT 'remaining_payment',
        expires_at     TIMESTAMP NOT NULL,
        used           BOOLEAN DEFAULT false,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_payment_tokens_token ON payment_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_payment_tokens_reservation ON payment_tokens(reservation_id);
    `);
    console.log('✅ Payments migration complete');
  } catch (error) {
    console.error('Error running payments migration:', error);
    throw error;
  } finally {
    client.release();
  }
}
```

- [ ] **Step 2: Call the migration from `src/pages/api/init-db.ts`**

Read `src/pages/api/init-db.ts` first, then add:

```typescript
import { runPaymentsMigration } from '@/lib/db';

// Inside the handler, after existing init logic:
await runPaymentsMigration();
```

- [ ] **Step 3: Run migration manually via the init endpoint**

```bash
# Start dev server first: npm run dev
curl -X POST http://localhost:3000/api/init-db
```

Expected: `{"success": true, ...}` and console shows `✅ Payments migration complete`

- [ ] **Step 4: Verify columns in Neon dashboard or with psql**

```bash
# Verify new columns exist:
curl http://localhost:3000/api/admin/reservations \
  -H "Cookie: next-auth.session-token=<admin-token>"
# Response should include depositPaid and paymentStatus fields (after Step in Task 9)
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/db.ts src/pages/api/init-db.ts
git commit -m "feat: add payment tracking columns and payment_tokens table migration"
```

---

## Task 2: Update `create-checkout-session.ts` — accept reservationId + type

**Files:**
- Modify: `src/pages/api/create-checkout-session.ts`

The current file generates a `reservationId` internally. We need it to accept an existing one and a `type` parameter.

- [ ] **Step 1: Replace the handler with the updated version**

Replace the full content of `src/pages/api/create-checkout-session.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { createCheckoutSession } from '@/lib/stripe';

interface CheckoutRequestBody {
  // Customer data
  name: string;
  email: string;
  phone: string;
  eventType: string;
  message?: string;
  // Booking data
  date: string;
  timeSlot: 'morning' | 'afternoon' | 'night';
  guests: number;
  extras: string[];
  // Pricing
  basePrice: number;
  totalPrice: number;
  depositAmount: number;
  // Payment type
  type: 'deposit' | 'remaining';
  // Reservation ID (required — caller must provide it)
  reservationId: string;
}

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Mañana (11:00-14:30)',
  afternoon: 'Tarde (16:30-20:30)',
  night: 'Noche (22:00-02:00)',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as CheckoutRequestBody;

    if (!body.reservationId) {
      return res.status(400).json({ error: 'reservationId es obligatorio' });
    }

    if (!body.depositAmount || body.depositAmount <= 0) {
      return res.status(400).json({ error: 'El importe no es válido' });
    }

    const eventDate = new Date(body.date);
    const formattedDate = eventDate.toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    const isDeposit = body.type === 'deposit';
    const productName = isDeposit
      ? 'Paga y señal — HappyHub'
      : 'Pago restante — HappyHub';
    const description = `${formattedDate} — ${TIME_SLOT_LABELS[body.timeSlot] || body.timeSlot} — ${body.guests} invitados`;

    const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.host}`;

    const session = await createCheckoutSession({
      lineItems: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: productName,
              description,
            },
            unit_amount: Math.round(body.depositAmount * 100),
          },
          quantity: 1,
        },
      ],
      successUrl: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&reservation_id=${body.reservationId}`,
      cancelUrl: `${baseUrl}/booking/cancel?reservation_id=${body.reservationId}`,
      customerEmail: body.email,
      metadata: {
        reservationId: body.reservationId,
        type: body.type || 'deposit',
        name: body.name || '',
        email: body.email || '',
        phone: body.phone || '',
        eventType: body.eventType || '',
        date: body.date || '',
        timeSlot: body.timeSlot || '',
        guests: (body.guests || 0).toString(),
        extras: (body.extras || []).join(','),
        basePrice: (body.basePrice || 0).toString(),
        totalPrice: (body.totalPrice || 0).toString(),
        depositAmount: (body.depositAmount || 0).toString(),
        message: body.message || '',
      },
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: error.message || 'Error al crear la sesión de pago' });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/edu/claude/happyhub && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to this file.

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/create-checkout-session.ts
git commit -m "feat: update checkout session to accept reservationId and payment type"
```

---

## Task 3: Update `stripe-webhook.ts` — track deposit + remaining in DB

**Files:**
- Modify: `src/pages/api/stripe-webhook.ts`

- [ ] **Step 1: Update `handleCheckoutComplete` to update DB payment status**

Add the import at the top of `src/pages/api/stripe-webhook.ts` (after existing imports):

```typescript
import { query } from '@/lib/db';
```

- [ ] **Step 2: Replace the `handleCheckoutComplete` function**

Find and replace the existing `handleCheckoutComplete` function (lines ~114-196) with:

```typescript
async function handleCheckoutComplete(session: Stripe.Checkout.Session, host?: string | string[]) {
  console.log('Procesando checkout completado:', {
    id: session.id,
    paymentStatus: session.payment_status,
    metadata: session.metadata,
  });

  const metadata = session.metadata;
  if (!metadata?.reservationId) {
    console.log('No reservation metadata found in session');
    return;
  }

  const reservationId = metadata.reservationId;
  const paymentType = metadata.type || 'deposit'; // 'deposit' | 'remaining'
  const amount = session.amount_total ? session.amount_total / 100 : 0;

  // Update DB
  try {
    if (paymentType === 'deposit') {
      await query(
        `UPDATE reservations
         SET deposit_paid = $1,
             payment_status = 'deposit_paid',
             stripe_deposit_session_id = $2,
             updated_at = NOW()
         WHERE reservation_id = $3
            OR id::text = $3`,
        [amount, session.id, reservationId]
      );
    } else if (paymentType === 'remaining') {
      await query(
        `UPDATE reservations
         SET deposit_paid = total_price,
             payment_status = 'fully_paid',
             stripe_remaining_session_id = $1,
             updated_at = NOW()
         WHERE reservation_id = $2
            OR id::text = $2`,
        [session.id, reservationId]
      );
      // Mark payment token as used
      await query(
        `UPDATE payment_tokens SET used = true
         WHERE reservation_id = (
           SELECT id FROM reservations
           WHERE reservation_id = $1 OR id::text = $1
           LIMIT 1
         ) AND used = false`,
        [reservationId]
      );
    }
    console.log(`✅ DB updated for ${paymentType} payment, reservation ${reservationId}`);
  } catch (dbError) {
    console.error('Error updating DB after payment:', dbError);
    // Don't fail the webhook — Stripe needs 200
  }

  const baseUrl = process.env.NEXTAUTH_URL || `https://${Array.isArray(host) ? host[0] : host}`;
  const contractUrl = `${baseUrl}/api/contracts/${reservationId}`;

  // Send WhatsApp confirmation to customer
  if (metadata.phone) {
    try {
      await sendReservationConfirmation({
        phone: metadata.phone,
        name: metadata.name || 'Cliente',
        date: metadata.date || '',
        timeSlot: metadata.timeSlot || '',
        guests: parseInt(metadata.guests || '0'),
        totalPrice: parseFloat(metadata.totalPrice || '0'),
        depositAmount: parseFloat(metadata.depositAmount || '0'),
        reservationId,
        contractUrl,
      });
    } catch (error) {
      console.error('Error sending WhatsApp confirmation:', error);
    }
  }

  // Notify n8n
  if (process.env.N8N_WEBHOOK_URL) {
    try {
      const axios = require('axios');
      await axios.post(process.env.N8N_WEBHOOK_URL, {
        event: paymentType === 'deposit' ? 'checkout_complete' : 'remaining_payment_complete',
        reservationId,
        sessionId: session.id,
        customerEmail: session.customer_email || metadata.email,
        customerPhone: metadata.phone,
        customerName: metadata.name,
        date: metadata.date,
        timeSlot: metadata.timeSlot,
        guests: parseInt(metadata.guests || '0'),
        eventType: metadata.eventType,
        extras: metadata.extras ? metadata.extras.split(',') : [],
        basePrice: parseFloat(metadata.basePrice || '0'),
        totalPrice: parseFloat(metadata.totalPrice || '0'),
        depositAmount: parseFloat(metadata.depositAmount || '0'),
        amount,
        contractUrl,
        paymentStatus: session.payment_status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error notificando a n8n:', error);
    }
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/edu/claude/happyhub && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/stripe-webhook.ts
git commit -m "feat: stripe webhook updates DB payment_status on deposit and remaining payments"
```

---

## Task 4: Update `Step3CustomerData.tsx` — redirect to Stripe when card selected

**Files:**
- Modify: `src/components/booking/Step3CustomerData.tsx`

- [ ] **Step 1: Find the success block after `nextStep()` call (line ~164-176)**

Read `src/components/booking/Step3CustomerData.tsx` lines 155–185 to find the block:

```typescript
// Success! Move to next step (confirmation)
dispatch({ type: 'SET_RESERVATION_ID', id: result.reservationId });
...
nextStep();
```

- [ ] **Step 2: Replace that success block with card-aware logic**

Replace the success block (starting from `// Success! Move to next step`) with:

```typescript
      // Success! reservation created
      const reservationId = result.reservationId;
      dispatch({ type: 'SET_RESERVATION_ID', id: reservationId });

      if (result.emailWarning) {
        dispatch({ type: 'SET_EMAIL_WARNING', warning: result.emailWarning });
      }

      // If card payment: redirect to Stripe for deposit
      if (data.paymentMethod === 'card') {
        const depositAmount = calculateDepositAmount();
        if (typeof depositAmount !== 'number' || depositAmount <= 0) {
          setSubmitError('Error al calcular el importe de la paga y señal');
          setIsSubmitting(false);
          return;
        }

        try {
          const checkoutRes = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reservationId,
              type: 'deposit',
              name: data.name,
              email: data.email,
              phone: data.phone,
              eventType: data.eventType,
              message: data.message || '',
              date: dateStr,
              timeSlot: state.timeSlot,
              guests: state.guests,
              extras: state.selectedExtras || [],
              basePrice: state.basePrice,
              totalPrice: calculateTotalPrice(),
              depositAmount,
            }),
          });

          const checkoutData = await checkoutRes.json();

          if (!checkoutRes.ok || !checkoutData.url) {
            setSubmitError('Error al iniciar el pago con tarjeta. Inténtalo de nuevo.');
            setIsSubmitting(false);
            return;
          }

          // Redirect to Stripe Checkout
          window.location.href = checkoutData.url;
          return;
        } catch (stripeError: any) {
          setSubmitError('No se pudo conectar con el sistema de pago. Inténtalo de nuevo.');
          setIsSubmitting(false);
          return;
        }
      }

      // Non-card payment: advance to confirmation step
      nextStep();
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/edu/claude/happyhub && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Manual smoke test**

1. Start dev server: `npm run dev`
2. Go to `/reservas`, complete Steps 1–3 selecting "Tarjeta" as method
3. Submit — should redirect to Stripe Checkout (test mode) showing the deposit amount
4. Use test card `4242 4242 4242 4242`, any future date, any CVC
5. Should redirect to `/booking/success`

- [ ] **Step 5: Commit**

```bash
git add src/components/booking/Step3CustomerData.tsx
git commit -m "feat: redirect to Stripe Checkout when card payment selected for deposit"
```

---

## Task 5: Create `POST /api/payments/remaining`

**Files:**
- Create: `src/pages/api/payments/remaining.ts`

- [ ] **Step 1: Create the file**

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { createCheckoutSession } from '@/lib/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reservationId, token } = req.body as { reservationId?: number; token?: string };

  if (!reservationId && !token) {
    return res.status(400).json({ error: 'Se requiere reservationId o token' });
  }

  try {
    let reservation: any;

    if (token) {
      // Token-based access (email link, non-registered user)
      const paymentToken = await queryOne(
        `SELECT pt.*, r.id as res_id, r.total_price, r.deposit_paid,
                r.payment_status, r.event_date, r.time_slot, r.event_type,
                r.guests, r.deposit_amount,
                u.name as customer_name, u.email as customer_email, u.phone as customer_phone
         FROM payment_tokens pt
         JOIN reservations r ON pt.reservation_id = r.id
         LEFT JOIN users u ON r.user_id = u.id
         WHERE pt.token = $1 AND pt.used = false AND pt.expires_at > NOW()`,
        [token]
      );

      if (!paymentToken) {
        return res.status(404).json({ error: 'Enlace de pago no válido o caducado' });
      }
      reservation = {
        id: paymentToken.res_id,
        total_price: paymentToken.total_price,
        deposit_paid: paymentToken.deposit_paid,
        payment_status: paymentToken.payment_status,
        event_date: paymentToken.event_date,
        time_slot: paymentToken.time_slot,
        event_type: paymentToken.event_type,
        guests: paymentToken.guests,
        deposit_amount: paymentToken.deposit_amount,
        name: paymentToken.customer_name,
        email: paymentToken.customer_email,
        phone: paymentToken.customer_phone,
      };
    } else {
      // Auth-based access (logged-in user from área privada)
      const session = await getServerSession(req, res, authOptions);
      if (!session?.user?.email) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      reservation = await queryOne(
        `SELECT r.id, r.total_price, r.deposit_paid, r.payment_status,
                r.event_date, r.time_slot, r.event_type, r.guests, r.deposit_amount,
                u.name, u.email, u.phone
         FROM reservations r
         JOIN users u ON r.user_id = u.id
         WHERE r.id = $1 AND u.email = $2`,
        [reservationId, session.user.email]
      );

      if (!reservation) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }
    }

    const totalPrice = parseFloat(reservation.total_price || '0');
    const depositPaid = parseFloat(reservation.deposit_paid || '0');
    const remaining = totalPrice - depositPaid;

    if (remaining <= 0) {
      return res.status(400).json({ error: 'Esta reserva ya está totalmente pagada' });
    }

    if (reservation.payment_status === 'fully_paid') {
      return res.status(400).json({ error: 'Esta reserva ya está totalmente pagada' });
    }

    const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.host}`;
    const reservationIdStr = reservation.id.toString();

    const stripeSession = await createCheckoutSession({
      lineItems: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Pago restante — HappyHub',
              description: `Evento ${new Date(reservation.event_date).toLocaleDateString('es-ES')} — ${reservation.time_slot}`,
            },
            unit_amount: Math.round(remaining * 100),
          },
          quantity: 1,
        },
      ],
      successUrl: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&reservation_id=${reservationIdStr}&type=remaining`,
      cancelUrl: `${baseUrl}/area-privada`,
      customerEmail: reservation.email,
      metadata: {
        reservationId: reservationIdStr,
        type: 'remaining',
        name: reservation.name || '',
        email: reservation.email || '',
        phone: reservation.phone || '',
        eventType: reservation.event_type || '',
        date: reservation.event_date ? reservation.event_date.toString() : '',
        timeSlot: reservation.time_slot || '',
        guests: (reservation.guests || 0).toString(),
        extras: '',
        basePrice: (totalPrice).toString(),
        totalPrice: (totalPrice).toString(),
        depositAmount: (remaining).toString(),
        message: '',
      },
    });

    // Save session ID to reservation
    await queryOne(
      `UPDATE reservations SET stripe_remaining_session_id = $1, updated_at = NOW() WHERE id = $2 RETURNING id`,
      [stripeSession.id, reservation.id]
    );

    return res.status(200).json({ url: stripeSession.url });
  } catch (error: any) {
    console.error('Error creating remaining payment session:', error);
    return res.status(500).json({ error: error.message || 'Error al crear sesión de pago' });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/edu/claude/happyhub && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/payments/remaining.ts
git commit -m "feat: add POST /api/payments/remaining for auth and token-based remaining payment"
```

---

## Task 6: Create `POST /api/payments/token`

**Files:**
- Create: `src/pages/api/payments/token.ts`

This endpoint is called by n8n (internal) to generate a payment token for email links.

- [ ] **Step 1: Create the file**

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '@/lib/db';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Protect with internal secret (called by n8n)
  const internalSecret = process.env.INTERNAL_API_SECRET;
  if (internalSecret) {
    const provided = req.headers['x-internal-secret'];
    if (provided !== internalSecret) {
      return res.status(401).json({ error: 'No autorizado' });
    }
  }

  const { reservationId } = req.body as { reservationId: number };

  if (!reservationId) {
    return res.status(400).json({ error: 'reservationId es obligatorio' });
  }

  try {
    const reservation = await queryOne(
      `SELECT id, total_price, deposit_paid, payment_status
       FROM reservations WHERE id = $1`,
      [reservationId]
    );

    if (!reservation) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const remaining = parseFloat(reservation.total_price || '0') - parseFloat(reservation.deposit_paid || '0');
    if (remaining <= 0) {
      return res.status(400).json({ error: 'La reserva ya está totalmente pagada' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    await query(
      `INSERT INTO payment_tokens (token, reservation_id, token_type, expires_at)
       VALUES ($1, $2, 'remaining_payment', $3)`,
      [token, reservationId, expiresAt]
    );

    const baseUrl = process.env.NEXTAUTH_URL || 'https://happyhub.es';
    const url = `${baseUrl}/pagar/${token}`;

    return res.status(200).json({ token, url, expiresAt });
  } catch (error: any) {
    console.error('Error creating payment token:', error);
    return res.status(500).json({ error: error.message || 'Error al crear el token' });
  }
}
```

- [ ] **Step 2: Add `INTERNAL_API_SECRET` to `.env.local` (development)**

```bash
echo "INTERNAL_API_SECRET=dev-internal-secret-$(date +%s)" >> /Users/edu/claude/happyhub/.env.local
```

Add the same variable in Vercel environment settings (production).

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/edu/claude/happyhub && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Test the endpoint**

```bash
curl -X POST http://localhost:3000/api/payments/token \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: dev-internal-secret-$(cat .env.local | grep INTERNAL | cut -d= -f2)" \
  -d '{"reservationId": 1}'
```

Expected (if reservation 1 exists with deposit_paid < total_price):
```json
{"token":"<64-char-hex>","url":"http://localhost:3000/pagar/<token>","expiresAt":"..."}
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/payments/token.ts
git commit -m "feat: add POST /api/payments/token for n8n-triggered payment link generation"
```

---

## Task 7: Create public payment page `/pagar/[token].tsx`

**Files:**
- Create: `src/pages/pagar/[token].tsx`

- [ ] **Step 1: Create the page**

```typescript
import { useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { queryOne } from '@/lib/db';
import { CreditCard, Calendar, Users, AlertCircle, CheckCircle } from 'lucide-react';

interface PageProps {
  valid: boolean;
  error?: string;
  reservation?: {
    id: number;
    eventDate: string;
    timeSlot: string;
    eventType: string;
    guests: number;
    totalPrice: number;
    depositPaid: number;
    remaining: number;
    customerName: string;
  };
  token: string;
}

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Mañana (11:00-14:30)',
  afternoon: 'Tarde (16:30-20:30)',
  night: 'Noche (22:00-02:00)',
};

export default function PagarPage({ valid, error, reservation, token }: PageProps) {
  const [loading, setLoading] = useState(false);
  const [payError, setPayError] = useState('');

  const handlePay = async () => {
    setLoading(true);
    setPayError('');
    try {
      const res = await fetch('/api/payments/remaining', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setPayError(data.error || 'Error al iniciar el pago');
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setPayError('No se pudo conectar con el servidor');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Pago restante — HappyHub</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8">
          {!valid ? (
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Enlace no válido</h1>
              <p className="text-gray-600 mb-6">
                {error || 'Este enlace de pago ha caducado o ya ha sido utilizado.'}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Si necesitas ayuda, contacta con nosotros:
              </p>
              <a
                href="https://wa.me/34624645517"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition"
              >
                Contactar por WhatsApp
              </a>
            </div>
          ) : reservation ? (
            <div>
              <div className="text-center mb-6">
                <CreditCard className="w-12 h-12 text-primary-600 mx-auto mb-3" />
                <h1 className="text-2xl font-bold text-gray-900">Completa tu pago</h1>
                <p className="text-gray-600 mt-1">Hola, {reservation.customerName}</p>
              </div>

              {/* Event summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{new Date(reservation.eventDate).toLocaleDateString('es-ES', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                  })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>{reservation.guests} invitados · {reservation.eventType}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{TIME_SLOT_LABELS[reservation.timeSlot] || reservation.timeSlot}</span>
                </div>
              </div>

              {/* Payment breakdown */}
              <div className="border border-gray-200 rounded-xl p-4 mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Total del evento</span>
                  <span>{reservation.totalPrice.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm text-green-600 mb-3">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Paga y señal abonada
                  </span>
                  <span>−{reservation.depositPaid.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-lg border-t border-gray-100 pt-3">
                  <span>Restante a pagar</span>
                  <span>{reservation.remaining.toFixed(2)} €</span>
                </div>
              </div>

              {payError && (
                <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-4">
                  {payError}
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white rounded-xl font-semibold text-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                <CreditCard className="w-5 h-5" />
                {loading ? 'Redirigiendo...' : `Pagar ${reservation.remaining.toFixed(2)} € con tarjeta`}
              </button>

              <p className="text-center text-xs text-gray-400 mt-4">
                Pago seguro procesado por Stripe
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { token } = context.params as { token: string };

  try {
    const paymentToken = await queryOne(
      `SELECT pt.reservation_id, pt.used, pt.expires_at,
              r.event_date, r.time_slot, r.event_type, r.guests,
              r.total_price, r.deposit_paid, r.payment_status,
              u.name as customer_name
       FROM payment_tokens pt
       JOIN reservations r ON pt.reservation_id = r.id
       LEFT JOIN users u ON r.user_id = u.id
       WHERE pt.token = $1`,
      [token]
    );

    if (!paymentToken) {
      return { props: { valid: false, error: 'Enlace no encontrado', token } };
    }

    if (paymentToken.used) {
      return { props: { valid: false, error: 'Este enlace ya fue utilizado', token } };
    }

    if (new Date(paymentToken.expires_at) < new Date()) {
      return { props: { valid: false, error: 'Este enlace ha caducado (72h de validez)', token } };
    }

    if (paymentToken.payment_status === 'fully_paid') {
      return { props: { valid: false, error: 'Esta reserva ya está totalmente pagada', token } };
    }

    const totalPrice = parseFloat(paymentToken.total_price || '0');
    const depositPaid = parseFloat(paymentToken.deposit_paid || '0');

    return {
      props: {
        valid: true,
        token,
        reservation: {
          id: paymentToken.reservation_id,
          eventDate: paymentToken.event_date.toISOString(),
          timeSlot: paymentToken.time_slot,
          eventType: paymentToken.event_type || '',
          guests: paymentToken.guests || 0,
          totalPrice,
          depositPaid,
          remaining: totalPrice - depositPaid,
          customerName: paymentToken.customer_name || 'Cliente',
        },
      },
    };
  } catch (error) {
    console.error('Error loading payment token page:', error);
    return { props: { valid: false, error: 'Error del servidor', token } };
  }
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/edu/claude/happyhub && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Test the page**

1. Generate a token using Task 6's curl command
2. Visit `http://localhost:3000/pagar/<token>` in browser
3. Should show event summary + "Pagar X€ con tarjeta" button
4. Test with expired/invalid token: visit `http://localhost:3000/pagar/invalid-token` — should show error message

- [ ] **Step 4: Commit**

```bash
git add src/pages/pagar/[token].tsx
git commit -m "feat: add public payment page /pagar/[token] for email-link payments"
```

---

## Task 8: Update `user/reservations.ts` — return paymentStatus correctly

**Files:**
- Modify: `src/pages/api/user/reservations.ts`

- [ ] **Step 1: Update the DB query and mapping**

The current query already fetches `deposit_paid` and `deposit_amount`. Update the mapping:

Find and replace the `reservations` mapping inside the handler. Replace the whole `dbResult.rows.map` block:

```typescript
    const reservations = dbResult.rows.map((r: any) => ({
      id: r.id.toString(),
      reservationId: `HH-${r.id}`,
      date: r.event_date,
      timeSlot: r.time_slot,
      eventType: r.event_type || '',
      guests: r.guests || 0,
      extras: [],
      basePrice: parseFloat(r.total_price || '0'),
      totalPrice: parseFloat(r.total_price || '0'),
      depositAmount: parseFloat(r.deposit_amount || '0'),
      depositPaid: parseFloat(r.deposit_paid || '0'),
      paymentStatus: r.payment_status || 'pending',
      status: r.status || 'pending',
      message: r.notes || '',
      createdAt: r.created_at,
    }));
```

Also update the SELECT query to include `payment_status`:

```typescript
    const dbResult = await query(
      `SELECT r.id, r.event_date, r.time_slot, r.event_type, r.guests,
              r.total_price, r.deposit_paid, r.deposit_amount, r.payment_status,
              r.status, r.notes, r.google_calendar_event_id, r.created_at
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       WHERE u.email = $1
       ORDER BY r.event_date DESC`,
      [userEmail]
    );
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/edu/claude/happyhub && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/user/reservations.ts
git commit -m "feat: return paymentStatus and depositPaid as decimal in user reservations API"
```

---

## Task 9: Update `area-privada.tsx` — add remaining balance payment button

**Files:**
- Modify: `src/pages/area-privada.tsx`

- [ ] **Step 1: Update the `Reservation` interface**

Find the `Reservation` interface (around line 14) and update `paymentStatus` and `depositPaid`:

```typescript
interface Reservation {
  id: string;
  reservationId: string;
  date: string;
  timeSlot: string;
  eventType: EventType | string;
  guests: number;
  extras: string[];
  basePrice: number;
  totalPrice: number;
  depositAmount: number;
  depositPaid: number;        // decimal amount (updated from boolean)
  paymentStatus: string;      // 'pending' | 'pending_deposit' | 'deposit_paid' | 'fully_paid'
  status: string;
  message: string;
  createdAt: string;
}
```

- [ ] **Step 2: Add state for payment loading**

Find the existing state declarations (around line 100) and add after `expandedReservation`:

```typescript
const [payingRemainingId, setPayingRemainingId] = useState<string | null>(null);
const [payRemainingError, setPayRemainingError] = useState<string>('');
```

- [ ] **Step 3: Add `handlePayRemaining` function**

Add this function after `fetchReservations` (around line 180):

```typescript
const handlePayRemaining = async (reservationId: string) => {
  setPayingRemainingId(reservationId);
  setPayRemainingError('');
  try {
    const res = await fetch('/api/payments/remaining', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId: parseInt(reservationId) }),
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      setPayRemainingError(data.error || 'Error al iniciar el pago');
      setPayingRemainingId(null);
      return;
    }
    window.location.href = data.url;
  } catch {
    setPayRemainingError('No se pudo conectar con el servidor');
    setPayingRemainingId(null);
  }
};
```

- [ ] **Step 4: Add "Pagar restante" section in the reservation card**

Find the expanded reservation section. Look for the line that renders `formatCurrency(reservation.depositPaid)` (around line 744). Add AFTER the `depositPaid` row and before the extras row:

```tsx
{/* Remaining payment section */}
{reservation.paymentStatus === 'deposit_paid' && (
  <div className="col-span-2 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-amber-900">Pago restante pendiente</p>
        <p className="text-lg font-bold text-amber-800">
          {formatCurrency(reservation.totalPrice - reservation.depositPaid)}
        </p>
      </div>
      <button
        onClick={() => handlePayRemaining(reservation.id)}
        disabled={payingRemainingId === reservation.id}
        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition disabled:opacity-50"
      >
        {payingRemainingId === reservation.id ? 'Redirigiendo...' : 'Pagar ahora →'}
      </button>
    </div>
    {payRemainingError && (
      <p className="text-red-600 text-xs mt-2">{payRemainingError}</p>
    )}
  </div>
)}
{reservation.paymentStatus === 'fully_paid' && (
  <div className="col-span-2 mt-2">
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
      ✓ Pago completo
    </span>
  </div>
)}
```

- [ ] **Step 5: Add CreditCard import to lucide-react imports**

Find the lucide-react import line and add `CreditCard` if not already there.

- [ ] **Step 6: Verify TypeScript compiles and test**

```bash
cd /Users/edu/claude/happyhub && npx tsc --noEmit 2>&1 | head -30
```

Log in as a client with a reservation in `deposit_paid` status and verify the payment block appears.

- [ ] **Step 7: Commit**

```bash
git add src/pages/area-privada.tsx
git commit -m "feat: add remaining balance payment button in área privada"
```

---

## Task 10: Update admin reservations list — payment status + generate payment link

**Files:**
- Modify: `src/pages/api/admin/reservations.ts`
- Modify: `src/pages/admin/reservations/index.tsx`

### Part A: Update admin reservations API

- [ ] **Step 1: Update the query and mapping in `api/admin/reservations.ts`**

Find the SELECT query (line ~69) and add `r.payment_status` to the SELECT:

```typescript
    const result = await query(
      `SELECT r.id, r.event_type, r.event_date, r.time_slot,
              r.guests, r.total_price, r.deposit_amount, r.deposit_paid,
              r.payment_status,
              r.status, r.notes, r.created_at, r.updated_at,
              r.rejection_reason, r.cancellation_reason,
              r.admin_approved_by, r.approved_at,
              u.name, u.email, u.phone
       FROM reservations r
       LEFT JOIN users u ON r.user_id = u.id
       ${whereClause}
       ORDER BY r.event_date DESC, r.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
```

Update the mapping (line ~84):

```typescript
    const reservations = result.rows.map((r: any) => ({
      id: r.id,
      name: r.name || '',
      email: r.email || '',
      phone: r.phone || '',
      eventType: r.event_type || '',
      eventDate: r.event_date,
      timeSlot: r.time_slot,
      guests: r.guests || 0,
      totalPrice: parseFloat(r.total_price || '0'),
      depositAmount: parseFloat(r.deposit_amount || '0'),
      depositPaid: parseFloat(r.deposit_paid || '0'),   // decimal now
      paymentStatus: r.payment_status || 'pending',
      status: r.status || 'pending',
      notes: r.notes || '',
      rejectionReason: r.rejection_reason || '',
      cancellationReason: r.cancellation_reason || '',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
```

### Part B: Update admin reservations UI

- [ ] **Step 2: Update `Reservation` interface in `admin/reservations/index.tsx`**

Find the `Reservation` interface (around line 17) and update:

```typescript
interface Reservation {
  id: number;
  name: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  timeSlot: string;
  guests: number;
  totalPrice: number;
  depositAmount: number;
  depositPaid: number;        // was boolean, now decimal
  paymentStatus: string;      // new field
  status: ReservationStatus;
  notes: string;
  rejectionReason: string;
  cancellationReason: string;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 3: Add payment status badge + "Generar enlace" button in table**

Find the price cell (around line 294):

```tsx
<td className="px-4 py-3 whitespace-nowrap">
  <div className="text-sm font-medium text-gray-900">{r.totalPrice} EUR</div>
  <div className="text-xs text-green-600">Señal: {r.depositAmount} EUR</div>
</td>
```

Replace with:

```tsx
<td className="px-4 py-3 whitespace-nowrap">
  <div className="text-sm font-medium text-gray-900">{r.totalPrice} EUR</div>
  <div className="text-xs text-gray-500">Señal: {r.depositAmount} EUR</div>
  <div className={`text-xs mt-1 font-medium ${
    r.paymentStatus === 'fully_paid' ? 'text-green-600' :
    r.paymentStatus === 'deposit_paid' ? 'text-amber-600' :
    r.paymentStatus === 'pending_deposit' ? 'text-blue-600' :
    'text-gray-400'
  }`}>
    {r.paymentStatus === 'fully_paid' ? '✓ Pagado completo' :
     r.paymentStatus === 'deposit_paid' ? 'Señal pagada' :
     r.paymentStatus === 'pending_deposit' ? 'Esperando señal' :
     'Sin pago'}
  </div>
</td>
```

- [ ] **Step 4: Add state for payment link generation**

Find the state declarations (around line 57) and add:

```typescript
const [generatingLinkFor, setGeneratingLinkFor] = useState<number | null>(null);
const [paymentLinkModal, setPaymentLinkModal] = useState<{ reservationId: number; url: string } | null>(null);
```

- [ ] **Step 5: Add `handleGeneratePaymentLink` function**

Add after the existing fetch functions:

```typescript
const handleGeneratePaymentLink = async (reservationId: number) => {
  setGeneratingLinkFor(reservationId);
  try {
    const internalSecret = process.env.NEXT_PUBLIC_INTERNAL_SECRET || '';
    const res = await fetch('/api/payments/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': internalSecret,
      },
      body: JSON.stringify({ reservationId }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Error al generar enlace');
      return;
    }
    setPaymentLinkModal({ reservationId, url: data.url });
  } catch {
    alert('No se pudo generar el enlace de pago');
  } finally {
    setGeneratingLinkFor(null);
  }
};
```

**Note:** The `INTERNAL_API_SECRET` should not be exposed to the client. Instead, create a separate admin endpoint that wraps the token generation:

Create `src/pages/api/admin/reservations/[id]/payment-link.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne, query } from '@/lib/db';
import { verifyAdminSession } from '@/utils/adminAuth';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = await verifyAdminSession(req, res);
  if (!admin) return res.status(401).json({ error: 'No autorizado' });

  const { id } = req.query;
  const reservationId = parseInt(id as string);

  const reservation = await queryOne(
    'SELECT id, total_price, deposit_paid FROM reservations WHERE id = $1',
    [reservationId]
  );

  if (!reservation) return res.status(404).json({ error: 'Reserva no encontrada' });

  const remaining = parseFloat(reservation.total_price) - parseFloat(reservation.deposit_paid);
  if (remaining <= 0) return res.status(400).json({ error: 'Reserva ya pagada completamente' });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

  await query(
    `INSERT INTO payment_tokens (token, reservation_id, token_type, expires_at)
     VALUES ($1, $2, 'remaining_payment', $3)`,
    [token, reservationId, expiresAt]
  );

  const baseUrl = process.env.NEXTAUTH_URL || 'https://happyhub.es';
  const url = `${baseUrl}/pagar/${token}`;

  return res.status(200).json({ token, url });
}
```

Update `handleGeneratePaymentLink` to use this admin endpoint:

```typescript
const handleGeneratePaymentLink = async (reservationId: number) => {
  setGeneratingLinkFor(reservationId);
  try {
    const res = await fetch(`/api/admin/reservations/${reservationId}/payment-link`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Error al generar enlace');
      return;
    }
    setPaymentLinkModal({ reservationId, url: data.url });
  } catch {
    alert('No se pudo generar el enlace de pago');
  } finally {
    setGeneratingLinkFor(null);
  }
};
```

- [ ] **Step 6: Add "Generar enlace pago" button in acciones column**

Find the acciones column (around line 319) and add the button before the edit button:

```tsx
{r.paymentStatus === 'deposit_paid' && (
  <button
    onClick={() => handleGeneratePaymentLink(r.id)}
    disabled={generatingLinkFor === r.id}
    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
    title="Generar enlace de pago"
  >
    <CreditCard className="w-4 h-4" />
  </button>
)}
```

Add `CreditCard` to the lucide-react import.

- [ ] **Step 7: Add payment link modal**

Add before the closing `</AdminLayout>` tag:

```tsx
{/* Payment link modal */}
{paymentLinkModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Enlace de pago generado</h3>
      <p className="text-sm text-gray-600 mb-4">
        Copia este enlace y envíaselo al cliente. Válido 72 horas.
      </p>
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
        <span className="text-xs text-gray-700 flex-1 break-all font-mono">{paymentLinkModal.url}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(paymentLinkModal.url);
          }}
          className="shrink-0 px-3 py-1 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition"
        >
          Copiar
        </button>
      </div>
      <button
        onClick={() => setPaymentLinkModal(null)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
      >
        Cerrar
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 8: Verify TypeScript compiles**

```bash
cd /Users/edu/claude/happyhub && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 9: Commit**

```bash
git add src/pages/api/admin/reservations.ts src/pages/admin/reservations/index.tsx src/pages/api/admin/reservations/[id]/payment-link.ts
git commit -m "feat: payment status in admin reservations + generate payment link button"
```

---

## Task 11: Create `DELETE /api/admin/reservations/[id]/cancel-full.ts`

**Files:**
- Create: `src/pages/api/admin/reservations/[id]/cancel-full.ts`

- [ ] **Step 1: Create the endpoint**

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne, query } from '@/lib/db';
import { verifyAdminSession } from '@/utils/adminAuth';
import { google } from 'googleapis';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await verifyAdminSession(req, res);
  if (!admin) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { id } = req.query;
  const reservationId = parseInt(id as string);

  if (!reservationId || isNaN(reservationId)) {
    return res.status(400).json({ error: 'ID de reserva inválido' });
  }

  try {
    const reservation = await queryOne(
      `SELECT r.id, r.status, r.google_calendar_event_id,
              u.name, u.email, u.phone, r.event_date, r.time_slot
       FROM reservations r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [reservationId]
    );

    if (!reservation) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ error: 'La reserva ya está cancelada' });
    }

    // 1. Delete from Google Calendar (if event exists)
    if (reservation.google_calendar_event_id) {
      try {
        const { GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_CALENDAR_ID } = process.env;

        if (GOOGLE_CLIENT_EMAIL && GOOGLE_PRIVATE_KEY && GOOGLE_CALENDAR_ID) {
          const auth = new google.auth.GoogleAuth({
            credentials: {
              client_email: GOOGLE_CLIENT_EMAIL,
              private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/calendar'],
          });
          const calendar = google.calendar({ version: 'v3', auth });
          await calendar.events.delete({
            calendarId: GOOGLE_CALENDAR_ID,
            eventId: reservation.google_calendar_event_id,
          });
          console.log(`✅ Google Calendar event ${reservation.google_calendar_event_id} deleted`);
        }
      } catch (calendarError: any) {
        if (calendarError?.code === 404 || calendarError?.status === 404) {
          console.log('Calendar event not found (already deleted), continuing');
        } else {
          console.error('Error deleting calendar event:', calendarError);
          // Non-fatal: continue with DB cancellation
        }
      }
    }

    // 2. Cancel reservation in DB
    await query(
      `UPDATE reservations
       SET status = 'cancelled',
           google_calendar_event_id = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [reservationId]
    );

    // 3. Notify n8n (non-blocking)
    if (process.env.N8N_WEBHOOK_URL) {
      try {
        await axios.post(process.env.N8N_WEBHOOK_URL, {
          event: 'reservation_cancelled_by_admin',
          reservationId,
          customerName: reservation.name,
          customerEmail: reservation.email,
          customerPhone: reservation.phone,
          eventDate: reservation.event_date,
          timeSlot: reservation.time_slot,
          cancelledBy: admin.email,
          timestamp: new Date().toISOString(),
        }, { timeout: 5000 });
      } catch (n8nError) {
        console.error('n8n notification failed (non-fatal):', n8nError);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Reserva cancelada y eliminada del calendario',
    });
  } catch (error: any) {
    console.error('Error in cancel-full:', error);
    return res.status(500).json({ error: error.message || 'Error al cancelar la reserva' });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/edu/claude/happyhub && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Test the endpoint**

```bash
# Replace <session-cookie> with a valid admin session cookie
curl -X DELETE http://localhost:3000/api/admin/reservations/1/cancel-full \
  -H "Cookie: next-auth.session-token=<session-cookie>"
```

Expected: `{"success":true,"message":"Reserva cancelada y eliminada del calendario"}`

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/admin/reservations/[id]/cancel-full.ts
git commit -m "feat: add cancel-full endpoint that cancels reservation and deletes Google Calendar event"
```

---

## Task 12: Add cancel-full button to admin reservations UI

**Files:**
- Modify: `src/pages/admin/reservations/index.tsx`

- [ ] **Step 1: Add state for cancel-full modal**

Add to the state declarations:

```typescript
const [cancelFullModal, setCancelFullModal] = useState<Reservation | null>(null);
const [cancelFullLoading, setCancelFullLoading] = useState(false);
```

- [ ] **Step 2: Add `handleCancelFull` function**

Add alongside the other handlers:

```typescript
const handleCancelFull = async () => {
  if (!cancelFullModal) return;
  setCancelFullLoading(true);
  try {
    const res = await fetch(`/api/admin/reservations/${cancelFullModal.id}/cancel-full`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Error al cancelar');
      return;
    }
    setCancelFullModal(null);
    await fetchReservations();
  } catch {
    alert('Error de conexión');
  } finally {
    setCancelFullLoading(false);
  }
};
```

- [ ] **Step 3: Add cancel-full button in the acciones column**

Find the existing Trash2 delete button in the acciones column and add before it:

```tsx
{r.status !== 'cancelled' && r.google_calendar_event_id && (
  <button
    onClick={() => setCancelFullModal(r)}
    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
    title="Cancelar y eliminar del calendario"
  >
    <CalendarX className="w-4 h-4" />
  </button>
)}
```

Add `CalendarX` to the lucide-react import.

- [ ] **Step 4: Add cancel-full confirmation modal**

Add before closing `</AdminLayout>`:

```tsx
{/* Cancel-full modal */}
{cancelFullModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Cancelar reserva</h3>
      <p className="text-gray-600 mb-4">
        ¿Cancelar la reserva <strong>#{cancelFullModal.id}</strong> de {cancelFullModal.name}?
        Se eliminará el evento del Google Calendar y se notificará al cliente.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => setCancelFullModal(null)}
          disabled={cancelFullLoading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
        >
          No cancelar
        </button>
        <button
          onClick={handleCancelFull}
          disabled={cancelFullLoading}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
        >
          {cancelFullLoading ? 'Cancelando...' : 'Sí, cancelar'}
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/edu/claude/happyhub && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6: Test in browser**

1. Go to `/admin/reservations`
2. Find a reservation with an approved status and a `google_calendar_event_id`
3. Click the red CalendarX icon — modal should appear
4. Confirm — reservation should show as `cancelled`, calendar event should be deleted

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/reservations/index.tsx
git commit -m "feat: add cancel-full button in admin reservations with confirmation modal"
```

---

## Task 13: Create n8n payment reminder cron workflow

**Files:**
- Create: `n8n/n8n-nodes/n8n-payment-reminder-cron.json`

This workflow runs daily at 10:00h and sends reminder emails at 30, 7, and 3 days before the event.

- [ ] **Step 1: Create the workflow JSON**

```json
{
  "name": "HappyHub - Recordatorios de Pago",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "hours",
              "minutesInterval": 0,
              "hoursInterval": 1,
              "cronExpression": "0 10 * * *"
            }
          ]
        }
      },
      "id": "schedule_trigger",
      "name": "Cron 10:00h diario",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "functionCode": "// Generar lista de fechas objetivo (hoy+30, hoy+7, hoy+3)\nconst today = new Date();\nconst targets = [30, 7, 3].map(days => {\n  const d = new Date(today);\n  d.setDate(d.getDate() + days);\n  return d.toISOString().split('T')[0];\n});\nreturn [{ json: { targetDates: targets, today: today.toISOString() } }];"
      },
      "id": "build_dates",
      "name": "CalcularFechasObjetivo",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "=SELECT r.id, r.event_date, r.time_slot, r.event_type, r.guests, r.total_price, r.deposit_paid, u.name, u.email, u.phone, (r.total_price - r.deposit_paid) as remaining FROM reservations r LEFT JOIN users u ON r.user_id = u.id WHERE r.payment_status = 'deposit_paid' AND r.status NOT IN ('cancelled', 'rejected') AND r.event_date IN ('{{ $json.targetDates[0] }}', '{{ $json.targetDates[1] }}', '{{ $json.targetDates[2] }}')",
        "options": {}
      },
      "id": "query_reservations",
      "name": "BuscarReservasPendientes",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.4,
      "position": [650, 300],
      "credentials": {
        "postgres": {
          "id": "neon_happyhub",
          "name": "Neon HappyHub"
        }
      }
    },
    {
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{ $items().length }}",
              "operation": "larger",
              "value2": 0
            }
          ]
        }
      },
      "id": "if_has_reservations",
      "name": "HayReservas",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [850, 300]
    },
    {
      "parameters": {
        "functionCode": "// Para cada reserva, calcular días hasta el evento\nconst today = new Date();\ntoday.setHours(0,0,0,0);\n\nreturn items.map(item => {\n  const eventDate = new Date(item.json.event_date);\n  eventDate.setHours(0,0,0,0);\n  const diffMs = eventDate - today;\n  const daysUntil = Math.round(diffMs / (1000*60*60*24));\n  \n  return {\n    json: {\n      ...item.json,\n      daysUntil,\n      remaining: parseFloat(item.json.remaining || 0),\n      totalPrice: parseFloat(item.json.total_price || 0),\n    }\n  };\n});"
      },
      "id": "enrich_data",
      "name": "EnriquecerDatos",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [1050, 200]
    },
    {
      "parameters": {
        "url": "={{ $env.NEXTAUTH_URL }}/api/payments/token",
        "method": "POST",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            },
            {
              "name": "x-internal-secret",
              "value": "={{ $env.INTERNAL_API_SECRET }}"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "reservationId",
              "value": "={{ $json.id }}"
            }
          ]
        },
        "options": {}
      },
      "id": "generate_token",
      "name": "GenerarTokenPago",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1250, 200]
    },
    {
      "parameters": {
        "functionCode": "// Merge token data with reservation data\nconst tokenData = items[0].json;\nconst reservationData = $('EnriquecerDatos').item.json;\n\nconst daysUntil = reservationData.daysUntil;\nlet subject, urgencyText, ultimatumText;\n\nif (daysUntil <= 3) {\n  subject = '⚠️ Último aviso: completa el pago de tu reserva HappyHub';\n  urgencyText = 'Este es el último recordatorio';\n  ultimatumText = '<p style=\"color:#dc2626;font-weight:bold\">Si no realizas el pago en las próximas 48 horas, tu reserva quedará cancelada y la fecha liberada.</p>';\n} else if (daysUntil <= 7) {\n  subject = 'Faltan 7 días — completa el pago de tu reserva HappyHub';\n  urgencyText = 'Queda poco para tu evento';\n  ultimatumText = '';\n} else {\n  subject = 'Recuerda completar el pago de tu reserva HappyHub';\n  urgencyText = 'Tu evento se acerca';\n  ultimatumText = '';\n}\n\nconst eventDate = new Date(reservationData.event_date).toLocaleDateString('es-ES', {\n  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'\n});\n\nreturn [{\n  json: {\n    ...reservationData,\n    paymentUrl: tokenData.url,\n    subject,\n    urgencyText,\n    ultimatumText,\n    eventDateFormatted: eventDate,\n    daysUntil,\n  }\n}];"
      },
      "id": "build_email",
      "name": "PrepararEmail",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [1450, 200]
    },
    {
      "parameters": {
        "fromEmail": "hola@happyhub.es",
        "toEmail": "={{ $json.email }}",
        "subject": "={{ $json.subject }}",
        "emailType": "html",
        "message": "=<div style=\"font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px\">\n  <h1 style=\"color:#7c3aed\">HappyHub</h1>\n  <h2 style=\"color:#1f2937\">{{ $json.urgencyText }}</h2>\n  <p>Hola <strong>{{ $json.name }}</strong>,</p>\n  <p>Tienes un pago pendiente para tu reserva del <strong>{{ $json.eventDateFormatted }}</strong>.</p>\n  <table style=\"background:#f9fafb;border-radius:12px;padding:16px;width:100%;margin:20px 0\">\n    <tr><td style=\"color:#6b7280\">Total del evento</td><td style=\"text-align:right\">{{ $json.totalPrice }} €</td></tr>\n    <tr><td style=\"color:#059669\">Paga y señal abonada</td><td style=\"text-align:right;color:#059669\">− {{ $json.deposit_paid }} €</td></tr>\n    <tr style=\"font-weight:bold;font-size:18px\"><td>Restante a pagar</td><td style=\"text-align:right;color:#7c3aed\">{{ $json.remaining }} €</td></tr>\n  </table>\n  {{ $json.ultimatumText }}\n  <a href=\"{{ $json.paymentUrl }}\" style=\"display:block;background:#7c3aed;color:white;text-align:center;padding:16px 24px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:18px;margin:24px 0\">Pagar {{ $json.remaining }} € con tarjeta →</a>\n  <p style=\"color:#6b7280;font-size:14px\">Este enlace es válido durante 72 horas.</p>\n  <p style=\"color:#6b7280;font-size:14px\">¿Tienes alguna duda? Contáctanos por <a href=\"https://wa.me/34624645517\">WhatsApp</a> o email a <a href=\"mailto:hola@happyhub.es\">hola@happyhub.es</a>.</p>\n  <hr style=\"border:none;border-top:1px solid #e5e7eb;margin:24px 0\">\n  <p style=\"color:#9ca3af;font-size:12px\">HappyHub · C/ Rovellat, 27, Esplugues de Llobregat</p>\n</div>",
        "options": {}
      },
      "id": "send_email",
      "name": "EnviarEmail",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2,
      "position": [1650, 200],
      "credentials": {
        "smtp": {
          "id": "smtp_happyhub",
          "name": "SMTP HappyHub"
        }
      }
    }
  ],
  "connections": {
    "Cron 10:00h diario": { "main": [[{ "node": "CalcularFechasObjetivo", "type": "main", "index": 0 }]] },
    "CalcularFechasObjetivo": { "main": [[{ "node": "BuscarReservasPendientes", "type": "main", "index": 0 }]] },
    "BuscarReservasPendientes": { "main": [[{ "node": "HayReservas", "type": "main", "index": 0 }]] },
    "HayReservas": { "main": [[{ "node": "EnriquecerDatos", "type": "main", "index": 0 }], []] },
    "EnriquecerDatos": { "main": [[{ "node": "GenerarTokenPago", "type": "main", "index": 0 }]] },
    "GenerarTokenPago": { "main": [[{ "node": "PrepararEmail", "type": "main", "index": 0 }]] },
    "PrepararEmail": { "main": [[{ "node": "EnviarEmail", "type": "main", "index": 0 }]] }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

- [ ] **Step 2: Import workflow in n8n**

1. Open n8n dashboard
2. Go to Workflows → Import from file
3. Select `n8n/n8n-nodes/n8n-payment-reminder-cron.json`
4. Configure credentials: Postgres (`neon_happyhub`) and SMTP (`smtp_happyhub`)
5. Set environment variables in n8n: `NEXTAUTH_URL` and `INTERNAL_API_SECRET`
6. Activate the workflow

- [ ] **Step 3: Test the workflow manually**

In n8n, click "Execute Workflow" manually. Check:
- The Postgres query finds reservations with `payment_status = 'deposit_paid'` whose event is in 30/7/3 days
- Tokens are generated via the API
- Emails are sent to the customer address

- [ ] **Step 4: Commit**

```bash
git add n8n/n8n-nodes/n8n-payment-reminder-cron.json
git commit -m "feat: add n8n payment reminder cron workflow for 30/7/3 days before event"
```

---

## Final Verification

- [ ] **End-to-end deposit payment flow**

1. Create a new booking, select "Tarjeta"
2. Submit → redirects to Stripe Checkout
3. Pay with test card `4242 4242 4242 4242`
4. Verify: redirects to `/booking/success`
5. Verify in DB: `payment_status = 'deposit_paid'`, `deposit_paid > 0`

- [ ] **End-to-end remaining payment flow (área privada)**

1. Log in as the client who made the booking above
2. Go to `/area-privada`
3. Expand the reservation — should show "Pago restante pendiente: X€" block
4. Click "Pagar ahora →" → Stripe Checkout for remaining
5. Pay — verify `payment_status = 'fully_paid'` in DB

- [ ] **End-to-end remaining payment flow (email link)**

1. Generate a token: `POST /api/payments/token` with the reservation ID
2. Visit `/pagar/<token>` — should show the payment page
3. Click pay → Stripe → success
4. Verify `payment_status = 'fully_paid'` and token marked as `used`

- [ ] **Admin: generate payment link**

1. Log in as admin, go to `/admin/reservations`
2. Find a reservation with `paymentStatus = 'deposit_paid'` (amber badge)
3. Click the CreditCard icon → modal shows the link
4. Copy link → paste in new browser tab → payment page loads

- [ ] **Admin: cancel-full**

1. Find an approved reservation with a `google_calendar_event_id`
2. Click CalendarX → confirm modal → confirm
3. Verify: reservation status = `cancelled`, event no longer in Google Calendar

- [ ] **Política de privacidad page**

Visit `/politica-privacidad` — confirm the page loads correctly (already implemented).

---

## Notes for deployment

1. Add `INTERNAL_API_SECRET` to Vercel environment variables.
2. Run the DB migration by calling `POST /api/init-db` once after deploy (or add it to the app startup).
3. In n8n, update `NEXTAUTH_URL` to `https://happyhub.es` (or your Vercel URL) and add `INTERNAL_API_SECRET`.
4. The Google Calendar delete requires `https://www.googleapis.com/auth/calendar` scope (not just `.readonly`) — update the service account permissions if needed.
