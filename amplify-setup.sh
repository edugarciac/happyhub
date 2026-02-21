#!/bin/bash

# Script to configure Amplify via AWS CLI
# Run this if web console is difficult to navigate

export AWS_PROFILE=happyhub-cli
export AWS_REGION=eu-west-1
APP_ID="du3to83rdme3o"
BRANCH_NAME="001-email-password-auth"

echo "🔧 Connecting branch to Amplify..."

# Try to create branch connection
aws amplify create-branch \
  --app-id $APP_ID \
  --branch-name $BRANCH_NAME \
  --region $AWS_REGION \
  --enable-auto-build \
  --stage PRODUCTION 2>&1

echo ""
echo "📝 Setting environment variables..."

# Set environment variables
aws amplify update-app \
  --app-id $APP_ID \
  --region $AWS_REGION \
  --environment-variables \
    DATABASE_URL="postgresql://neondb_owner:npg_zr5iRHB3pgLw@ep-morning-sky-abwuz6yr.eu-west-2.aws.neon.tech/neondb?sslmode=require" \
    DB_HOST="ep-morning-sky-abwuz6yr.eu-west-2.aws.neon.tech" \
    DB_PORT="5432" \
    DB_NAME="neondb" \
    DB_USER="neondb_owner" \
    DB_PASSWORD="npg_zr5iRHB3pgLw" \
    JWT_SECRET="DzPoFSc1AaxJeiH89j/G6RD/eXkSS0Xy7Jl7ZDKjHfg=" 2>&1

echo ""
echo "🚀 Starting deployment..."

# Trigger build
aws amplify start-job \
  --app-id $APP_ID \
  --branch-name $BRANCH_NAME \
  --job-type RELEASE \
  --region $AWS_REGION 2>&1

echo ""
echo "✅ Configuration complete!"
echo ""
echo "Monitor deployment at:"
echo "https://console.aws.amazon.com/amplify/home?region=eu-west-1#/$APP_ID"
