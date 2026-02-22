#!/bin/bash
echo "⏳ Esperando build #6 (5-10 min)..."
for i in {1..20}; do
    STATUS=$(aws --profile happyhub-cli amplify get-job --app-id du3to83rdme3o --branch-name main --job-id 6 --region eu-west-1 --query 'job.summary.status' --output text 2>/dev/null)
    if [ "$STATUS" = "SUCCEED" ]; then
        echo ""
        echo "✅ Build #6 completado!"
        echo ""
        echo "🗄️  Aplicando schema..."
        RESULT=$(curl -s "https://main.du3to83rdme3o.amplifyapp.com/api/init-db")
        echo "$RESULT" | jq . 2>/dev/null || echo "$RESULT"
        if [[ $RESULT == *"success\":true"* ]]; then
            echo ""
            echo "🎉 ¡SCHEMA APLICADO! Migración completada."
            open -a Safari https://main.du3to83rdme3o.amplifyapp.com
        fi
        exit 0
    fi
    echo -n "."
    sleep 30
done
echo ""
echo "⏰ Timeout. Verifica manualmente."
