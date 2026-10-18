## Decisions

- **Persistente en BD, no solo logs**: Vercel Hobby retiene 1 h de logs; la tabla `audit_events` en Neon no caduca. También se escribe una línea `[AUDIT]` en consola.
- **Nunca rompe el flujo**: `recordAuditEvent` captura sus propios errores.
- **Captura en el borde**: un wrapper `withAudit` intercepta `res.status/json` de la API y registra estado HTTP + `step`/`error` de la respuesta, sin tocar cada `return`.
- **Datos mínimos**: sin contraseñas ni `termsText`; email, IP y user-agent son necesarios para la forense (interés legítimo, seguridad). Se puede purgar por antigüedad más adelante.
- **Usuario creado por el admin**: `password_hash` = bcrypt de 32 bytes aleatorios → nadie conoce la contraseña; se activa con el flujo de reset.
