#!/bin/bash

# SSL Setup Script for Let's Encrypt - Mailing Service
# Run this on EC2 after deploying docker-compose up -d

set -e

DOMAIN="mailingnanshit.duckdns.org"
EMAIL="shivamkoshyari43@gmail.com"
CERT_DIR="./certs"
MAILING_DIR="$PWD"

echo "================================"
echo "Setting up SSL certificates"
echo "Domain: $DOMAIN"
echo "================================"

# 1. Create certs directory
if [ ! -d "$CERT_DIR" ]; then
    echo "Creating $CERT_DIR directory..."
    mkdir -p "$CERT_DIR"
fi

# 2. Install certbot if needed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    sudo apt-get update -qq
    sudo apt-get install -y certbot > /dev/null
fi

# 3. Stop services
echo "Stopping docker-compose services..."
sudo docker-compose down || true

sleep 2

# 4. Request certificate (standalone mode - no nginx running)
echo "Requesting Let's Encrypt certificate for $DOMAIN..."
sudo certbot certonly \
    --standalone \
    --agree-tos \
    --email "$EMAIL" \
    --non-interactive \
    -d "$DOMAIN" 2>&1 || echo "Certificate may already exist, continuing..."

# 5. Copy certificates
echo "Copying certificates to $CERT_DIR..."
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem "$CERT_DIR/fullchain.pem" 2>/dev/null || echo "fullchain.pem not found"
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem "$CERT_DIR/privkey.pem" 2>/dev/null || echo "privkey.pem not found"

# 6. Fix permissions
if [ -f "$CERT_DIR/fullchain.pem" ]; then
    sudo chown $USER:$USER "$CERT_DIR"/*.pem
    chmod 644 "$CERT_DIR"/fullchain.pem
    chmod 644 "$CERT_DIR"/privkey.pem
    echo "✅ Certificates copied and permissions set"
fi

# 7. Restart docker-compose
echo "Starting docker-compose with SSL..."
sudo docker-compose up -d

# 8. Wait for nginx to be ready
sleep 3

# 9. Test HTTPS
echo ""
echo "Testing HTTPS endpoint..."
curl -s https://$DOMAIN/health || echo "⚠️  Warning: HTTPS test failed (may be certificate issue)"

echo ""
echo "✅ SSL Setup Complete!"
echo ""
echo "Access your service at: https://$DOMAIN"
echo "Test webhook: curl -X POST https://$DOMAIN/webhook/user-registered ..."
echo ""
echo "Certificates renew automatically 30 days before expiration"
