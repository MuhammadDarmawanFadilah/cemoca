#!/bin/bash

# CEMOCA Frontend Redeploy Script
# Script untuk redeploy frontend aplikasi CEMOCA

set -e

echo "🚀 Starting CEMOCA Frontend Redeploy..."
echo "========================================"

# Variables
REPO_DIR="/opt/cemoca/app"
FRONTEND_DIR="/opt/cemoca/app/frontend"
SERVICE_NAME="cemoca-frontend"
GITHUB_REPO="https://github.com/MuhammadDarmawanFadilah/cemoca.git"

with_github_token() {
    if [ -z "${GITHUB_TOKEN:-}" ]; then
        "$@"
        return $?
    fi

    local tmp_home
    local code
    tmp_home=$(mktemp -d)
    chmod 700 "$tmp_home"
    cat > "$tmp_home/.netrc" << EOF
machine github.com
login x-access-token
password ${GITHUB_TOKEN}
EOF
    chmod 600 "$tmp_home/.netrc"

    code=0
    HOME="$tmp_home" GIT_TERMINAL_PROMPT=0 "$@" || code=$?
    rm -rf "$tmp_home"
    return $code
}

# Step 1: Stop frontend service
echo "⏹️  Stopping frontend service..."
sudo systemctl stop $SERVICE_NAME || true
echo "✅ Frontend service stopped"

# Step 2: Pull latest code
echo "📥 Pulling latest code from repository..."
if [ -d "$REPO_DIR/.git" ]; then
    cd $REPO_DIR
    with_github_token sudo -E git fetch --all
    sudo git reset --hard origin/main
    with_github_token sudo -E git pull origin main
    echo "✅ Code updated"
else
    echo "❌ Repository not found. Run deployment-init.sh first!"
    exit 1
fi

# Step 3: Setup environment configuration
echo "⚙️  Setting up environment configuration..."
cd $FRONTEND_DIR
sudo cp .env.prod .env.local
sudo cp .env.prod .env.production
echo "✅ Environment configuration ready"

# Step 4: Install dependencies
echo "📦 Installing dependencies..."
pnpm install
echo "✅ Dependencies installed"

# Step 5: Build application
echo "🔨 Building application..."
rm -rf .next
pnpm build
echo "✅ Application built"

# Step 6: Start frontend service
echo "▶️  Starting frontend service..."
sudo systemctl start $SERVICE_NAME
sudo systemctl enable $SERVICE_NAME
echo "✅ Frontend service started"

# Step 7: Wait for service to be ready
echo "⏳ Waiting for service to be ready..."
sleep 5

# Step 8: Reload Nginx
echo "🔄 Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx
echo "✅ Nginx reloaded"

# Step 9: Verify deployment
echo "🔍 Verifying deployment..."
if sudo systemctl is-active --quiet $SERVICE_NAME; then
    echo "✅ Service is running"
    
    if curl -s http://localhost:3008 > /dev/null; then
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

echo ""
echo "🎉 CEMOCA FRONTEND REDEPLOY COMPLETED!"
echo "========================================"
echo "✅ Service: $SERVICE_NAME"
echo "✅ Port: 3008"
echo "✅ Directory: $FRONTEND_DIR"
echo "✅ URL: http://cemoca.org"
echo "✅ Status: $(sudo systemctl is-active $SERVICE_NAME)"
echo "✅ Deployment Time: $(date)"
echo ""
echo "📝 Logs command: sudo journalctl -u $SERVICE_NAME -f"
echo "🔄 Restart command: sudo systemctl restart $SERVICE_NAME"
