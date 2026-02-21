#!/bin/bash

# Monitor happyhub.es domain configuration
# Run this script after changing nameservers in GoDaddy

export AWS_PROFILE=happyhub-cli
export AWS_REGION=eu-west-1
APP_ID="du3to83rdme3o"
DOMAIN="happyhub.es"

echo "=== HappyHub Domain Monitor ==="
echo ""

# Check nameservers
echo "1. Nameservers (should be awsdns-*):"
dig NS $DOMAIN +short
echo ""

# Check if Route53 nameservers are active
NS_CHECK=$(dig NS $DOMAIN +short | grep -c "awsdns")
if [ "$NS_CHECK" -ge 1 ]; then
    echo "✅ Route53 nameservers detected!"
    echo ""

    # Check Amplify domain status
    echo "2. Amplify domain status:"
    aws amplify get-domain-association \
        --app-id $APP_ID \
        --domain-name $DOMAIN \
        --region $AWS_REGION \
        --query 'domainAssociation.{Status:domainStatus,SubDomains:subDomains[*].[subDomainSetting.prefix,verified]}' \
        --output json
    echo ""

    # Check DNS records
    echo "3. DNS records:"
    echo "www.$DOMAIN:"
    dig www.$DOMAIN +short
    echo ""
    echo "$DOMAIN:"
    dig $DOMAIN +short

else
    echo "⏳ Still using old nameservers (GoDaddy)"
    echo "Wait 15-60 minutes and run this script again"
fi

echo ""
echo "=== Next steps ==="
echo "• If nameservers are Route53: Wait 5-30 min for SSL validation"
echo "• If still GoDaddy: Wait and re-run this script"
echo ""
echo "Run: bash scripts/monitor-domain.sh"
