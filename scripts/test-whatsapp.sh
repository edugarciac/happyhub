#!/bin/bash
# Test WhatsApp API - Send message to verify token works

echo "📱 Test WhatsApp API"
echo ""

# Check if token is provided
if [ -z "$1" ]; then
    echo "❌ Error: Necesitas proporcionar el token"
    echo ""
    echo "Uso:"
    echo "  ./scripts/test-whatsapp.sh EAAxxxxxx..."
    echo ""
    echo "O con token desde variable:"
    echo "  TOKEN='EAAxxxxx' ./scripts/test-whatsapp.sh"
    exit 1
fi

TOKEN="$1"
PHONE_ID="1042980942231692"
TO_NUMBER="34624645517"

echo "📋 Configuración:"
echo "  Phone ID: $PHONE_ID"
echo "  Destinatario: +$TO_NUMBER"
echo "  Token: ${TOKEN:0:20}..."
echo ""

echo "📤 Enviando mensaje de prueba..."
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "https://graph.facebook.com/v21.0/$PHONE_ID/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "'"$TO_NUMBER"'",
    "type": "text",
    "text": {
      "body": "✅ Test desde HappyHub n8n - Funcionando correctamente! 🎉"
    }
  }')

# Extract HTTP code
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "📊 Respuesta:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ ¡ÉXITO! WhatsApp enviado correctamente"
    echo "📱 Revisa tu móvil +34 624 645 517"
    echo ""
    echo "🔧 Configuración para n8n:"
    echo "  URL: https://graph.facebook.com/v21.0/$PHONE_ID/messages"
    echo "  Header: Authorization: Bearer $TOKEN"
else
    echo "❌ Error HTTP $HTTP_CODE"
    echo ""
    if echo "$BODY" | grep -q "expired"; then
        echo "💡 El token ha expirado. Genera uno nuevo en Meta."
    elif echo "$BODY" | grep -q "permissions"; then
        echo "💡 Faltan permisos. Verifica la configuración en Meta."
    else
        echo "💡 Verifica el token y phone ID en Meta Developers."
    fi
fi
