## Decisions

1. **Confirmada solo por pago**: evita reservas "confirmadas" sin señal. El admin confirma un Bizum con su botón (que registra el pago) y no desde el desplegable de estados.
2. **Stripe solo confirma si estaba `approved`** (`CASE WHEN status = 'approved'`). Si estaba cancelada, se respeta el estado, se registra el pago y se avisa al admin.
3. **Backfill idempotente** en lugar de una migración manual, siguiendo el patrón de `ensureReservationFlowColumns`.
