# CAMOCA Deployment Guide
## Server: srv906504.hstgr.cloud (31.97.110.194)

### Configuration Summary
| Component | Value |
|-----------|-------|
| Server | srv906504.hstgr.cloud |
| IP | 31.97.110.194 |
| Database | camoca_db |
| Backend Context | /camoca |
| Backend Port | 8080 |
| Frontend Port | 3003 |
| Upload Dir | /opt/camoca/uploads |

---

## Scripts

| Script | Description |
|--------|-------------|
| `scripts/deployment-init.sh` | Initial deployment (run once) |
| `scripts/redeploy-backend.sh` | Redeploy backend only |
| `scripts/redeploy-frontend.sh` | Redeploy frontend only |

---

## Quick Commands

```bash
# SSH to server
ssh root@srv906504.hstgr.cloud

# Initial deployment (first time only)
chmod +x scripts/deployment-init.sh && ./scripts/deployment-init.sh

# Redeploy backend
chmod +x scripts/redeploy-backend.sh && ./scripts/redeploy-backend.sh

# Redeploy frontend
chmod +x scripts/redeploy-frontend.sh && ./scripts/redeploy-frontend.sh
```

---

## URLs

- **Frontend**: http://srv906504.hstgr.cloud
- **Backend API**: http://srv906504.hstgr.cloud/camoca/api
- **Local Frontend**: http://localhost:3003
- **Local Backend**: http://localhost:8080/camoca/api

---

## Logs

```bash
# Backend logs
sudo tail -f /opt/tomcat/logs/catalina.out

# Frontend logs
pm2 logs camoca-frontend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## Existing Apps on Server (DO NOT MODIFY)

| App | Frontend Port | Backend Context |
|-----|---------------|-----------------|
| trensilapor.my.id | 3000 | /silapor |
| mdarmawanf.my.id | - | /portfolio |
| ikafk.my.id | 3002 | /ikafk |
| **CAMOCA** | **3003** | **/camoca** |
