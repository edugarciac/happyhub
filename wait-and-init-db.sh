#!/bin/bash

# Script que espera a que build de Amplify complete y aplica schema

AMPLIFY_URL="https://main.du3to83rdme3o.amplifyapp.com"
DB_SECRET="${DB_PASSWORD:?Set DB_PASSWORD environment variable}"

echo "════════════════════════════════════════════════════════════"
echo "  Esperando Build de Amplify y Aplicando Schema"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "⏳ Monitoreando build #5..."
echo "   Esto puede tardar 5-10 minutos"
echo ""

# Esperar hasta 15 minutos
for i in {1..30}; do
    STATUS=$(aws --profile happyhub-cli amplify get-job \
        --app-id du3to83rdme3o \
        --branch-name main \
        --job-id 5 \
        --region eu-west-1 \
        --query 'job.summary.status' \
        --output text 2>/dev/null)

    if [ "$STATUS" = "SUCCEED" ]; then
        echo ""
        echo "✅ Build completado exitosamente!"
        echo ""
        break
    elif [ "$STATUS" = "FAILED" ]; then
        echo ""
        echo "❌ Build falló. Revisa logs en Amplify Console."
        exit 1
    fi

    echo -n "."
    sleep 30
done

if [ "$STATUS" != "SUCCEED" ]; then
    echo ""
    echo "⚠️  Build aún en progreso después de 15 min"
    echo "   Revisa manualmente en Amplify Console"
    exit 1
fi

echo "🗄️  Aplicando schema PostgreSQL..."
echo ""

RESPONSE=$(curl -s "$AMPLIFY_URL/api/init-db?secret=$DB_SECRET")
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

if [[ $RESPONSE == *"success\":true"* ]]; then
    echo "════════════════════════════════════════════════════════════"
    echo "           🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo "✅ Aurora PostgreSQL: Desplegado"
    echo "✅ Schema aplicado: 5 tablas + datos"
    echo "✅ Next.js en Amplify: Funcionando"
    echo "✅ URL: $AMPLIFY_URL"
    echo ""
    echo "Abriendo app en navegador..."
    open -a Safari $AMPLIFY_URL
    echo ""
    echo "Próximos pasos:"
    echo "  1. Probar navegación y funcionalidad"
    echo "  2. Configurar dominio custom (opcional)"
    echo "  3. Configurar n8n workflows (cuando tengas SSH key)"
    echo ""
else
    echo "⚠️  Error aplicando schema"
    echo "   Revisa logs en Amplify Console → Monitoring → Logs"
fi
