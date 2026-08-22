## Context

`PricingTable.tsx` renderiza una tabla con columnas Mañana / Tarde / Noche por cada tipo de día (Lunes-Jueves, Viernes, Sábados-Domingos, Festivos). La columna Noche siempre muestra "A consultar" vía el valor fijo `'consult'`, ya que la franja nocturna no está activa. Esto hace que la tabla pública ofrezca una franja horaria que en la práctica no se puede reservar.

## Goals / Non-Goals

**Goals:**
- Quitar la columna "Noche" de la vista pública de tarifas en la home
- No tocar los datos de precios nocturnos existentes (BD, API `/api/pricing/current`, `pricing.ts`/`pricingDb.ts`) para poder reactivar la franja fácilmente en el futuro

**Non-Goals:**
- Eliminar o migrar las columnas de precio nocturno en la base de datos
- Cambiar la lógica de cálculo de precios en `src/utils/pricing.ts`
- Modificar el flujo de reserva (`BookingWizard`, `Step2Configuration`, etc.) que pueda referenciar la franja nocturna

## Decisions

1. **Solo capa de presentación**: el cambio se limita a `PricingTable.tsx` (quitar `<th>` "Noche", quitar el campo `night` del tipo `PriceRow` y de las filas, quitar la `<td>` correspondiente). No se toca la API ni la base de datos.
2. **Reversible**: al no borrar datos ni lógica de negocio, reactivar la franja nocturna en el futuro es tan simple como volver a añadir la columna en este mismo componente.

## Risks / Trade-offs

- [Riesgo] Si en el futuro se reactiva la franja nocturna, habrá que recordar revertir este cambio en `PricingTable.tsx` → Aceptado: es un cambio simple y localizado en un único componente.
