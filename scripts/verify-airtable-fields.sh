#!/bin/bash

# Script para verificar que los campos de Airtable estén correctamente configurados
# Requiere: jq (JSON parser)

# Cargar variables de entorno
if [ -f ../.env ]; then
    export $(cat ../.env | grep -v '^#' | xargs)
fi

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Verificando campos de Airtable..."
echo ""

# Campos requeridos por los workflows
REQUIRED_FIELDS=(
    "Status"
    "Cliente - Nombre"
    "Cliente - Email"
    "Cliente - Teléfono"
    "Evento - Tipo"
    "Evento - Fecha"
    "Evento - Franja"
    "Evento - Invitados"
    "Extras"
    "Precio Base"
    "Precio Total"
    "Método Pago"
    "Mensaje Cliente"
    "Google Calendar ID"
    "Reviewed At"
)

echo "📋 Campos requeridos por los workflows n8n:"
echo ""
for field in "${REQUIRED_FIELDS[@]}"; do
    echo "  ✓ $field"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 URL de tu base Airtable:"
echo "   https://airtable.com/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Intentar verificar campos con la API de Airtable
echo "🔐 Intentando conectar con la API de Airtable..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  "https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables" \
  -H "Authorization: Bearer ${AIRTABLE_PERSONAL_ACCESS_TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Conexión exitosa${NC}"
    echo ""

    # Verificar si jq está instalado
    if command -v jq &> /dev/null; then
        echo "📊 Estructura de la base:"
        echo ""

        # Buscar la tabla por ID
        TABLE_DATA=$(echo "$BODY" | jq ".tables[] | select(.id == \"${AIRTABLE_TABLE_ID}\")")

        if [ -z "$TABLE_DATA" ]; then
            echo -e "${RED}❌ No se encontró la tabla con ID: ${AIRTABLE_TABLE_ID}${NC}"
            echo ""
            echo "Tablas disponibles:"
            echo "$BODY" | jq -r '.tables[] | "  - \(.name) (ID: \(.id))"'
        else
            TABLE_NAME=$(echo "$TABLE_DATA" | jq -r '.name')
            echo -e "${GREEN}✅ Tabla encontrada: ${TABLE_NAME}${NC}"
            echo ""

            echo "Campos existentes en la tabla:"
            EXISTING_FIELDS=$(echo "$TABLE_DATA" | jq -r '.fields[].name')
            echo "$EXISTING_FIELDS" | while read -r field; do
                echo "  ✓ $field"
            done
            echo ""

            # Verificar campos faltantes
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "🔍 Verificando campos requeridos..."
            echo ""

            MISSING_FIELDS=()
            for required in "${REQUIRED_FIELDS[@]}"; do
                if echo "$EXISTING_FIELDS" | grep -q "^${required}$"; then
                    echo -e "  ${GREEN}✅${NC} $required"
                else
                    echo -e "  ${RED}❌${NC} $required ${YELLOW}(FALTANTE)${NC}"
                    MISSING_FIELDS+=("$required")
                fi
            done

            echo ""

            if [ ${#MISSING_FIELDS[@]} -eq 0 ]; then
                echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
                echo -e "${GREEN}🎉 ¡Todos los campos están configurados correctamente!${NC}"
                echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            else
                echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
                echo -e "${RED}⚠️  Faltan ${#MISSING_FIELDS[@]} campos en Airtable${NC}"
                echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
                echo ""
                echo "Campos faltantes:"
                for missing in "${MISSING_FIELDS[@]}"; do
                    echo -e "  ${RED}•${NC} $missing"
                done
                echo ""
                echo -e "${YELLOW}Por favor, añade estos campos en Airtable antes de importar los workflows.${NC}"
                echo ""
                echo "Consulta AIRTABLE_SETUP.md para ver los tipos de campo correctos."
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  jq no está instalado. Instalando con brew...${NC}"
        echo ""
        brew install jq
        echo ""
        echo -e "${GREEN}✅ jq instalado. Vuelve a ejecutar este script.${NC}"
    fi
else
    echo -e "${RED}❌ Error al conectar con Airtable (HTTP ${HTTP_CODE})${NC}"
    echo ""
    echo "Respuesta:"
    echo "$BODY"
    echo ""
    echo "Verifica:"
    echo "  1. Que el Personal Access Token sea correcto"
    echo "  2. Que el token tenga permisos de lectura para esta base"
    echo "  3. Que los IDs de Base y Tabla sean correctos"
fi

echo ""
