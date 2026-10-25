## Decisions

- **`effort: low`**: son sugerencias cortas y sin pasos de herramienta; `low` mantiene la latencia y el coste bajos. Si la calidad baja, subir a `medium` (el valor por defecto de Haiku 5.5).
- **Sin `temperature` ni prefill**: Haiku 5.5 los rechaza; `generateText` no los usaba.
- **`max_tokens` 8 000**: holgura para el razonamiento y para 8 sugerencias en JSON; solo se paga lo que se genera.
- **Rechazos**: Haiku 5.5 no tiene fallback en el servidor. Un rechazo (`stop_reason: refusal`) lanza un error que las APIs ya convierten en 500 con mensaje.
- **JSON**: se mantiene el formato pedido en el prompt y el parseo actual. Pasar a salida estructurada (`output_config.format`) queda fuera de este cambio.
