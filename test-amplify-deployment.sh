#!/bin/bash

# Script para verificar deployment de Amplify y aplicar schema

AMPLIFY_URL="https://main.du3to83rdme3o.amplifyapp.com"

echo "════════════════════════════════════════════════════════════"
echo "  Testing HappyHub Deployment en AWS Amplify"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "URL: $AMPLIFY_URL"
echo ""

# Test 1: Home page
echo "1️⃣  Probando home page..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $AMPLIFY_URL)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Home page OK (HTTP $HTTP_CODE)"
else
    echo "❌ Home page error (HTTP $HTTP_CODE)"
fi
echo ""

# Test 2: Health check
echo "2️⃣  Probando conectividad API..."
API_RESPONSE=$(curl -s $AMPLIFY_URL/api/auth)
if [[ $API_RESPONSE == *"error"* ]] || [[ $API_RESPONSE == *"message"* ]]; then
    echo "✅ API responde"
else
    echo "⚠️  API puede no estar funcionando"
fi
echo ""

# Test 3: Inicializar base de datos
echo "3️⃣  Aplicando schema PostgreSQL..."
echo "Llamando a /api/init-db..."
INIT_RESPONSE=$(curl -s $AMPLIFY_URL/api/init-db)
echo "$INIT_RESPONSE" | jq . 2>/dev/null || echo "$INIT_RESPONSE"
echo ""

if [[ $INIT_RESPONSE == *"success\":true"* ]]; then
    echo "✅ Schema aplicado correctamente!"
else
    echo "⚠️  Revisar logs en Amplify Console"
fi
echo ""

# Test 4: Abrir en navegador
echo "4️⃣  Abriendo app en navegador..."
open -a Safari $AMPLIFY_URL
echo ""

echo "════════════════════════════════════════════════════════════"
echo "           Testing completado"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Próximos pasos:"
echo "  1. Verificar que home page carga correctamente"
echo "  2. Probar navegación (/servicios, /disponibilidad, /reservas)"
echo "  3. Crear reserva de prueba"
echo ""
