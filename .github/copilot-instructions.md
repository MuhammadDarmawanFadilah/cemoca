# Instruksi Pengembangan CeMoCA Application

## Overview Proyek
**Nama Aplikasi**: CeMoCA (Creative Motion Content Application)  
**Deskripsi**: Platform AI-powered video generation dengan HeyGen API integration untuk membuat video presentasi dengan avatar  
**Repository**: https://github.com/MuhammadDarmawanFadilah/cemoca.git  
**Production URL**: https://cemoca.org  

**Teknologi Stack**:
- Backend: Java 21, Spring Boot 3.4.1, MySQL, Tomcat
- Frontend: Next.js 15.3.0, Shadcn/ui, TailwindCSS
- External API: HeyGen (video generation), AWS Polly (TTS)
- Support: Desktop/Mobile responsive, Dark/Light theme, PWA

## Server Access & Deployment

### Production Server
**Host**: 72.61.208.104  
**User**: root  
**Access Method**: SSH via PuTTY/plink

### Deployment Scripts
**Backend Redeploy**:
```bash
bash /opt/CEMOCA/redeploy-backend.sh
```

**Frontend Redeploy**:
```bash
bash /opt/CEMOCA/redeploy-frontend.sh
```

### Deployment dari Windows (PowerShell)
```powershell
# Backend
$pw = Read-Host -Prompt "SSH Password"; echo y | plink -ssh root@72.61.208.104 -pw $pw "bash /opt/CEMOCA/redeploy-backend.sh"

# Frontend
$pw = Read-Host -Prompt "SSH Password"; echo y | plink -ssh root@72.61.208.104 -pw $pw "bash /opt/CEMOCA/redeploy-frontend.sh"
```

### Deployment Workflow
1. **Edit code** di local (auto-compilation aktif, no need to run)
2. **Commit & push** ke git repository
   ```bash
   git add .
   git commit -m "description"
   git push
   ```
3. **Redeploy** di production server (gunakan command di atas)

### Server Directory Structure
```
/opt/
├── CEMOCA/
│   ├── redeploy-backend.sh
│   ├── redeploy-frontend.sh
│   └── deployment-init.sh
├── cemoca/
│   └── app/
│       ├── backend/    # Backend source & WAR
│       └── frontend/   # Frontend build
├── tomcat/
│   ├── webapps/
│   │   └── cemoca.war
│   └── logs/
│       ├── catalina.out
│       └── application.log
└── file/               # Upload directory
```

### Monitoring & Logs
```bash
# Tomcat logs
sudo tail -f /opt/tomcat/logs/catalina.out

# Application logs
sudo tail -f /opt/tomcat/logs/application.log

# Check Tomcat status
sudo systemctl status tomcat

# Restart Tomcat manually
sudo systemctl restart tomcat
```

## Fitur Utama Aplikasi

### 1. D-ID Video Generation
- **AI Avatar Videos**: Generate video dengan avatar realistis dan lip-sync
- **Voice Cloning**: Clone suara dari audio sample untuk konsistensi suara
- **SSML Support**: Text-to-speech dengan SSML tags untuk natural intonation
- **Batch Processing**: Generate hingga 1000+ videos dengan avatar consistency

### 2. Audio Management
- **Voice Sample Library**: Upload dan manage audio samples per avatar
- **Strict Voice Policy**: Enforce penggunaan cloned voice (no fallback)
- **Multi-language Support**: English, Indonesian, dan bahasa lainnya

### 3. Video Reporting & Analytics
- **Personal Sales Reports**: Generate video reports untuk sales performance
- **Clip Status Tracking**: Monitor progress video generation real-time
- **Schedule Management**: Automated video generation scheduling

### 4. User & Authentication
- **Role-based Access**: ADMIN, KARYAWAN roles
- **JWT Authentication**: Secure API endpoints
- **User Management**: CRUD operations untuk users

## Konfigurasi Penting

### D-ID Configuration (application.properties)
```properties
# D-ID API
did.api.key=YOUR_API_KEY
did.api.url=https://api.d-id.com

# Voice Cloning Configuration
did.tts.clone.language=english  # Language of voice SAMPLE, not script
did.tts.strict-audio-management=true  # Enforce cloned voice, no fallback

# Video Generation
did.video.cache-enabled=true
did.webhook.enabled=true
```

### Key Configuration Notes
- `did.tts.clone.language`: Refers to language of uploaded audio sample (e.g., "english", "indonesian"), NOT the script text language
- `did.tts.strict-audio-management=true`: Throws exception if audio sample exists but cloning fails (prevents voice drift)
- SSML sanitization: Automatically strips `<amazon:effect>` tags incompatible with D-ID cloned voices

### Database Configuration
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/cemoca_db
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
```

## Arsitektur Aplikasi

### Backend Architecture
```
backend/src/main/java/com/shadcn/backend/
├── config/
│   ├── SecurityConfig.java          # JWT & Security
│   ├── WebConfig.java               # CORS & Web settings
│   └── SchedulerConfig.java         # Async & scheduling
├── controller/
│   ├── AuthController.java          # Login & authentication
│   ├── VideoReportController.java   # Video generation endpoints
│   ├── DIDWebhookController.java    # D-ID callback handler
│   ├── AudioManagementController.java
│   └── UserController.java
├── service/
│   ├── DIDService.java              # D-ID API integration (CRITICAL)
│   ├── AudioManagementService.java  # Voice sample management
│   ├── VideoReportService.java      # Video generation logic
│   ├── LearningSchedulerService.java # Batch processing
│   └── AuthService.java
├── model/
│   ├── User.java
│   ├── Member.java
│   ├── AvatarAudio.java            # Voice sample entity
│   ├── VideoClip.java              # Generated video tracking
│   └── LearningScheduler.java
└── repository/
    ├── UserRepository.java
    ├── AvatarAudioRepository.java
    └── VideoClipRepository.java
```

### Frontend Architecture
```
frontend/src/
├── app/
│   ├── (auth)/
│   │   └── login/                  # Login page
│   ├── dashboard/                  # Main dashboard
│   ├── report-video/
│   │   └── personal-sales/         # Video generation UI
│   ├── audio-management/           # Voice sample management
│   └── users/                      # User management
├── components/
│   ├── ui/                         # Shadcn/ui components
│   ├── layout/                     # Layout components
│   └── video/                      # Video-specific components
├── lib/
│   ├── api.ts                      # API client
│   ├── auth.ts                     # Auth utilities
│   └── utils.ts                    # Helper functions
└── types/
    └── index.ts                    # TypeScript types
```

### Key Backend Services

#### DIDService.java (MOST CRITICAL)
Handles all D-ID API interactions:
- `createScene()`: Create video with avatar and script
- `createClipsVideo()`: Generate video clips
- `getClipStatus()`: Poll video generation status
- `ensureLocalSampleVoiceIfAvailable()`: Voice cloning logic
- `sanitizeSsmlForDidProvider()`: SSML sanitization for D-ID compatibility
- **Strict Voice Policy**: Enforces audio-management voice, prevents fallback

#### AudioManagementService.java
Manages voice samples:
- Upload audio samples per avatar
- Normalized key matching (e.g., "Gilbert Sit" → "gilbertsit")
- File storage and retrieval

#### VideoReportService.java
Business logic for video generation:
- Read CSV data files
- Process batch video generation
- Track video status
- Handle D-ID webhooks

#### LearningSchedulerService.java
Automated batch processing:
- Schedule video generation tasks
- Process multiple videos in sequence
- Monitor and retry failed jobs

## Development Workflow

### Local Development Setup

#### Backend
```bash
cd backend
# Configuration: edit src/main/resources/application-local.properties
# Auto-compilation is active via Spring Boot DevTools
# DO NOT RUN unless checking for errors
```

#### Frontend
```bash
cd frontend
# Configuration: .env.local
# Auto-compilation is active via Next.js Turbopack
# DO NOT RUN unless checking for errors
```

### Making Changes

1. **Edit Code**
   - Backend: Auto-compilation via Spring Boot DevTools
   - Frontend: Auto-reload via Next.js Turbopack
   - **NEVER RUN** backend/frontend unless user asks to check errors

2. **Check Logs for Errors**
   - Local: `C:\PROJEK\CEMOCAPPS\backend\logs\application.log`
   - Production: `/opt/tomcat/logs/application.log` or `/opt/tomcat/logs/catalina.out`

3. **Commit & Push**
   ```bash
   git add .
   git commit -m "description"
   git push
   ```

4. **Deploy to Production**
   ```powershell
   # Backend
   $pw = Read-Host -Prompt "SSH Password"; echo y | plink -ssh root@72.61.208.104 -pw $pw "bash /opt/CEMOCA/redeploy-backend.sh"
   
   # Frontend
   $pw = Read-Host -Prompt "SSH Password"; echo y | plink -ssh root@72.61.208.104 -pw $pw "bash /opt/CEMOCA/redeploy-frontend.sh"
   ```

### Common Tasks

#### Add New Feature
1. Edit backend/frontend code
2. Test locally (auto-compilation handles it)
3. Commit & push
4. Deploy to production

#### Fix Production Error
1. Check production logs via SSH:
   ```bash
   sudo tail -f /opt/tomcat/logs/application.log
   ```
2. Identify issue
3. Fix in local code
4. Commit, push, redeploy

#### Update D-ID Configuration
1. Edit `application-local.properties` or `application-prod.properties`
2. Common settings:
   - `did.api.key`: D-ID API key
   - `did.tts.clone.language`: Voice sample language (english, indonesian, etc.)
   - `did.tts.strict-audio-management`: Enable/disable strict voice mode
3. Commit, push, redeploy backend

#### Add Voice Sample
1. Upload audio file via frontend (Audio Management page)
2. Ensure normalized key matches avatar name
3. System will auto-use for video generation

## Critical Files & Their Purpose

### Backend
- **DIDService.java**: Core D-ID API integration (voice cloning, video generation)
- **application-local.properties**: Local development config
- **application-prod.properties**: Production config
- **pom.xml**: Maven dependencies

### Frontend
- **src/app/(auth)/login/page.tsx**: Login page
- **src/app/dashboard/page.tsx**: Main dashboard
- **src/app/report-video/personal-sales/[id]/page.tsx**: Video generation UI
- **src/lib/api.ts**: API client configuration
- **.env.local**: Environment variables

### Data Files
- **backend/data/list.txt**: CSV data for batch video generation
- **backend/data/english.txt**: SSML script template

## Troubleshooting Guide

### Common Issues

#### 1. Voice Generation Errors
**Symptom**: "unsupported language" error
**Solution**:
- Check `did.tts.clone.language` in application.properties
- Must match audio sample language, not script language
- Supported: english, spanish, italian, indonesian, etc.

#### 2. Voice Drift/Inconsistency
**Symptom**: Videos use different voices despite having audio sample
**Solution**:
- Ensure `did.tts.strict-audio-management=true`
- Check audio sample exists in database (AvatarAudio entity)
- Verify normalized key matches (e.g., "Gilbert Sit" → "gilbertsit")

#### 3. SSML Tags Not Working
**Symptom**: Amazon-specific SSML tags causing errors
**Solution**:
- System auto-strips `<amazon:effect>` tags via `sanitizeSsmlForDidProvider()`
- Use standard SSML: `<break>`, `<prosody>`, `<emphasis>`
- Avoid Amazon-only tags when using D-ID cloned voices

#### 4. Deployment Fails
**Symptom**: Redeploy script fails or hangs
**Solution**:
- Check SSH connection: `plink -ssh root@72.61.208.104 "pwd"`
- Verify git push succeeded
- Check Tomcat status: `sudo systemctl status tomcat`
- Review logs: `sudo tail -f /opt/tomcat/logs/catalina.out`

#### 5. Maven Build Errors
**Symptom**: Compilation fails during redeploy
**Solution**:
- Check syntax errors in Java files
- Verify imports are correct
- Review error in `/opt/cemoca/app/backend/target/` during build

## Server Access Guide

### SSH Connection Methods

#### Method 1: Using plink (PowerShell)
```powershell
# Interactive session
plink -ssh root@72.61.208.104

# Single command
plink -ssh root@72.61.208.104 "ls -la /opt/"

# Auto-accept host key
echo y | plink -ssh root@72.61.208.104 "command"

# With password provided at runtime
$pw = Read-Host -Prompt "SSH Password"; echo y | plink -ssh root@72.61.208.104 -pw $pw "command"
```

#### Method 2: Using PuTTY GUI
1. Open PuTTY
2. Host: `72.61.208.104`
3. Port: `22`
4. Connection type: SSH
5. Login: `root`
6. Password: (enter at prompt)

#### Method 3: Using VS Code Remote SSH
1. Install "Remote - SSH" extension
2. Add SSH config:
   ```
   Host cemoca
     HostName 72.61.208.104
     User root
       # Do not store passwords here
   ```
3. Connect via command palette

### Deployment Commands Reference

#### Deploy Backend
```powershell
# Full command with auto-accept
$pw = Read-Host -Prompt "SSH Password"; echo y | plink -ssh root@72.61.208.104 -pw $pw "bash /opt/CEMOCA/redeploy-backend.sh"

# Expected output:
# - Pulling latest code
# - Building with Maven
# - Removing old WAR
# - Deploying new WAR
# - Restarting Tomcat
# - Verification check
```

#### Deploy Frontend
```powershell
# Full command with auto-accept
$pw = Read-Host -Prompt "SSH Password"; echo y | plink -ssh root@72.61.208.104 -pw $pw "bash /opt/CEMOCA/redeploy-frontend.sh"

# Expected output:
# - Pulling latest code
# - Installing dependencies
# - Building Next.js
# - Deploying to production
# - Verification check
```

#### Check Application Status
```powershell
# Check Tomcat status
$pw = Read-Host -Prompt "SSH Password"; echo y | plink -ssh root@72.61.208.104 -pw $pw "sudo systemctl status tomcat"

# Check backend API
$pw = Read-Host -Prompt "SSH Password"; echo y | plink -ssh root@72.61.208.104 -pw $pw "curl http://localhost:8080/cemoca/api/health"

# Check frontend
$pw = Read-Host -Prompt "SSH Password"; echo y | plink -ssh root@72.61.208.104 -pw $pw "curl http://localhost:3000"
```

#### View Logs
```powershell
# Tomcat logs (last 100 lines)
$pw = Read-Host -Prompt "SSH Password"; echo y | plink -ssh root@72.61.208.104 -pw $pw "sudo tail -n 100 /opt/tomcat/logs/catalina.out"

# Application logs (last 100 lines)
$pw = Read-Host -Prompt "SSH Password"; echo y | plink -ssh root@72.61.208.104 -pw $pw "sudo tail -n 100 /opt/tomcat/logs/application.log"

# Follow logs in real-time (Ctrl+C to exit)
$pw = Read-Host -Prompt "SSH Password"; echo y | plink -ssh root@72.61.208.104 -pw $pw "sudo tail -f /opt/tomcat/logs/application.log"
```

### File Management on Server

#### Upload Files
```powershell
# Using pscp (PuTTY scp)
$pw = Read-Host -Prompt "SSH Password"; pscp -pw $pw local-file.txt root@72.61.208.104:/opt/cemoca/

# Upload directory
$pw = Read-Host -Prompt "SSH Password"; pscp -r -pw $pw local-dir/ root@72.61.208.104:/opt/cemoca/
```

#### Download Files
```powershell
# Download single file
$pw = Read-Host -Prompt "SSH Password"; pscp -pw $pw root@72.61.208.104:/opt/tomcat/logs/application.log ./

# Download directory
$pw = Read-Host -Prompt "SSH Password"; pscp -r -pw $pw root@72.61.208.104:/opt/file/ ./downloads/
```

#### Edit Files on Server
```bash
# SSH into server first
$pw = Read-Host -Prompt "SSH Password"; echo y | plink -ssh root@72.61.208.104 -pw $pw

# Then use nano or vi
nano /opt/cemoca/app/backend/src/main/resources/application-prod.properties
vi /opt/cemoca/app/backend/src/main/resources/application-prod.properties
```

## Instruksi Pengembangan & Debugging
1. **Auto-Compilation**: Backend dan frontend sudah menggunakan auto-compilation
   - Backend: Spring Boot menggunakan DevTools untuk hot reload
   - Frontend: Next.js menggunakan Turbopack untuk auto-reload
   - **NEVER RUN BACKEND/FRONTEND** kecuali user spesifik minta untuk cek error
2. **Dashboard Access**: Dashboard endpoint sudah diubah menjadi public access (tidak perlu authentication)
3. **Authentication**: Hanya untuk endpoint koperasi yang memerlukan role ADMIN/KARYAWAN
4. **Development Workflow**: Fokus pada editing code, biarkan auto-compilation bekerja

## IMPORTANT INSTRUCTIONS
- **NEVER explain, describe, or give any explanations** 
- **FOCUS ON CODE ONLY** - no descriptions needed
- **NEVER RUN backend or frontend** unless user specifically asks to fix errors
- **READ LOGS if there are errors**: C:\PROJEK\CEMOCAPPS\backend\logs\application.log
- **Just write "Success" when finished**

## Success Criteria
- [x] D-ID video generation with avatar & voice cloning works
- [x] Strict audio-management voice policy prevents voice drift
- [x] SSML sanitization for D-ID compatibility
- [x] Batch video generation (1000+ videos) with consistent voice
- [x] Audio management module for voice samples
- [x] Video status tracking and webhooks
- [x] Automated scheduling for batch processing
- [x] Production deployment workflow established
- [x] Server access and monitoring tools configured
- [x] Backend & frontend auto-compilation active
- [x] Git-based deployment pipeline functional