#!/bin/bash

# SSL Setup Script for Let's Encrypt

DOMAIN="mailingnanshit.duckdns.org"
EMAIL="shivamkoshyari43@gmail.com"  # Change to your email

echo "🔒 Setting up SSL certificate for $DOMAIN..."

# Create directories
mkdir -p ssl/letsencrypt
mkdir -p ssl/certbot

# Generate dummy certificate for Nginx to start
echo "📝 Generating temporary self-signed certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/letsencrypt/live/$DOMAIN/privkey.pem \
  -out ssl/letsencrypt/live/$DOMAIN/fullchain.pem \
  -subj "/CN=$DOMAIN" 2>/dev/null || true

mkdir -p ssl/letsencrypt/live/$DOMAIN

# Start Nginx with dummy cert
echo "🚀 Starting Nginx..."
sudo docker-compose up -d nginx

sleep 5

# Install Certbot
echo "📥 Installing Certbot..."
sudo apt-get update -qq
sudo apt-get install -y certbot > /dev/null 2>&1

# Get real Let's Encrypt certificate
echo "🔐 Requesting Let's Encrypt certificate..."
sudo certbot certonly --standalone \
  -d $DOMAIN \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  --non-interactive \
  --cert-path ssl/letsencrypt/live/$DOMAIN/fullchain.pem

# Copy certificates to persistent location
sudo cp -r /etc/letsencrypt/live/$DOMAIN/* ssl/letsencrypt/live/$DOMAIN/ 2>/dev/null || true
sudo chown -R $USER:$USER ssl/letsencrypt

echo "✅ SSL certificate installed!"
echo "🔄 Restarting services..."

sudo docker-compose restart nginx

echo "✅ Done! Access: https://$DOMAIN"
