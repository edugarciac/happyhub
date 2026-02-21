#!/bin/bash

# Script automático para configurar AWS CLI usando credenciales guardadas
# Usa los archivos aws-credentials-cli.local y aws-config-cli.local

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║      Configuración Automática AWS CLI para HappyHub          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar AWS CLI instalado
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI no está instalado${NC}"
    echo "Instalar con: brew install awscli"
    exit 1
fi

echo -e "${GREEN}✓ AWS CLI instalado:${NC} $(aws --version)"
echo ""

# Verificar archivos de credenciales
CRED_FILE="aws-credentials-cli.local"
CONFIG_FILE="aws-config-cli.local"

if [ ! -f "$CRED_FILE" ]; then
    echo -e "${RED}❌ Archivo $CRED_FILE no encontrado${NC}"
    echo "Ejecuta primero el setup que creó las credenciales"
    exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}❌ Archivo $CONFIG_FILE no encontrado${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Archivos de credenciales encontrados${NC}"
echo ""

# Crear directorio ~/.aws si no existe
mkdir -p ~/.aws

# Verificar si el perfil ya existe
if grep -q "\[happyhub-cli\]" ~/.aws/credentials 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Perfil 'happyhub-cli' ya existe en ~/.aws/credentials${NC}"
    read -p "¿Sobrescribir? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Operación cancelada"
        exit 0
    fi
    # Eliminar perfil existente
    sed -i.bak '/\[happyhub-cli\]/,/^$/d' ~/.aws/credentials
    sed -i.bak '/\[profile happyhub-cli\]/,/^$/d' ~/.aws/config
fi

echo -e "${YELLOW}Configurando perfil 'happyhub-cli'...${NC}"

# Añadir credenciales a ~/.aws/credentials
echo "" >> ~/.aws/credentials
cat "$CRED_FILE" >> ~/.aws/credentials

echo -e "${GREEN}✓ Credenciales añadidas a ~/.aws/credentials${NC}"

# Añadir config a ~/.aws/config
echo "" >> ~/.aws/config
cat "$CONFIG_FILE" >> ~/.aws/config

echo -e "${GREEN}✓ Configuración añadida a ~/.aws/config${NC}"
echo ""

# Verificar credenciales
echo -e "${YELLOW}Verificando credenciales con AWS...${NC}"
if aws sts get-caller-identity --profile happyhub-cli > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Credenciales válidas${NC}"
    echo ""
    echo "Información de la cuenta:"
    aws sts get-caller-identity --profile happyhub-cli
    echo ""
else
    echo -e "${RED}❌ Error: No se pudo verificar las credenciales${NC}"
    echo "Verifica que las credenciales sean correctas en $CRED_FILE"
    exit 1
fi

# Mostrar siguiente paso
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  ✓ Configuración Completa                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Perfil configurado:${NC} happyhub-cli"
echo -e "${GREEN}Región:${NC} eu-west-1 (Europa - Irlanda)"
echo -e "${GREEN}Account ID:${NC} 128959995116"
echo -e "${GREEN}User:${NC} happyhub-cli"
echo ""
echo -e "${GREEN}Uso:${NC}"
echo "  # Usar el perfil en comandos:"
echo "  aws --profile happyhub-cli <command>"
echo ""
echo "  # O establecer como predeterminado para la sesión:"
echo "  export AWS_PROFILE=happyhub-cli"
echo "  aws s3 ls"
echo ""
echo -e "${YELLOW}Comandos útiles:${NC}"
echo "  aws --profile happyhub-cli sts get-caller-identity"
echo "  aws --profile happyhub-cli s3 ls"
echo "  aws --profile happyhub-cli ec2 describe-regions"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "  1. Ver docs/aws/AWS_CLI_CREDENTIALS.md para más información"
echo "  2. Ver docs/aws/AWS_QUICK_START.md para desplegar infraestructura"
echo ""
