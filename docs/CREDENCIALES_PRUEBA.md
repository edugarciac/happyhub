# Credenciales de Prueba - HappyHub

⚠️ **SOLO PARA DESARROLLO/TESTING - CAMBIAR EN PRODUCCIÓN**

## Usuarios de Prueba

Todos los usuarios tienen la misma contraseña temporal: **`admin123`**

### Admin (Acceso completo)
```
Email: admin@happyhub.es
Password: admin123
Role: admin
Redirect: /admin/dashboard
```

### Cliente Demo
```
Email: cliente@happyhub.es
Password: admin123
Role: client
Redirect: /
```

### Proveedor Demo
```
Email: proveedor@happyhub.es
Password: admin123
Role: provider
Redirect: /proveedores
```

### Clientes de Prueba
```
Email: test@example.com
Password: admin123
Role: client

Email: maria.garcia.test@happyhub.es
Password: admin123
Role: client

Email: edu@edu.com
Password: admin123
Role: client
```

## Producción

**⚠️ IMPORTANTE:**
- Estos passwords deben cambiarse en producción
- Crear usuarios reales con emails válidos
- Usar passwords seguros (generados)
- Configurar recuperación de contraseña

## Test Flows

### Test Admin Dashboard
1. Login: admin@happyhub.es / admin123
2. Verifica redirect a /admin/dashboard
3. Verifica sidebar muestra 7 opciones
4. Click "Reseñas" → gestión de reviews

### Test Approval Workflow
1. Crear reserva de prueba (cualquier cliente)
2. Verifica WhatsApp llega con link
3. Click link → /admin/approve-reservation/[id]
4. Aprobar/Rechazar
5. Verifica notificaciones enviadas

### Test Ratings
1. Login como cliente (maria.garcia.test@happyhub.es)
2. Ir a reserva completada
3. Enviar reseña
4. Login como admin
5. Ir a /admin/reviews
6. Publicar reseña
7. Verificar aparece en homepage
