#!/bin/bash

# Script untuk mengaktifkan HTTPS (SSL) pada domain cemoca.org dan cemoca.cloud
# Jalankan script ini di server via SSH

set -e

EMAIL="admin@cemoca.org"
DOMAINS="-d cemoca.org -d www.cemoca.org -d cemoca.cloud -d www.cemoca.cloud"

echo "🔐 Memulai setup HTTPS..."

# 1. Install Certbot jika belum ada
if ! command -v certbot >/dev/null 2>&1; then
    echo "📦 Menginstall Certbot..."
    if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
    elif command -v yum >/dev/null 2>&1; then
        sudo yum install -y certbot python3-certbot-nginx
    fi
fi

# 2. Jalankan Certbot
echo "🚀 Requesting SSL Certificates for: $DOMAINS"
echo "   Email: $EMAIL"

# Stop Nginx sebentar untuk memastikan tidak ada konflik (opsional, tapi kadang membantu)
# sudo systemctl stop nginx

# Jalankan certbot dengan plugin nginx
sudo certbot --nginx $DOMAINS --non-interactive --agree-tos -m "$EMAIL" --redirect

# 3. Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo ""
echo "✅ HTTPS Berhasil Diaktifkan!"
echo "   Coba akses: https://cemoca.org atau https://cemoca.cloud"
