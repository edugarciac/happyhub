#!/bin/bash

# Continuous monitoring of happyhub.es domain propagation
# Checks every 5 minutes until Route53 nameservers are detected

export AWS_PROFILE=happyhub-cli
export AWS_REGION=eu-west-1
APP_ID="du3to83rdme3o"
DOMAIN="happyhub.es"
INTERVAL=300  # 5 minutes

echo "🔄 Monitoring happyhub.es domain propagation..."
echo "⏱️  Checking every 5 minutes. Press Ctrl+C to stop."
echo ""

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$TIMESTAMP] Checking nameservers..."

    # Check nameservers
    NAMESERVERS=$(dig NS $DOMAIN +short)
    echo "$NAMESERVERS"

    # Check if Route53 nameservers are active
    NS_CHECK=$(echo "$NAMESERVERS" | grep -c "awsdns")

    if [ "$NS_CHECK" -ge 1 ]; then
        echo ""
        echo "✅ SUCCESS! Route53 nameservers detected!"
        echo ""
        echo "Checking Amplify domain status..."

        STATUS=$(aws amplify get-domain-association \
            --app-id $APP_ID \
            --domain-name $DOMAIN \
            --region $AWS_REGION \
            --query 'domainAssociation.domainStatus' \
            --output text)

        echo "Amplify Status: $STATUS"
        echo ""

        if [ "$STATUS" = "AVAILABLE" ]; then
            echo "🎉 DOMAIN FULLY CONFIGURED!"
            echo ""
            echo "Testing URLs:"
            echo "• https://www.happyhub.es"
            echo "• https://happyhub.es"
            echo ""
            exit 0
        elif [ "$STATUS" = "PENDING_VERIFICATION" ]; then
            echo "⏳ SSL certificate validation in progress..."
            echo "This usually takes 5-30 minutes."
            echo "Continuing to monitor..."
        else
            echo "Status: $STATUS"
            echo "Continuing to monitor..."
        fi
    else
        echo "⏳ Still propagating (GoDaddy nameservers)"
    fi

    echo ""
    echo "Next check in 5 minutes..."
    echo "---"
    echo ""

    sleep $INTERVAL
done
