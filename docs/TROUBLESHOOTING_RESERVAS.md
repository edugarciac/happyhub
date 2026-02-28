# Troubleshooting: Error al Crear Reservas

## Error: "Error al procesar la reserva"

### Causa 1: N8N_WEBHOOK_URL no configurada

**Verifica en .env.local:**
```bash
N8N_WEBHOOK_URL=http://52.208.80.224:5678/webhook
```

**Si falta, añádela y reinicia el server**

### Causa 2: n8n no responde

**Test n8n:**
```bash
curl -I http://52.208.80.224:5678
```

**Debe responder HTTP 200**

---

## 📋 Cómo Ver Logs

### Navegador (F12 → Console)
- Ver error completo
- Network tab → webhook-reserva request

### Terminal
```bash
./scripts/watch-logs.sh
```

### n8n
```bash
ssh -i ~/.ssh/n8n-happyhub-key.pem ubuntu@52.208.80.224 \
  'cd /opt/n8n && sudo docker-compose logs -f n8n'
```
