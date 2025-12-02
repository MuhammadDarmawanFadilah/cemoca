#!/bin/bash

# CAMOCA Frontend Redeploy Script
# Server: srv906504.hstgr.cloud

set -e  # Exit on any error

echo "🚀 Starting CAMOCA Frontend Redeploy..."
echo "========================================"

# Variables
REPO_DIR="/opt/camoca/app"
FRONTEND_DIR="/opt/camoca/app/frontend"
SERVICE_NAME="camoca-frontend"
GITHUB_REPO="https://github.com/MuhammadDarmawanFadilah/cemoca.git"

# Step 1: Stop frontend service
echo "⏹️  Stopping frontend service..."
sudo systemctl stop $SERVICE_NAME 2>/dev/null || true
echo "✅ Frontend service stopped"

# Step 2: Pull latest code
echo "📥 Pulling latest code from repository..."
if [ -d "$REPO_DIR/.git" ]; then
    echo "✅ Valid git repository found, updating..."
    cd $REPO_DIR
    sudo git fetch --all
    sudo git reset --hard origin/main
    sudo git pull origin main
    echo "✅ Code updated from existing repository"
else
    echo "❌ Repository not found. Run deployment-init.sh first!"
    exit 1
fi

# Step 3: Navigate to frontend directory
cd $FRONTEND_DIR
echo "📁 Working in: $(pwd)"

# Step 4: Setup environment configuration
echo "⚙️  Setting up environment configuration..."
sudo cp .env.prod .env.local
sudo cp .env.prod .env.production
echo "✅ Environment configuration ready"

# Step 5: Install dependencies
echo "📦 Installing dependencies..."
sudo pnpm install
echo "✅ Dependencies installed"

# Step 6: Build application
echo "🔨 Building application..."
sudo rm -rf .next
sudo pnpm build
echo "✅ Application built successfully"

# Step 7: Start frontend service
echo "▶️  Starting frontend service..."
sudo systemctl start $SERVICE_NAME
sudo systemctl enable $SERVICE_NAME
echo "✅ Frontend service started"

# Step 8: Wait for service to be ready
echo "⏳ Waiting for service to be ready..."
sleep 5

# Step 9: Reload Nginx
echo "🔄 Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx
echo "✅ Nginx reloaded"

# Step 10: Verify deployment
echo "🔍 Verifying deployment..."
if sudo systemctl is-active --quiet $SERVICE_NAME; then
    echo "✅ Service is running"
    
    # Test local connection
    if curl -s http://localhost:3003 > /dev/null; then
        echo "✅ Local connection successful"
    else
        echo "⚠️  Local connection failed"
    fi
else
    echo "❌ Service failed to start"
    echo "📋 Service status:"
    sudo systemctl status $SERVICE_NAME --no-pager
    exit 1
fi

# Step 11: Show deployment summary
echo ""
echo "🎉 CAMOCA FRONTEND REDEPLOY COMPLETED!"
echo "========================================"
echo "✅ Service: $SERVICE_NAME"
echo "✅ Port: 3003"
echo "✅ Directory: $FRONTEND_DIR"
echo "✅ URL: http://srv906504.hstgr.cloud"
echo "✅ Status: $(sudo systemctl is-active $SERVICE_NAME)"
echo "✅ Deployment Time: $(date)"
echo ""
echo "📊 Service Status:"
sudo systemctl status $SERVICE_NAME --no-pager -l
echo ""
echo "📝 Logs command: sudo journalctl -u $SERVICE_NAME -f"
echo "🔄 Restart command: sudo systemctl restart $SERVICE_NAME"
