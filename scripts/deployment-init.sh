#!/bin/bash

# CEMOCA - Initial Deployment Script
# Run this script ONCE for first time deployment
# Server: cemoca.org (72.61.208.104)

set -e

# This script uses bash features. If invoked as `sh deployment-init.sh`, it will fail.
if [ -z "${BASH_VERSION:-}" ]; then
    echo "❌ Please run with bash: bash deployment-init.sh (or: chmod +x deployment-init.sh; ./deployment-init.sh)"
    exit 1
fi

echo "🚀 Starting CEMOCA Initial Deployment..."
echo "=========================================="

# Variables
REPO_DIR="/opt/cemoca/app"
TOMCAT_DIR="/opt/tomcat"
WAR_NAME="cemoca.war"
UPLOADS_DIR="/opt/cemoca/uploads"
LOGS_DIR="/opt/cemoca/logs"
FRONTEND_DIR="/opt/cemoca/app/frontend"
SERVICE_NAME="cemoca-frontend"
GITHUB_REPO="https://github.com/MuhammadDarmawanFadilah/cemoca.git"

# Tomcat
TOMCAT_VERSION="10.1.28"
TOMCAT_USER="tomcat"
TOMCAT_GROUP="tomcat"
JAVA_PACKAGE="openjdk-25-jdk"
NODE_MAJOR="20"

# Tomcat resources (can be overridden by env vars before running the script)
TOMCAT_XMS="${TOMCAT_XMS:-4G}"
TOMCAT_XMX="${TOMCAT_XMX:-20G}"
TOMCAT_ACTIVE_CPU="${TOMCAT_ACTIVE_CPU:-4}"

# HTTPS (optional)
CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@cemoca.org}"

fix_apt_repos_if_needed() {
    # Some VPS images ship with 3rd-party repos that break `apt-get update`.
    # Disable known-bad Monarx repo (no Release file) if present.
    if ! command -v apt-get >/dev/null 2>&1; then
        return 0
    fi

    local found_files
    found_files=$(sudo grep -RIl "repository\.monarx\.com" /etc/apt/sources.list /etc/apt/sources.list.d 2>/dev/null || true)
    if [ -z "$found_files" ]; then
        return 0
    fi

    echo "⚠️  Disabling broken APT repo entries (repository.monarx.com)..."
    while IFS= read -r f; do
        [ -f "$f" ] || continue

        # Deb822 format (.sources) requires specific fields; commenting only URIs can make the file invalid.
        # Safest: disable the whole file.
        if [[ "$f" == *.sources ]]; then
            sudo mv -f "$f" "${f}.disabled" || true
            continue
        fi

        # Classic list format: comment out any line referencing monarx.
        sudo sed -i -E '/repository\.monarx\.com/ { /^\s*#/! s/^/# / }' "$f" || true
    done <<< "$found_files"
}

install_java_25_debian() {
    # Try distro package first
    if sudo apt-get install -y ${JAVA_PACKAGE}; then
        return 0
    fi

    # Fallback to Adoptium Temurin 25
    sudo apt-get install -y wget apt-transport-https ca-certificates gnupg
    wget -qO- https://packages.adoptium.net/artifactory/api/gpg/key/public | sudo gpg --dearmor -o /usr/share/keyrings/adoptium.gpg
    echo "deb [signed-by=/usr/share/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb $(. /etc/os-release; echo ${VERSION_CODENAME}) main" | sudo tee /etc/apt/sources.list.d/adoptium.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y temurin-25-jdk
}

install_java_25_rhel() {
    # Best-effort for RHEL-like distros
    sudo yum install -y java-25-openjdk java-25-openjdk-devel && return 0
    sudo yum install -y java-25-openjdk && return 0

    # Fallback to Adoptium Temurin 25 RPM
    sudo yum install -y wget ca-certificates gnupg2 || true
    sudo rpm --import https://packages.adoptium.net/artifactory/api/gpg/key/public || true
    sudo tee /etc/yum.repos.d/adoptium.repo > /dev/null << 'EOF'
[Adoptium]
name=Adoptium
baseurl=https://packages.adoptium.net/artifactory/rpm/centos/$releasever/$basearch
enabled=1
gpgcheck=1
gpgkey=https://packages.adoptium.net/artifactory/api/gpg/key/public
EOF
    sudo yum makecache || true
    sudo yum install -y temurin-25-jdk || true
}

git_clone_repo() {
    local repo_url="$1"
    local dest_dir="$2"

    if [ -n "${GITHUB_TOKEN:-}" ]; then
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
        HOME="$tmp_home" GIT_TERMINAL_PROMPT=0 sudo -E git clone "$repo_url" "$dest_dir" || code=$?
        rm -rf "$tmp_home"
        return $code
    else
        sudo git clone "$repo_url" "$dest_dir"
    fi
}

# Step 0: Install dependencies (MySQL, Nginx, Java, Node prerequisites)
echo "🧩 Installing system dependencies..."
if command -v apt-get >/dev/null 2>&1; then
    fix_apt_repos_if_needed
    sudo apt-get update
    sudo apt-get install -y curl git unzip ca-certificates gnupg
    sudo apt-get install -y nginx mysql-server
    install_java_25_debian
    sudo apt-get install -y maven build-essential

    if ! command -v node >/dev/null 2>&1; then
        curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /usr/share/keyrings/nodesource.gpg
        echo "deb [signed-by=/usr/share/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list > /dev/null
        sudo apt-get update
        sudo apt-get install -y nodejs
    fi
elif command -v yum >/dev/null 2>&1; then
    sudo yum makecache
    sudo yum install -y curl git unzip ca-certificates
    sudo yum install -y nginx
    sudo yum install -y mysql-server || sudo yum install -y mariadb-server
    install_java_25_rhel
    sudo yum install -y maven || true

    if ! command -v node >/dev/null 2>&1; then
        sudo yum install -y nodejs || true
    fi
else
    echo "❌ Unsupported OS package manager (need apt-get or yum)"
    exit 1
fi

if command -v corepack >/dev/null 2>&1; then
    sudo corepack enable || true
    sudo corepack prepare pnpm@latest --activate || true
fi

if ! command -v pnpm >/dev/null 2>&1; then
    sudo npm install -g pnpm
fi

echo "✅ System dependencies installed"

# Step 1: Install Tomcat to /opt/tomcat
echo "🐱 Installing Tomcat to ${TOMCAT_DIR}..."
if ! id -u ${TOMCAT_USER} >/dev/null 2>&1; then
    sudo groupadd -f ${TOMCAT_GROUP}
    sudo useradd -M -s /bin/false -g ${TOMCAT_GROUP} ${TOMCAT_USER} || true
fi

if [ ! -d "${TOMCAT_DIR}" ] || [ ! -f "${TOMCAT_DIR}/bin/catalina.sh" ]; then
    sudo rm -rf "${TOMCAT_DIR}"
    cd /tmp
    curl -fsSL "https://archive.apache.org/dist/tomcat/tomcat-10/v${TOMCAT_VERSION}/bin/apache-tomcat-${TOMCAT_VERSION}.tar.gz" -o "apache-tomcat-${TOMCAT_VERSION}.tar.gz"
    sudo mkdir -p "${TOMCAT_DIR}"
    sudo tar -xzf "apache-tomcat-${TOMCAT_VERSION}.tar.gz" --strip-components=1 -C "${TOMCAT_DIR}"
fi

sudo chown -R ${TOMCAT_USER}:${TOMCAT_GROUP} "${TOMCAT_DIR}"
sudo chmod -R 755 "${TOMCAT_DIR}"

echo "⚙️  Creating Tomcat systemd service..."
JAVA_HOME_DETECTED=""
if command -v javac >/dev/null 2>&1; then
    JAVA_BIN=$(readlink -f "$(command -v javac)" || true)
    if [ -n "$JAVA_BIN" ]; then
        JAVA_HOME_DETECTED=$(dirname "$(dirname "$JAVA_BIN")")
    fi
fi
if [ -z "$JAVA_HOME_DETECTED" ] && command -v java >/dev/null 2>&1; then
    JAVA_BIN=$(readlink -f "$(command -v java)" || true)
    if [ -n "$JAVA_BIN" ]; then
        JAVA_HOME_DETECTED=$(dirname "$(dirname "$JAVA_BIN")")
    fi
fi
if [ -z "$JAVA_HOME_DETECTED" ]; then
    JAVA_HOME_DETECTED="/usr/lib/jvm/default-java"
fi

sudo tee /etc/systemd/system/tomcat.service > /dev/null << EOF
[Unit]
Description=Apache Tomcat
After=network.target

[Service]
Type=forking
User=${TOMCAT_USER}
Group=${TOMCAT_GROUP}
Environment=JAVA_HOME=${JAVA_HOME_DETECTED}
Environment=CATALINA_HOME=${TOMCAT_DIR}
Environment=CATALINA_BASE=${TOMCAT_DIR}
Environment=CATALINA_PID=${TOMCAT_DIR}/temp/tomcat.pid
Environment="CATALINA_OPTS=-Xms${TOMCAT_XMS} -Xmx${TOMCAT_XMX} -server -Djava.awt.headless=true -XX:+UseG1GC -XX:ActiveProcessorCount=${TOMCAT_ACTIVE_CPU}"
ExecStart=${TOMCAT_DIR}/bin/startup.sh
ExecStop=${TOMCAT_DIR}/bin/shutdown.sh
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable tomcat
sudo systemctl restart tomcat
echo "✅ Tomcat installed and started"

# Step 2: Create directories
echo "📁 Creating directories..."
sudo mkdir -p /opt/cemoca/uploads/{images,documents,videos,pdfs}
sudo mkdir -p /opt/cemoca/logs/{application,scheduler}
sudo mkdir -p /opt/cemoca/app
sudo chown -R root:root /opt/cemoca
sudo chmod -R 755 /opt/cemoca
echo "✅ Directories created"

# Step 3: Create database
echo "🗄️  Creating database..."
MYSQL_SERVICE=""
for svc in mysql mysqld mariadb; do
    if systemctl list-unit-files 2>/dev/null | grep -q "^${svc}\.service"; then
        MYSQL_SERVICE="$svc"
        break
    fi
done

if [ -n "$MYSQL_SERVICE" ]; then
    sudo systemctl enable "$MYSQL_SERVICE" || true
    sudo systemctl restart "$MYSQL_SERVICE" || true
fi
mysql -u root -e "CREATE DATABASE IF NOT EXISTS cemoca_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || true
echo "✅ Database cemoca_db created"

# Step 4: Clone repository
echo "📥 Cloning repository..."
if [ -d "$REPO_DIR" ]; then
    sudo rm -rf $REPO_DIR
fi
cd /opt/cemoca
git_clone_repo "$GITHUB_REPO" app
echo "✅ Repository cloned"

# Step 5: Build and deploy backend
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

# Step 6: Build frontend
echo "🔨 Building frontend..."
cd $FRONTEND_DIR
sudo cp .env.prod .env.local
sudo cp .env.prod .env.production
sudo pnpm install
sudo pnpm build
echo "✅ Frontend built"

# Step 7: Create systemd service for frontend
echo "⚙️  Creating systemd service..."
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null << EOF
[Unit]
Description=CEMOCA Frontend (Next.js)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$FRONTEND_DIR
ExecStart=/usr/bin/env pnpm start
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=$SERVICE_NAME
Environment=NODE_ENV=production
Environment=PORT=3008

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME
echo "✅ Frontend service created and started"

# Step 8: Create Nginx config (only for cemoca)
echo "🌐 Creating Nginx config..."
NGINX_SITE_AVAILABLE="/etc/nginx/sites-available/cemoca"
NGINX_SITE_ENABLED="/etc/nginx/sites-enabled/cemoca"
NGINX_CONF_D="/etc/nginx/conf.d/cemoca.conf"

if [ -d "/etc/nginx/sites-available" ]; then
    sudo tee "$NGINX_SITE_AVAILABLE" > /dev/null << 'EOF'
server {
    listen 80;
    server_name cemoca.org www.cemoca.org cemoca.cloud www.cemoca.cloud 72.61.208.104;

    location / {
        proxy_pass http://127.0.0.1:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /cemoca {
        proxy_pass http://127.0.0.1:8080/cemoca;
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
        alias /opt/cemoca/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    sudo mkdir -p /etc/nginx/sites-enabled
    sudo ln -sf "$NGINX_SITE_AVAILABLE" "$NGINX_SITE_ENABLED"
else
    sudo tee "$NGINX_CONF_D" > /dev/null << 'EOF'
server {
    listen 80;
    server_name cemoca.org www.cemoca.org cemoca.cloud www.cemoca.cloud 72.61.208.104;

    location / {
        proxy_pass http://127.0.0.1:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /cemoca {
        proxy_pass http://127.0.0.1:8080/cemoca;
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
        alias /opt/cemoca/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF
fi

sudo systemctl enable nginx || true
sudo systemctl restart nginx || true
sudo nginx -t && sudo systemctl reload nginx
echo "✅ Nginx configured"

# Ensure default nginx site doesn't take precedence (Debian/Ubuntu)
if [ -e "/etc/nginx/sites-enabled/default" ]; then
    sudo rm -f /etc/nginx/sites-enabled/default || true
fi

# Open firewall ports if firewall is enabled
if command -v ufw >/dev/null 2>&1; then
    sudo ufw allow OpenSSH || true
    sudo ufw allow 80/tcp || true
    sudo ufw allow 443/tcp || true
fi
if command -v firewall-cmd >/dev/null 2>&1; then
    sudo firewall-cmd --permanent --add-service=http || true
    sudo firewall-cmd --permanent --add-service=https || true
    sudo firewall-cmd --reload || true
fi

sudo nginx -t && sudo systemctl restart nginx

# Step 8b: HTTPS (Certbot) - best effort
echo "🔐 Setting up HTTPS (best effort)..."
if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update || true
    sudo apt-get install -y certbot python3-certbot-nginx || true
elif command -v yum >/dev/null 2>&1; then
    sudo yum install -y certbot python3-certbot-nginx || true
fi

if command -v certbot >/dev/null 2>&1; then
    sudo certbot --nginx \
        -d cemoca.org -d www.cemoca.org -d cemoca.cloud -d www.cemoca.cloud \
        --non-interactive --agree-tos -m "$CERTBOT_EMAIL" --redirect || true
fi

# Step 9: Verify
echo "🔍 Verifying deployment..."
sleep 10

if curl -s http://localhost:8080/cemoca/api > /dev/null; then
    echo "✅ Backend API OK"
else
    echo "⚠️  Backend API not responding yet"
fi

if curl -s http://localhost:3008 > /dev/null; then
    echo "✅ Frontend OK"
else
    echo "⚠️  Frontend not responding yet"
fi

echo ""
echo "🎉 CEMOCA INITIAL DEPLOYMENT COMPLETED!"
echo "========================================"
echo "✅ Database: cemoca_db"
echo "✅ Backend: http://cemoca.org/cemoca/api"
echo "✅ Frontend: http://cemoca.org"
echo "✅ Uploads: /opt/cemoca/uploads"
echo "✅ Service: $SERVICE_NAME"
echo ""
echo "📝 Logs:"
echo "   Backend: sudo tail -f /opt/tomcat/logs/catalina.out"
echo "   App Log: sudo tail -f /opt/cemoca/logs/application/application.log"
echo "   Scheduler Log: sudo tail -f /opt/cemoca/logs/scheduler/scheduler.log"
echo "   Frontend: sudo journalctl -u $SERVICE_NAME -f"
echo ""
echo "🔄 Commands:"
echo "   Restart frontend: sudo systemctl restart $SERVICE_NAME"
echo "   Restart backend: sudo systemctl restart tomcat"
echo "   Status: sudo systemctl status $SERVICE_NAME"
