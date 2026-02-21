#!/bin/bash

# AWS CLI Setup Helper for HappyHub
# This script helps configure AWS CLI credentials for the project

echo "==================================="
echo "HappyHub AWS CLI Setup"
echo "==================================="
echo ""

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CREDENTIALS_FILE="$PROJECT_ROOT/aws-credentials-cli.local"
CONFIG_FILE="$PROJECT_ROOT/aws-config-cli.local"

# Check if credential files exist
if [ ! -f "$CREDENTIALS_FILE" ]; then
    echo "❌ Error: Credentials file not found at $CREDENTIALS_FILE"
    exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Error: Config file not found at $CONFIG_FILE"
    exit 1
fi

echo "✅ Credential files found"
echo ""
echo "Choose setup method:"
echo ""
echo "1) Export environment variables (session only)"
echo "2) Configure AWS CLI profile (persistent)"
echo "3) Show credentials (for manual setup)"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "Copy and paste these commands to set up your session:"
        echo ""
        echo "export AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID"
        echo "export AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY"
        echo "export AWS_DEFAULT_REGION=eu-west-1"
        echo "export AWS_PROFILE=happyhub-cli"
        echo ""
        ;;
    2)
        echo ""
        echo "Configuring AWS CLI profile..."

        # Create ~/.aws directory if it doesn't exist
        mkdir -p ~/.aws

        # Append profile to credentials if not exists
        if grep -q "\[happyhub-cli\]" ~/.aws/credentials 2>/dev/null; then
            echo "⚠️  Profile 'happyhub-cli' already exists in ~/.aws/credentials"
        else
            echo "" >> ~/.aws/credentials
            cat "$CREDENTIALS_FILE" >> ~/.aws/credentials
            echo "✅ Added profile to ~/.aws/credentials"
        fi

        # Append profile to config if not exists
        if grep -q "\[profile happyhub-cli\]" ~/.aws/config 2>/dev/null; then
            echo "⚠️  Profile 'happyhub-cli' already exists in ~/.aws/config"
        else
            echo "" >> ~/.aws/config
            cat "$CONFIG_FILE" >> ~/.aws/config
            echo "✅ Added profile to ~/.aws/config"
        fi

        echo ""
        echo "Profile configured! Use it with:"
        echo "  aws --profile happyhub-cli <command>"
        echo ""
        echo "Or set as default for this session:"
        echo "  export AWS_PROFILE=happyhub-cli"
        ;;
    3)
        echo ""
        echo "=== AWS Credentials ==="
        cat "$CREDENTIALS_FILE"
        echo ""
        echo "=== AWS Config ==="
        cat "$CONFIG_FILE"
        echo ""
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📚 Quick reference:"
echo "  - User: happyhub-cli"
echo "  - Region: eu-west-1"
echo "  - Account: 128959995116"
echo ""
echo "Test connection:"
echo "  aws --profile happyhub-cli sts get-caller-identity"
echo ""
