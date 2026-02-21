#!/bin/bash

# Helper script para establecer variables de entorno AWS para HappyHub
# Uso: source ./scripts/set-aws-env.sh

echo "Configurando variables de entorno AWS para HappyHub..."

export AWS_PROFILE=happyhub-cli
export AWS_REGION=eu-west-1
export AWS_DEFAULT_REGION=eu-west-1

echo "✓ Variables configuradas:"
echo "  AWS_PROFILE=$AWS_PROFILE"
echo "  AWS_REGION=$AWS_REGION"
echo "  AWS_DEFAULT_REGION=$AWS_DEFAULT_REGION"
echo ""
echo "Ahora puedes usar AWS CLI sin especificar --profile:"
echo "  aws s3 ls"
echo "  aws ec2 describe-regions"
echo ""
