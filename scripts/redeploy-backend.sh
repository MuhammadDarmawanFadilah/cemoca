#!/bin/bash

# CEMOCA Backend Redeploy Script
# Script untuk redeploy backend aplikasi CEMOCA

set -e

echo "🚀 Starting CEMOCA Backend Redeploy..."
echo "======================================="

# Variables
REPO_DIR="/opt/cemoca/app"
TOMCAT_DIR="/opt/tomcat"
WAR_NAME="cemoca.war"
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

# Step 1: Pull latest code
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

# Step 2: Build backend
echo "🔨 Building backend..."
cd $REPO_DIR/backend
sudo cp src/main/resources/application-prod.properties src/main/resources/application.properties
sudo mvn clean package -DskipTests
echo "✅ Backend built"

# Ensure log directories exist
sudo mkdir -p /opt/cemoca/logs/{application,scheduler}

# Step 3: Remove old deployment
echo "🗑️  Removing old deployment..."
if [ -f "$TOMCAT_DIR/webapps/$WAR_NAME" ]; then
    sudo rm -f $TOMCAT_DIR/webapps/$WAR_NAME
fi
if [ -d "$TOMCAT_DIR/webapps/cemoca" ]; then
    sudo rm -rf $TOMCAT_DIR/webapps/cemoca
fi
echo "✅ Old deployment removed"

# Step 4: Deploy new WAR
echo "🚀 Deploying new WAR..."
sudo cp target/backend.war $TOMCAT_DIR/webapps/$WAR_NAME
sudo chown root:root $TOMCAT_DIR/webapps/$WAR_NAME
sudo chmod 644 $TOMCAT_DIR/webapps/$WAR_NAME
echo "✅ WAR deployed"

# Step 5: Restart Tomcat
echo "🔄 Restarting Tomcat..."
sudo systemctl restart tomcat
echo "✅ Tomcat restarted"

# Step 6: Wait for deployment
echo "⏳ Waiting for deployment..."
sleep 15

# Step 7: Verify deployment
echo "🔍 Verifying deployment..."
if curl -s http://localhost:8080/cemoca/api > /dev/null; then
    echo "✅ Backend API OK"
else
    echo "⚠️  Backend API not responding yet"
    echo "📋 Check logs: sudo tail -f $TOMCAT_DIR/logs/catalina.out"
fi

echo ""
echo "🎉 CEMOCA BACKEND REDEPLOY COMPLETED!"
echo "====================================="
echo "✅ WAR: $TOMCAT_DIR/webapps/$WAR_NAME"
echo "✅ API: http://cemoca.org/cemoca/api"
echo "✅ Deployment Time: $(date)"
echo ""
echo "📝 Logs command: sudo tail -f $TOMCAT_DIR/logs/catalina.out"
echo "🔄 Restart command: sudo systemctl restart tomcat"
