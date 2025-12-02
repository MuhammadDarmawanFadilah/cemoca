#!/bin/bash

# CAMOCA - Initial Deployment Script
# Run this script ONCE for first time deployment
# Server: srv906504.hstgr.cloud

set -e

echo "🚀 Starting CAMOCA Initial Deployment..."
echo "=========================================="

# Variables
REPO_DIR="/opt/camoca/app"
TOMCAT_DIR="/opt/tomcat"
WAR_NAME="camoca.war"
UPLOADS_DIR="/opt/camoca/uploads"
LOGS_DIR="/opt/camoca/logs"
FRONTEND_DIR="/opt/camoca/app/frontend"
SERVICE_NAME="camoca-frontend"
GITHUB_REPO="https://github.com/MuhammadDarmawanFadilah/cemoca.git"

# Step 1: Create directories
echo "📁 Creating directories..."
sudo mkdir -p /opt/camoca/uploads/{images,documents,videos,pdfs}
sudo mkdir -p /opt/camoca/logs
sudo mkdir -p /opt/camoca/app
sudo chown -R root:root /opt/camoca
sudo chmod -R 755 /opt/camoca
echo "✅ Directories created"

# Step 2: Create database
echo "🗄️  Creating database..."
mysql -u root -e "CREATE DATABASE IF NOT EXISTS camoca_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo "✅ Database camoca_db created"

# Step 3: Clone repository
echo "📥 Cloning repository..."
if [ -d "$REPO_DIR" ]; then
    sudo rm -rf $REPO_DIR
fi
cd /opt/camoca
sudo git clone $GITHUB_REPO app
echo "✅ Repository cloned"

# Step 4: Build and deploy backend
echo "🔨 Building backend..."
cd $REPO_DIR/backend
sudo cp src/main/resources/application-prod.properties src/main/resources/application.properties
sudo mvn clean package -DskipTests
echo "✅ Backend built"

echo "🚀 Deploying backend..."
sudo cp target/backend.war $TOMCAT_DIR/webapps/$WAR_NAME
sudo chown root:root $TOMCAT_DIR/webapps/$WAR_NAME
sudo systemctl restart tomcat
echo "✅ Backend deployed"

# Step 5: Build frontend
echo "🔨 Building frontend..."
cd $FRONTEND_DIR
sudo cp .env.prod .env.local
sudo cp .env.prod .env.production
sudo pnpm install
sudo pnpm build
echo "✅ Frontend built"

# Step 6: Create systemd service for frontend (similar to ikafk-frontend)
echo "⚙️  Creating systemd service..."
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null << EOF
[Unit]
Description=CAMOCA Frontend (Next.js)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$FRONTEND_DIR
ExecStart=/usr/bin/pnpm start
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=$SERVICE_NAME
Environment=NODE_ENV=production
Environment=PORT=3003

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME
echo "✅ Frontend service created and started"

# Step 7: Create Nginx config (only for camoca, don't touch other sites)
echo "🌐 Creating Nginx config..."
sudo tee /etc/nginx/sites-available/camoca > /dev/null << 'EOF'
server {
    listen 80;
    server_name srv906504.hstgr.cloud 31.97.110.194;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /camoca {
        proxy_pass http://127.0.0.1:8080/camoca;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        client_max_body_size 150M;
    }

    location /uploads {
        alias /opt/camoca/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/camoca /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
echo "✅ Nginx configured"

# Step 8: Verify
echo "🔍 Verifying deployment..."
sleep 10

if curl -s http://localhost:8080/camoca/api > /dev/null; then
    echo "✅ Backend API OK"
else
    echo "⚠️  Backend API not responding yet"
fi

if curl -s http://localhost:3003 > /dev/null; then
    echo "✅ Frontend OK"
else
    echo "⚠️  Frontend not responding yet"
fi

echo ""
echo "🎉 CAMOCA INITIAL DEPLOYMENT COMPLETED!"
echo "========================================"
echo "✅ Database: camoca_db"
echo "✅ Backend: http://srv906504.hstgr.cloud/camoca/api"
echo "✅ Frontend: http://srv906504.hstgr.cloud"
echo "✅ Uploads: /opt/camoca/uploads"
echo "✅ Service: $SERVICE_NAME"
echo ""
echo "📝 Logs:"
echo "   Backend: sudo tail -f /opt/tomcat/logs/catalina.out"
echo "   Frontend: sudo journalctl -u $SERVICE_NAME -f"
echo ""
echo "🔄 Commands:"
echo "   Restart frontend: sudo systemctl restart $SERVICE_NAME"
echo "   Restart backend: sudo systemctl restart tomcat"
echo "   Status: sudo systemctl status $SERVICE_NAME"
