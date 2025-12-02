#!/bin/bash

# CAMOCA - Frontend Redeploy Script
# Server: srv906504.hstgr.cloud

set -e

echo "🚀 Starting CAMOCA Frontend Redeploy..."
echo "========================================"

# Variables
REPO_DIR="/opt/camoca/app"
FRONTEND_DIR="/opt/camoca/app/frontend"
SERVICE_NAME="camoca-frontend"
# Clone from public repo or use SSH
GITHUB_REPO="https://github.com/MuhammadDarmawanFadilah/cemoca.git"

# Find PM2 path - try multiple locations
if command -v pm2 &> /dev/null; then
    PM2_PATH="pm2"
elif [ -f "/root/.local/share/pnpm/pm2" ]; then
    PM2_PATH="/root/.local/share/pnpm/pm2"
elif [ -d "/root/.nvm/versions/node" ]; then
    NVM_NODE=$(ls /root/.nvm/versions/node 2>/dev/null | tail -1)
    if [ -n "$NVM_NODE" ] && [ -f "/root/.nvm/versions/node/$NVM_NODE/bin/pm2" ]; then
        PM2_PATH="/root/.nvm/versions/node/$NVM_NODE/bin/pm2"
    fi
elif [ -f "/usr/local/bin/pm2" ]; then
    PM2_PATH="/usr/local/bin/pm2"
else
    PM2_PATH=$(find /root -name "pm2" -type f 2>/dev/null | head -1)
fi

if [ -z "$PM2_PATH" ]; then
    echo "❌ PM2 not found! Installing..."
    npm install -g pm2
    PM2_PATH="pm2"
fi

echo "📍 Using PM2 at: $PM2_PATH"

# Step 1: Stop frontend
echo "⏹️  Stopping frontend..."
"$PM2_PATH" stop $SERVICE_NAME 2>/dev/null || true
echo "✅ Frontend stopped"

# Step 2: Pull latest code
echo "📥 Pulling latest code..."
if [ -d "$REPO_DIR/.git" ]; then
    cd $REPO_DIR
    sudo git fetch --all
    sudo git reset --hard origin/main
    sudo git pull origin main
    echo "✅ Code updated"
else
    echo "❌ Repository not found. Run deployment-init.sh first!"
    exit 1
fi

# Step 3: Build frontend
echo "🔨 Building frontend..."
cd $FRONTEND_DIR
sudo cp .env.prod .env.local
sudo cp .env.prod .env.production
sudo pnpm install
sudo rm -rf .next
sudo pnpm build
echo "✅ Frontend built"

# Step 4: Start frontend
echo "▶️  Starting frontend..."
"$PM2_PATH" delete $SERVICE_NAME 2>/dev/null || true
"$PM2_PATH" start $FRONTEND_DIR/ecosystem.config.js
"$PM2_PATH" save
echo "✅ Frontend started"

# Step 5: Reload Nginx
echo "🔄 Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx
echo "✅ Nginx reloaded"

# Step 6: Verify
echo "⏳ Waiting for startup..."
sleep 5

if curl -s http://localhost:3003 > /dev/null; then
    echo "✅ Frontend OK"
else
    echo "⚠️  Frontend not responding yet"
fi

echo ""
echo "🎉 CAMOCA FRONTEND REDEPLOY COMPLETED!"
echo "======================================"
echo "✅ Service: $SERVICE_NAME"
echo "✅ Port: 3003"
echo "✅ URL: http://srv906504.hstgr.cloud"
echo "✅ Time: $(date)"
echo ""
echo "📝 Logs: \"$PM2_PATH\" logs $SERVICE_NAME"
