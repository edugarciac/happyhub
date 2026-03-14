## Why

Organizar un evento en grupo implica gastos compartidos: alguien compra la decoracion, otro contrata el catering, otro adelanta el alquiler del espacio. Hoy esto se gestiona con Tricount, Splitwise o peor, con notas en WhatsApp y Bizum manual. Integrar el reparto de gastos directamente en el evento elimina una herramienta mas del stack y crea una experiencia fluida donde tareas, gastos y pagos van juntos.

Tricount funciona porque es simple. El objetivo es replicar esa simplicidad e integrarla en el contexto del evento, no crear un Splitwise con 200 opciones.

## What changes

### Gestion de gastos
- Anadir gasto con descripcion, importe, quien pago (pagador)
- Repartir entre todos los participantes (por defecto) o seleccionar subgrupo
- Reparto equitativo, por porcentaje o por cantidades fijas
- Los gastos pueden estar vinculados a una tarea del evento
- Foto del recibo/ticket (opcional)

### Saldos y liquidacion
- Vista de saldos en tiempo real: cada participante ve cuanto debe o le deben
- Algoritmo de liquidacion simplificada: minimo numero de transferencias para saldar todo
- Sugerencia de pagos: "Maria debe pagar 23.50 EUR a Pedro"
- Marcar transferencia como realizada (manual o via link Bizum)

### Historial
- Lista cronologica de todos los gastos del evento
- Filtro por pagador, por participante afectado
- Exportar resumen en PDF o CSV
- Resumen final del evento con todos los gastos y saldos

## Capabilities

### New capabilities
- `expense-add`: Anadir gasto con pagador, importe, descripcion y reparto
- `expense-split-methods`: Reparto equitativo, por porcentaje o cantidades fijas
- `expense-balances`: Calculo de saldos en tiempo real entre participantes
- `expense-settlement`: Algoritmo de liquidacion simplificada con minimas transferencias
- `expense-history`: Historial de gastos con filtros y exportacion
- `expense-receipt-photo`: Adjuntar foto de recibo al gasto

### Modified capabilities
- `collaborative-tasks`: Las tareas con presupuesto pueden generar gasto automaticamente al completarse
- `collaborative-event-dashboard`: Tab de "Gastos" con resumen de saldos

## Impact

**Database:**

```sql
-- Gastos
CREATE TABLE event_expenses (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL, -- puede ser collaborative_events o reservations
  event_type VARCHAR(50) NOT NULL, -- 'collaborative' o 'single'
  paid_by INTEGER NOT NULL REFERENCES users(id),
  description VARCHAR(500) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  receipt_photo_url TEXT,
  task_id INTEGER, -- FK opcional a collaborative_event_tasks
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reparto de cada gasto
CREATE TABLE event_expense_shares (
  id SERIAL PRIMARY KEY,
  expense_id INTEGER NOT NULL REFERENCES event_expenses(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  share_amount DECIMAL(10,2) NOT NULL, -- cuanto le corresponde pagar a este usuario
  is_settled BOOLEAN DEFAULT false,
  settled_at TIMESTAMP,
  UNIQUE(expense_id, user_id)
);

-- Transferencias/liquidaciones
CREATE TABLE event_settlements (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  from_user_id INTEGER NOT NULL REFERENCES users(id),
  to_user_id INTEGER NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed
  payment_method VARCHAR(50), -- bizum, stripe, cash, transfer
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Algoritmo de liquidacion simplificada:**
1. Calcular saldo neto de cada participante (total pagado - total que debe)
2. Separar en deudores (saldo negativo) y acreedores (saldo positivo)
3. Emparejar el mayor deudor con el mayor acreedor
4. Transferir el minimo de ambos importes
5. Repetir hasta que todos los saldos sean 0
6. Resultado: lista de transferencias minimas necesarias

**API endpoints:**
- `POST /api/events/[type]/[id]/expenses` - Anadir gasto
- `GET /api/events/[type]/[id]/expenses` - Listar gastos
- `PATCH /api/events/[type]/[id]/expenses/[expenseId]` - Editar gasto
- `DELETE /api/events/[type]/[id]/expenses/[expenseId]` - Eliminar gasto
- `GET /api/events/[type]/[id]/balances` - Saldos actuales
- `GET /api/events/[type]/[id]/settlements` - Liquidaciones sugeridas
- `POST /api/events/[type]/[id]/settlements/[sid]/complete` - Marcar como pagado
- `GET /api/events/[type]/[id]/expenses/export` - Exportar PDF/CSV

**UI components:**
- `ExpenseList` - Lista de gastos con resumen total
- `AddExpenseForm` - Formulario rapido (3 campos: que, cuanto, quien pago)
- `SplitSelector` - Selector de tipo de reparto (equitativo/porcentaje/manual)
- `BalanceSummary` - Card con saldo personal ("Debes 23.50 EUR" o "Te deben 15.00 EUR")
- `BalanceMatrix` - Tabla completa de quien debe a quien
- `SettlementList` - Lista de transferencias sugeridas con boton "Pagado"
- `ReceiptPhoto` - Captura/upload de foto de recibo

**Referencia UX - Tricount:**
- Pantalla principal: lista de gastos + mi saldo arriba
- Anadir gasto: 3 campos (titulo, importe, pagado por) + "repartir entre" (todos por defecto)
- Saldos: lista simple de quien debe a quien
- Sin registro obligatorio para participantes (link de acceso)
