#!/bin/bash

# Script de prueba para el webhook de reservas de HappyHub
# Uso: ./test-webhook.sh [dev|prod]

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URLs
WEBHOOK_URL="https://n8n-n8n.ljmvxa.easypanel.host/webhook/reserva-happyhub"

# Banner
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════╗"
echo "║  HappyHub - Test de Webhook n8n      ║"
echo "╔═══════════════════════════════════════╗"
echo -e "${NC}"

# Verificar que curl esté instalado
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl no está instalado${NC}"
    exit 1
fi

# Verificar que jq esté instalado (opcional pero recomendado)
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Advertencia: jq no está instalado. El output no será formateado.${NC}"
    echo -e "${YELLOW}Instalar con: brew install jq${NC}"
    USE_JQ=false
else
    USE_JQ=true
fi

echo ""
echo -e "${YELLOW}Webhook URL:${NC} $WEBHOOK_URL"
echo ""

# Función para hacer la petición
test_reserva() {
    local test_name=$1
    local payload=$2
    local expected_status=$3

    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Test: $test_name${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Hacer la petición
    response=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$payload")

    # Separar body y status code
    http_body=$(echo "$response" | head -n -1)
    http_code=$(echo "$response" | tail -n 1)

    # Mostrar resultado
    echo -e "${YELLOW}Status Code:${NC} $http_code"
    echo ""
    echo -e "${YELLOW}Response:${NC}"

    if [ "$USE_JQ" = true ]; then
        echo "$http_body" | jq '.'
    else
        echo "$http_body"
    fi

    echo ""

    # Verificar status esperado
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ Test pasado (Status: $http_code)${NC}"
    else
        echo -e "${RED}✗ Test fallido (Esperado: $expected_status, Obtenido: $http_code)${NC}"
    fi

    echo ""
    echo ""
}

# Menú de opciones
echo "Selecciona el tipo de test:"
echo ""
echo "1) Reserva simple - Cumpleaños (Debería tener éxito)"
echo "2) Reserva completa - Comunión con extras (Debería tener éxito)"
echo "3) Reserva con conflicto de horario (Debería fallar 409)*"
echo "4) Reserva sin campos requeridos (Debería fallar 400)"
echo "5) Todos los tests en secuencia"
echo ""
echo -e "${YELLOW}* Nota: El test 3 solo fallará si ya existe una reserva para esa fecha/hora${NC}"
echo ""
read -p "Opción (1-5): " option

case $option in
    1)
        test_reserva "Reserva Simple - Cumpleaños" '{
          "name": "María García",
          "email": "maria.garcia@example.com",
          "phone": "+34612345678",
          "eventType": "Cumpleaños",
          "date": "2025-01-15",
          "time": "17:00",
          "guests": 25,
          "duration": "4",
          "extras": [],
          "paymentMethod": "stripe",
          "totalPrice": 450,
          "message": "Cumpleaños de niña de 8 años"
        }' "200"
        ;;

    2)
        test_reserva "Reserva Completa - Comunión" '{
          "name": "Juan Martínez López",
          "email": "juan.martinez@example.com",
          "phone": "+34698765432",
          "eventType": "Comunión",
          "date": "2025-05-10",
          "time": "13:00",
          "guests": 50,
          "duration": "6",
          "extras": ["Catering", "Decoración", "Animación", "Fotografía"],
          "paymentMethod": "stripe",
          "totalPrice": 1200,
          "message": "Comunión de mi hija Andrea"
        }' "200"
        ;;

    3)
        echo -e "${YELLOW}Este test intentará crear una reserva en la misma fecha/hora que el test 1${NC}"
        read -p "¿Has ejecutado el test 1 antes? (s/n): " confirm
        if [ "$confirm" = "s" ]; then
            test_reserva "Test de Conflicto de Horario" '{
              "name": "Test Conflict",
              "email": "test@example.com",
              "phone": "+34600000000",
              "eventType": "Test",
              "date": "2025-01-15",
              "time": "17:00",
              "guests": 10,
              "duration": "2",
              "extras": [],
              "paymentMethod": "stripe",
              "totalPrice": 200
            }' "409"
        else
            echo -e "${RED}Primero ejecuta el test 1 para crear la reserva inicial${NC}"
        fi
        ;;

    4)
        test_reserva "Test de Validación - Faltan Campos" '{
          "name": "Test User",
          "email": "test@example.com"
        }' "400"
        ;;

    5)
        echo -e "${GREEN}Ejecutando todos los tests...${NC}"
        echo ""
        sleep 2

        test_reserva "1/4: Reserva Simple" '{
          "name": "Test Auto 1",
          "email": "test1@example.com",
          "phone": "+34600000001",
          "eventType": "Cumpleaños",
          "date": "2025-01-20",
          "time": "16:00",
          "guests": 20,
          "duration": "4",
          "totalPrice": 400
        }' "200"

        sleep 3

        test_reserva "2/4: Reserva Completa" '{
          "name": "Test Auto 2",
          "email": "test2@example.com",
          "phone": "+34600000002",
          "eventType": "Comunión",
          "date": "2025-02-15",
          "time": "13:00",
          "guests": 50,
          "duration": "6",
          "extras": ["Catering", "Decoración"],
          "totalPrice": 900
        }' "200"

        sleep 3

        test_reserva "3/4: Test de Conflicto" '{
          "name": "Test Auto 3",
          "email": "test3@example.com",
          "phone": "+34600000003",
          "eventType": "Test",
          "date": "2025-01-20",
          "time": "16:00",
          "guests": 10,
          "duration": "2",
          "totalPrice": 200
        }' "409"

        sleep 2

        test_reserva "4/4: Test de Validación" '{
          "name": "Test Auto 4"
        }' "400"

        echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║     Todos los tests completados      ║${NC}"
        echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
        ;;

    *)
        echo -e "${RED}Opción inválida${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Test completado!${NC}"
echo ""
echo "Para ver los detalles de las ejecuciones en n8n:"
echo "👉 https://n8n-n8n.ljmvxa.easypanel.host/workflow"
echo ""
