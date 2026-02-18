# AWS CLI Credentials - HappyHub

Credenciales para operaciones de AWS CLI en el proyecto HappyHub.

## 📁 Archivos de Credenciales

Las credenciales CLI están almacenadas de forma segura en estos archivos (**no se suben a GitHub**):

- `aws-credentials-cli.json` - Credenciales en formato JSON
- `aws-credentials-cli.local` - Credenciales en formato AWS CLI estándar
- `aws-config-cli.local` - Configuración del perfil AWS CLI
- `.env.local` - Variables de entorno (incluye ambas credenciales: user y CLI)

## 🔐 Información de la Cuenta CLI

- **User**: happyhub-cli
- **Region**: eu-west-1 (Europa - Irlanda)
- **Account ID**: 128959995116
- **Access Key**: AKIAXXXXXXXXXXXXXX

## 🚀 Configuración Rápida

### Opción 1: Script Automático (Recomendado)

```bash
./scripts/aws-cli-setup.sh
```

Este script te permite:
1. Exportar variables de entorno para la sesión actual
2. Configurar perfil persistente en `~/.aws/`
3. Ver credenciales para configuración manual

### Opción 2: Variables de Entorno (Sesión Temporal)

```bash
export AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXX
export AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY_HERE
export AWS_DEFAULT_REGION=eu-west-1
export AWS_PROFILE=happyhub-cli
```

### Opción 3: Perfil AWS CLI (Configuración Persistente)

Añadir al archivo `~/.aws/credentials`:

```ini
[happyhub-cli]
aws_access_key_id = AKIAXXXXXXXXXXXXXX
aws_secret_access_key = YOUR_SECRET_ACCESS_KEY_HERE
region = eu-west-1
```

Añadir al archivo `~/.aws/config`:

```ini
[profile happyhub-cli]
region = eu-west-1
output = json
```

## 📝 Uso con AWS CLI

### Usando el perfil configurado:

```bash
# Verificar identidad
aws --profile happyhub-cli sts get-caller-identity

# Listar buckets S3
aws --profile happyhub-cli s3 ls

# Subir archivo a S3
aws --profile happyhub-cli s3 cp file.txt s3://bucket-name/

# Lambda functions
aws --profile happyhub-cli lambda list-functions
```

### Establecer como perfil predeterminado para la sesión:

```bash
export AWS_PROFILE=happyhub-cli

# Ahora puedes usar AWS CLI sin --profile
aws sts get-caller-identity
aws s3 ls
```

## 🔍 Verificar Configuración

```bash
# Verificar identidad (debería mostrar happyhub-cli)
aws --profile happyhub-cli sts get-caller-identity

# Verificar región
aws --profile happyhub-cli configure get region

# Listar configuración del perfil
aws --profile happyhub-cli configure list
```

## 🛠️ Comandos Comunes

### S3 Operations
```bash
# List buckets
aws --profile happyhub-cli s3 ls

# Create bucket in eu-west-1
aws --profile happyhub-cli s3 mb s3://happyhub-assets --region eu-west-1

# Sync local folder to S3
aws --profile happyhub-cli s3 sync ./public s3://happyhub-assets/public/
```

### Lambda Operations
```bash
# List functions
aws --profile happyhub-cli lambda list-functions

# Invoke function
aws --profile happyhub-cli lambda invoke \
  --function-name myFunction \
  --payload '{"key":"value"}' \
  response.json
```

### CloudFormation
```bash
# Deploy stack
aws --profile happyhub-cli cloudformation deploy \
  --template-file template.yaml \
  --stack-name happyhub-stack

# List stacks
aws --profile happyhub-cli cloudformation list-stacks
```

## ⚠️ Seguridad

### Archivos Protegidos
Los siguientes archivos están en `.gitignore` y **NUNCA** deben subirse a GitHub:
- ✅ `aws-credentials-cli.json`
- ✅ `aws-credentials-cli.local`
- ✅ `aws-config-cli.local`
- ✅ `.env.local`
- ✅ `aws-credentials.json`
- ✅ `airtable-credentials.json`

### Verificar Seguridad
```bash
# Verificar que archivos estén ignorados
git check-ignore aws-credentials-cli.json aws-credentials-cli.local

# Ver archivos que serían commiteados
git status --short
```

## 📚 Diferencia entre Usuarios

El proyecto tiene **dos usuarios AWS**:

### 1. Usuario Principal (edugarciac)
- **Propósito**: Acceso desde aplicación Node.js/Next.js
- **Ubicación**: `.env.local`
- **Variables**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- **Uso**: `process.env.AWS_ACCESS_KEY_ID`

### 2. Usuario CLI (happyhub-cli)
- **Propósito**: Operaciones desde terminal con AWS CLI
- **Ubicación**: `aws-credentials-cli.local`, `.env.local`
- **Variables**: `AWS_CLI_ACCESS_KEY_ID`, `AWS_CLI_SECRET_ACCESS_KEY`
- **Uso**: `aws --profile happyhub-cli <command>`

## 🆘 Troubleshooting

### Error: "Unable to locate credentials"
```bash
# Verificar que el perfil existe
cat ~/.aws/credentials | grep happyhub-cli

# O usar variables de entorno
export AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXX
export AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY_HERE
```

### Error: "Region not found"
```bash
# Especificar región explícitamente
aws --profile happyhub-cli --region eu-west-1 s3 ls
```

### Permisos insuficientes
Contactar con el administrador de AWS para verificar políticas IAM del usuario `happyhub-cli`.

## 📖 Referencias

- [AWS CLI Configuration](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- [AWS Profiles](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html)
- [AWS Environment Variables](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html)
