#!/bin/bash

# Pre-flight Check para Fase 1: Aurora PostgreSQL
# Verifica que todos los requisitos están listos

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       Pre-Flight Check - Fase 1: Aurora PostgreSQL            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

total=0
passed=0

# Test 1: AWS CLI instalado
echo -n "1. AWS CLI instalado... "
if command -v aws &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
    aws --version
    ((passed++))
else
    echo -e "${RED}✗${NC}"
    echo "   Instalar con: brew install awscli"
fi
((total++))
echo ""

# Test 2: AWS CLI configurado con perfil happyhub-cli
echo -n "2. AWS CLI perfil happyhub-cli configurado... "
if aws --profile happyhub-cli sts get-caller-identity &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
    aws --profile happyhub-cli sts get-caller-identity --query 'Account' --output text
    ((passed++))
else
    echo -e "${RED}✗${NC}"
    echo "   Ejecutar: ./scripts/configure-aws-auto.sh"
fi
((total++))
echo ""

# Test 3: PostgreSQL client instalado
echo -n "3. PostgreSQL client (psql) instalado... "
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
    psql --version
    ((passed++))
else
    echo -e "${RED}✗${NC}"
    echo "   Instalar con: brew install postgresql@15"
fi
((total++))
echo ""

# Test 4: Node.js instalado (para test de conexión)
echo -n "4. Node.js instalado... "
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
    node --version
    ((passed++))
else
    echo -e "${RED}✗${NC}"
    echo "   Instalar con: brew install node"
fi
((total++))
echo ""

# Test 5: Permisos RDS en IAM
echo -n "5. Permisos RDS en IAM... "
if aws --profile happyhub-cli rds describe-db-clusters --region eu-west-1 &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
    ((passed++))
else
    echo -e "${YELLOW}⚠${NC}"
    echo "   Es posible que necesites permisos adicionales para RDS"
    echo "   Ver: docs/aws/AWS_IAM_PERMISSIONS.md"
fi
((total++))
echo ""

# Test 6: VPC default existe
echo -n "6. VPC default en eu-west-1... "
VPC_CHECK=$(aws --profile happyhub-cli ec2 describe-vpcs \
    --region eu-west-1 \
    --filters "Name=isDefault,Values=true" \
    --query 'Vpcs[0].VpcId' \
    --output text 2>/dev/null || echo "None")

if [ "$VPC_CHECK" != "None" ]; then
    echo -e "${GREEN}✓${NC}"
    echo "   VPC ID: $VPC_CHECK"
    ((passed++))
else
    echo -e "${RED}✗${NC}"
    echo "   Necesitas crear una VPC en eu-west-1"
fi
((total++))
echo ""

# Test 7: Archivos de migración existen
echo -n "7. Archivos de schema SQL... "
if [ -f "migration/schema.sql" ]; then
    echo -e "${GREEN}✓${NC}"
    ((passed++))
else
    echo -e "${RED}✗${NC}"
    echo "   Falta archivo: migration/schema.sql"
fi
((total++))
echo ""

echo -n "8. Archivo seed-data.sql... "
if [ -f "migration/seed-data.sql" ]; then
    echo -e "${GREEN}✓${NC}"
    ((passed++))
else
    echo -e "${RED}✗${NC}"
    echo "   Falta archivo: migration/seed-data.sql"
fi
((total++))
echo ""

# Test 9: Directorios de migración
echo -n "9. Directorios de migración... "
if [ -d "migration/backups" ] && [ -d "migration/airtable-export" ]; then
    echo -e "${GREEN}✓${NC}"
    ((passed++))
else
    echo -e "${YELLOW}⚠${NC}"
    echo "   Creando directorios..."
    mkdir -p migration/backups migration/airtable-export
fi
((total++))
echo ""

# Test 10: Espacio en disco
echo -n "10. Espacio en disco suficiente... "
FREE_SPACE=$(df -h . | awk 'NR==2 {print $4}' | sed 's/Gi//')
if [ "${FREE_SPACE%%.*}" -gt 5 ]; then
    echo -e "${GREEN}✓${NC}"
    echo "   Espacio libre: ${FREE_SPACE}GB"
    ((passed++))
else
    echo -e "${YELLOW}⚠${NC}"
    echo "   Espacio libre bajo: ${FREE_SPACE}GB"
fi
((total++))
echo ""

# Resumen
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                         RESULTADO                              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

percentage=$((passed * 100 / total))
echo "Tests pasados: $passed/$total ($percentage%)"
echo ""

if [ $percentage -eq 100 ]; then
    echo -e "${GREEN}✅ ¡Todo listo para empezar Fase 1!${NC}"
    echo ""
    echo "Próximo paso:"
    echo "  cat migration/FASE_1_AURORA.md"
    echo "  o"
    echo "  open migration/FASE_1_AURORA.md"
    echo ""
    echo "Tiempo estimado: 2-3 horas"
    echo "Coste estimado: ~1€ (durante setup), ~25€/mes después"
    exit 0
elif [ $percentage -ge 70 ]; then
    echo -e "${YELLOW}⚠️  Casi listo, revisa los warnings arriba${NC}"
    echo ""
    echo "Puedes continuar, pero algunos pasos pueden requerir ajustes."
    exit 1
else
    echo -e "${RED}❌ No estás listo para Fase 1${NC}"
    echo ""
    echo "Completa los tests fallidos antes de continuar."
    echo ""
    echo "Documentación de ayuda:"
    echo "  - AWS CLI: docs/aws/AWS_CLI_CREDENTIALS.md"
    echo "  - Permisos IAM: docs/aws/AWS_IAM_PERMISSIONS.md"
    exit 1
fi
