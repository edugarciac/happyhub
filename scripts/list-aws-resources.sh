#!/bin/bash

# Script para listar recursos AWS existentes en la cuenta HappyHub
# Útil para auditar y documentar la infraestructura

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           Inventario de Recursos AWS - HappyHub              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROFILE="happyhub-cli"

echo -e "${BLUE}Cuenta y Usuario:${NC}"
aws --profile $PROFILE sts get-caller-identity
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}S3 Buckets:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
aws --profile $PROFILE s3 ls | while read -r line; do
    bucket_name=$(echo "$line" | awk '{print $3}')
    if [ ! -z "$bucket_name" ]; then
        echo -e "${GREEN}✓${NC} $line"
        location=$(aws --profile $PROFILE s3api get-bucket-location --bucket "$bucket_name" --query 'LocationConstraint' --output text)
        if [ "$location" == "None" ] || [ "$location" == "null" ]; then
            location="us-east-1"
        fi
        echo "  Región: $location"

        # Count objects
        object_count=$(aws --profile $PROFILE s3 ls s3://$bucket_name --recursive | wc -l | tr -d ' ')
        echo "  Objetos: $object_count"
        echo ""
    fi
done

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}EC2 Instancias:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
instances=$(aws --profile $PROFILE ec2 describe-instances --region eu-west-1 --query 'Reservations[*].Instances[*].[InstanceId,InstanceType,State.Name,Tags[?Key==`Name`].Value|[0]]' --output text 2>/dev/null || echo "")
if [ -z "$instances" ]; then
    echo "  No hay instancias EC2 en eu-west-1"
else
    echo "$instances" | while read -r line; do
        echo -e "${GREEN}✓${NC} $line"
    done
fi
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}RDS Databases:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
dbs=$(aws --profile $PROFILE rds describe-db-instances --region eu-west-1 --query 'DBInstances[*].[DBInstanceIdentifier,Engine,DBInstanceStatus]' --output text 2>/dev/null || echo "")
if [ -z "$dbs" ]; then
    echo "  No hay instancias RDS en eu-west-1"
else
    echo "$dbs" | while read -r line; do
        echo -e "${GREEN}✓${NC} $line"
    done
fi
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Lambda Functions:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
functions=$(aws --profile $PROFILE lambda list-functions --region eu-west-1 --query 'Functions[*].[FunctionName,Runtime,LastModified]' --output text 2>/dev/null || echo "")
if [ -z "$functions" ]; then
    echo "  No hay funciones Lambda en eu-west-1"
else
    echo "$functions" | while read -r line; do
        echo -e "${GREEN}✓${NC} $line"
    done
fi
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}CloudFront Distributions:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
distributions=$(aws --profile $PROFILE cloudfront list-distributions --query 'DistributionList.Items[*].[Id,DomainName,Status]' --output text 2>/dev/null || echo "")
if [ -z "$distributions" ]; then
    echo "  No hay distribuciones CloudFront"
else
    echo "$distributions" | while read -r line; do
        echo -e "${GREEN}✓${NC} $line"
    done
fi
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    Inventario Completado                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${YELLOW}Nota:${NC} Este script solo revisa eu-west-1 para EC2/RDS/Lambda."
echo "      S3 y CloudFront son servicios globales."
echo ""
