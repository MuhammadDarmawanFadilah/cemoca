#!/bin/bash

# CAMOCA Backend Redeploy Script
# Script untuk redeploy backend aplikasi CAMOCA

set -e

echo "🚀 Starting CAMOCA Backend Redeploy..."
echo "======================================="

# Variables
REPO_DIR="/opt/camoca/app"
TOMCAT_DIR="/opt/tomcat"
WAR_NAME="camoca.war"
GITHUB_REPO="https://github.com/MuhammadDarmawanFadilah/cemoca.git"

# Step 1: Pull latest code
echo "📥 Pulling latest code from repository..."
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

# Step 2: Build backend
echo "🔨 Building backend..."
cd $REPO_DIR/backend
sudo cp src/main/resources/application-prod.properties src/main/resources/application.properties
sudo mvn clean package -DskipTests
echo "✅ Backend built"

# Step 3: Remove old deployment
echo "🗑️  Removing old deployment..."
if [ -f "$TOMCAT_DIR/webapps/$WAR_NAME" ]; then
    sudo rm -f $TOMCAT_DIR/webapps/$WAR_NAME
fi
if [ -d "$TOMCAT_DIR/webapps/camoca" ]; then
    sudo rm -rf $TOMCAT_DIR/webapps/camoca
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
if curl -s http://localhost:8080/camoca/api > /dev/null; then
    echo "✅ Backend API OK"
else
    echo "⚠️  Backend API not responding yet"
    echo "📋 Check logs: sudo tail -f $TOMCAT_DIR/logs/catalina.out"
fi

echo ""
echo "🎉 CAMOCA BACKEND REDEPLOY COMPLETED!"
echo "====================================="
echo "✅ WAR: $TOMCAT_DIR/webapps/$WAR_NAME"
echo "✅ API: http://srv906504.hstgr.cloud/camoca/api"
echo "✅ Deployment Time: $(date)"
echo ""
echo "📝 Logs command: sudo tail -f $TOMCAT_DIR/logs/catalina.out"
echo "🔄 Restart command: sudo systemctl restart tomcat"
