## Decisions

- **Condición sobre `payment_status`** en vez de dejar de guardar el id de sesión al crear el enlace: el id al crear sirve para rastrear la sesión activa, y el estado de pago es la fuente de verdad de "ya registrado".
- Un reenvío tras el arreglo de un evento que no se registró se procesa normalmente (estado aún no pagado), lo que permite recuperar los pagos perdidos desde el panel de Stripe.
