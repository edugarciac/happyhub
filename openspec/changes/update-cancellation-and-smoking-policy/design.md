## Decisions

1. Tramos: >=15 días devolución; 3-14 días cambio de fecha; <3 días nada. El día 3 cae en el tramo de cambio de fecha.
2. El modal de `mi-reserva/[id].tsx` calcula los días restantes y muestra el texto del tramo correspondiente (antes afirmaba siempre devolución del 100%).
3. No se automatiza ninguna devolución ni reprogramación; la política es informativa y se aplica a mano.
