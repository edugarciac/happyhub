#!/bin/bash

# Migration Checklist - Interactive script para verificar preparación

set -e

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     Checklist de Migración Vercel+Airtable → AWS             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

checklist_item() {
    read -p "$1 (y/n): " answer
    if [[ "$answer" == "y" ]]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1"
        return 1
    fi
}

total=0
passed=0

echo -e "${YELLOW}═══ FASE 0: PREPARACIÓN ═══${NC}"
echo ""

if checklist_item "¿Backup completo de Airtable exportado (CSV)?"; then ((passed++)); fi
((total++))

if checklist_item "¿Código en Git actualizado y pusheado?"; then ((passed++)); fi
((total++))

if checklist_item "¿Variables de entorno documentadas?"; then ((passed++)); fi
((total++))

if checklist_item "¿Workflows n8n exportados?"; then ((passed++)); fi
((total++))

if checklist_item "¿Plan de rollback documentado?"; then ((passed++)); fi
((total++))

echo ""
echo -e "${YELLOW}═══ FASE 1: BASE DE DATOS ═══${NC}"
echo ""

if checklist_item "¿Aurora PostgreSQL cluster creado?"; then ((passed++)); fi
((total++))

if checklist_item "¿Schema PostgreSQL aplicado?"; then ((passed++)); fi
((total++))

if checklist_item "¿Datos migrados de Airtable a PostgreSQL?"; then ((passed++)); fi
((total++))

if checklist_item "¿Workflows n8n actualizados para usar PostgreSQL?"; then ((passed++)); fi
((total++))

echo ""
echo -e "${YELLOW}═══ FASE 2: FRONTEND/BACKEND ═══${NC}"
echo ""

if checklist_item "¿Amplify configurado o EC2 desplegado?"; then ((passed++)); fi
((total++))

if checklist_item "¿Variables de entorno configuradas en AWS?"; then ((passed++)); fi
((total++))

if checklist_item "¿Build exitoso en AWS?"; then ((passed++)); fi
((total++))

echo ""
echo -e "${YELLOW}═══ FASE 3: STORAGE ═══${NC}"
echo ""

if checklist_item "¿S3 bucket creado en eu-west-1?"; then ((passed++)); fi
((total++))

if checklist_item "¿CloudFront distribution configurada?"; then ((passed++)); fi
((total++))

if checklist_item "¿Código actualizado para usar S3?"; then ((passed++)); fi
((total++))

echo ""
echo -e "${YELLOW}═══ FASE 4: CONFIGURACIÓN ═══${NC}"
echo ""

if checklist_item "¿DNS configurado (Route 53)?"; then ((passed++)); fi
((total++))

if checklist_item "¿SSL/TLS certificado instalado?"; then ((passed++)); fi
((total++))

if checklist_item "¿Billing alerts configuradas?"; then ((passed++)); fi
((total++))

echo ""
echo -e "${YELLOW}═══ FASE 5: TESTING ═══${NC}"
echo ""

if checklist_item "¿Testing completo en staging?"; then ((passed++)); fi
((total++))

if checklist_item "¿Crear reserva funciona?"; then ((passed++)); fi
((total++))

if checklist_item "¿Workflow n8n se ejecuta?"; then ((passed++)); fi
((total++))

if checklist_item "¿Pago Stripe funciona?"; then ((passed++)); fi
((total++))

if checklist_item "¿Upload de imágenes a S3 funciona?"; then ((passed++)); fi
((total++))

if checklist_item "¿Login/Logout funciona?"; then ((passed++)); fi
((total++))

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                       RESULTADO                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

percentage=$((passed * 100 / total))

echo "Completado: $passed/$total ($percentage%)"
echo ""

if [ $percentage -eq 100 ]; then
    echo -e "${GREEN}✓ ¡Todo listo para migración a producción!${NC}"
    echo ""
    echo "Próximo paso:"
    echo "  1. Programar ventana de mantenimiento (viernes noche recomendado)"
    echo "  2. Notificar a usuarios con 48h de antelación"
    echo "  3. Ejecutar migración siguiendo docs/aws/PLAN_MIGRACION_A_AWS.md - Fase 5.2"
    exit 0
elif [ $percentage -ge 80 ]; then
    echo -e "${YELLOW}⚠️  Casi listo, completa los items faltantes${NC}"
    exit 1
else
    echo -e "${RED}✗ No estás listo para migrar, completa más items${NC}"
    echo ""
    echo "Recomendación: Revisa docs/aws/PLAN_MIGRACION_A_AWS.md"
    exit 1
fi
