#!/bin/bash
# Watch dev server logs in real-time

echo "🔍 Monitoreando logs del dev server..."
echo "Intenta hacer una reserva ahora"
echo "Press Ctrl+C to stop"
echo ""

# Find most recent output file
LOG_FILE=$(ls -t /private/tmp/claude-502/-Users-e-garcia-casas-Library-CloudStorage-OneDrive-Allianz-Code-happyhub/tasks/*.output 2>/dev/null | head -1)

if [ -z "$LOG_FILE" ]; then
    echo "❌ No se encontró archivo de logs"
    echo "¿Está corriendo el dev server?"
    exit 1
fi

echo "📄 Logs: $LOG_FILE"
echo ""

tail -f "$LOG_FILE"
