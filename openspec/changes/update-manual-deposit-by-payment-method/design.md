## Decisions

- **No ocultar la acción para tarjeta**: sirve si el cliente acaba pagando por Bizum/efectivo o si falla el webhook de Stripe. Se desincentiva con etiqueta "(manual)", posición al final y un aviso explícito.
- **Método nulo = tarjeta**, coherente con los textos "Pendiente de señal (tarjeta)" ya existentes en la tabla.
