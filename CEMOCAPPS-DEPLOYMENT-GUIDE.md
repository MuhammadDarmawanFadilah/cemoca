# CEMOCAPPS DEPLOYMENT GUIDE
## Deployment untuk cemocapps pada Server Hostinger VPS

### 📋 INFO SERVER
- **VPS ID**: 906504
- **IP**: 31.97.110.194
- **Hostname**: srv906504.hstgr.cloud
- **OS**: Ubuntu 24.04 LTS
- **RAM**: 16GB
- **CPU**: 4 cores
- **Disk**: 200GB

### 📋 APLIKASI YANG SUDAH ADA DI SERVER
- **trensilapor.my.id**: Frontend (port 3000), Backend (/silapor, port 8080)
- **mdarmawanf.my.id**: Portfolio Frontend, Backend (/portfolio, port 8080)
- **ikafk.my.id**: Alumni Frontend (port 3002), Backend (/ikafk, port 8080)

### 📋 KONFIGURASI UNTUK CEMOCAPPS
- **Domain**: (Belum ditentukan - bisa gunakan subdomain atau domain baru)
- **Frontend Port**: 3003 (agar tidak bentrok)
- **Backend Context**: /cemocapps (di Tomcat port 8080)
- **Database**: cemocapps_db
- **Upload Directory**: /opt/cemocapps/uploads

---

## 🚀 TAHAPAN DEPLOYMENT BACKEND

### **STAGE 1: SSH ke Server**
```bash
# SSH ke server Hostinger VPS
ssh root@31.97.110.194
# atau
ssh root@srv906504.hstgr.cloud
```

### **STAGE 2: Database Setup untuk CEMOCAPPS**
```bash
# Buat database baru untuk aplikasi
sudo mysql -e "CREATE DATABASE IF NOT EXISTS cemocapps_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" && \
echo "✅ Database cemocapps_db berhasil dibuat"
```

### **STAGE 3: Clone Repository**
```bash
# Clone repository CEMOCAPPS ke direktori terpisah
sudo git clone https://github.com/YOUR_GITHUB_USERNAME/CEMOCAPPS.git /tmp/cemocapps && \
cd /tmp/cemocapps/backend && \
echo "✅ Repository CEMOCAPPS berhasil di-clone"
```

### **STAGE 4: Setup Konfigurasi Production**
```bash
# Buat direktori upload
sudo mkdir -p /opt/cemocapps/uploads/images
sudo mkdir -p /opt/cemocapps/uploads/videos
sudo mkdir -p /opt/cemocapps/uploads/documents
sudo mkdir -p /opt/cemocapps/logs
sudo chown -R root:root /opt/cemocapps

# Copy dan sesuaikan konfigurasi production
cd /tmp/cemocapps/backend
sudo cp src/main/resources/application-prod-cemocapps.properties src/main/resources/application.properties

echo "✅ Konfigurasi production berhasil disiapkan"
```

### **STAGE 5: Build dan Deploy Backend**
```bash
cd /tmp/cemocapps/backend

# Build aplikasi
sudo mvn clean package -DskipTests

# Deploy ke Tomcat dengan context path berbeda
sudo cp target/backend.war /opt/tomcat/webapps/cemocapps.war
sudo chown root:root /opt/tomcat/webapps/cemocapps.war

echo "✅ Backend CEMOCAPPS berhasil di-deploy ke Tomcat"
```

### **STAGE 6: Restart Tomcat**
```bash
# Restart Tomcat untuk load aplikasi baru
sudo systemctl restart tomcat

# Verifikasi aplikasi sudah running
sleep 10
curl -I http://localhost:8080/cemocapps/api/health 2>/dev/null | head -1

echo "✅ Tomcat berhasil di-restart"
```

---

## 🌐 TAHAPAN DEPLOYMENT FRONTEND (Opsional)

### **STAGE 7: Setup Frontend**
```bash
# Buat direktori untuk frontend
sudo mkdir -p /var/www/cemocapps

cd /tmp/cemocapps/frontend

# Setup environment production
sudo cp .env.prod-cemocapps .env.local
sudo cp .env.prod-cemocapps .env

# Install dependencies dan build
sudo pnpm install --frozen-lockfile
sudo pnpm run build

# Copy hasil build
sudo cp -r .next public package.json next.config.ts .env.local node_modules /var/www/cemocapps/
sudo chown -R root:root /var/www/cemocapps

echo "✅ Frontend CEMOCAPPS berhasil di-build"
```

### **STAGE 8: Setup Service Frontend**
```bash
# Buat systemd service untuk frontend cemocapps
sudo tee /etc/systemd/system/cemocapps-frontend.service > /dev/null << 'EOF'
[Unit]
Description=CEMOCAPPS Frontend Next.js Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/cemocapps
ExecStart=/usr/bin/npx next start
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3003
Environment=NODE_OPTIONS=--max-old-space-size=2048
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

# Enable dan start service
sudo systemctl daemon-reload
sudo systemctl enable cemocapps-frontend
sudo systemctl start cemocapps-frontend

echo "✅ Service frontend CEMOCAPPS berhasil dijalankan di port 3003"
```

### **STAGE 9: Konfigurasi Nginx (jika ada domain)**
```bash
# Buat konfigurasi Nginx untuk cemocapps (sesuaikan domain)
sudo tee /etc/nginx/sites-available/cemocapps > /dev/null << 'EOF'
server {
    listen 80;
    server_name your-domain.com;  # GANTI dengan domain Anda
    client_max_body_size 100M;
    
    # Frontend (Next.js di port 3003)
    location / {
        proxy_pass http://localhost:3003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8080/cemocapps/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # File uploads
    location /uploads {
        alias /opt/cemocapps/uploads;
        expires 1y;
        add_header Cache-Control "public";
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/cemocapps /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Konfigurasi Nginx berhasil"
```

---

## 🔧 MAINTENANCE COMMANDS

### **Service Management:**
```bash
# Restart semua service CEMOCAPPS
sudo systemctl restart tomcat cemocapps-frontend nginx

# Status check
sudo systemctl status mysql tomcat cemocapps-frontend nginx --no-pager

# Check logs
sudo tail -f /opt/cemocapps/logs/cemocapps-backend.log
sudo journalctl -u cemocapps-frontend -f --no-pager
sudo tail -f /opt/tomcat/logs/catalina.out
```

### **Update Backend:**
```bash
cd /tmp/cemocapps/backend && sudo git pull
sudo cp src/main/resources/application-prod-cemocapps.properties src/main/resources/application.properties
sudo mvn clean package -DskipTests
sudo cp target/backend.war /opt/tomcat/webapps/cemocapps.war
sudo systemctl restart tomcat
```

### **Update Frontend:**
```bash
cd /tmp/cemocapps/frontend && sudo git pull
sudo pnpm run build
sudo cp -r .next /var/www/cemocapps/
sudo systemctl restart cemocapps-frontend
```

### **Database Backup:**
```bash
sudo mysqldump -u root cemocapps_db > /opt/cemocapps/backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 📊 PORT ALLOCATION
| Aplikasi | Frontend Port | Backend Context | Database |
|----------|---------------|-----------------|----------|
| trensilapor | 3000 | /silapor | silapor_db |
| mdarmawanf | - | /portfolio | portfolio_db |
| ikafk | 3002 | /ikafk | ikafk_alumni |
| **cemocapps** | **3003** | **/cemocapps** | **cemocapps_db** |

---

## ⚠️ CATATAN PENTING
1. Pastikan domain sudah dikonfigurasi sebelum setup SSL
2. Semua context path harus unik untuk menghindari konflik
3. Selalu backup database sebelum update
4. Check port availability sebelum menjalankan service baru
