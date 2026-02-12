# WhatsApp Notification Configuration

## Overview
Sistem ini menggunakan Fonnte API untuk mengirim notifikasi WhatsApp kepada pengguna baru saat mereka ditambahkan oleh admin atau sebagai pasien.

## Fitur
- ✅ Format nomor telepon otomatis (08xxx → 628xxx)
- ✅ Kirim pesan selamat datang dengan:
  - Nama lengkap pengguna
  - Username dan password
  - Link aplikasi
  - Role yang diberikan
- ✅ Notifikasi otomatis saat user baru dibuat
- ✅ Tidak menggagalkan proses pembuatan user jika notifikasi gagal

## Cara Setup

### 1. Mendapatkan Token Fonnte

1. Daftar atau login ke [Fonnte.com](https://fonnte.com)
2. Hubungkan nomor WhatsApp Anda
3. Copy API Token dari dashboard

### 2. Konfigurasi Token

Ada 2 cara untuk mengkonfigurasi token:

#### Option 1: Environment Variable (Recommended untuk Production)
```bash
# Windows
set FONNTE_TOKEN=your_fonnte_token_here

# Linux/Mac
export FONNTE_TOKEN=your_fonnte_token_here
```

#### Option 2: Application Properties (untuk Development)
Edit file `backend/src/main/resources/application-local.properties`:
```properties
whatsapp.fonnte.token=your_fonnte_token_here
```

### 3. Konfigurasi URL Aplikasi

Edit `application-local.properties`:
```properties
app.base-url=http://localhost:3000  # untuk development
# atau
app.base-url=https://cemoca.org     # untuk production
```

## Format Pesan

Pesan yang dikirim ke pengguna baru:

```
🎉 *Selamat Datang di PEPY Application!*

Halo *[Nama Lengkap]*,

Anda telah berhasil diundang sebagai *[Role]* di aplikasi PEPY.

📝 *Informasi Login Anda:*
Username: `[username]`
Password: `[password]`

🔗 *Link Aplikasi:*
[URL Aplikasi]

⚠️ *Penting:*
- Harap ganti password Anda setelah login pertama kali
- Jangan bagikan informasi login Anda kepada siapapun

Jika ada pertanyaan, silakan hubungi administrator.

Terima kasih! 🙏
```

## Format Nomor Telepon

Sistem otomatis mengkonversi format nomor:
- `085600121760` → `6285600121760`
- `08XXXXXXXXX` → `628XXXXXXXXX`
- `62XXXXXXXXX` → `628XXXXXXXXX` (tetap)
- `+62XXXXXXXXX` → `628XXXXXXXXX` (hapus +)

## Testing

Untuk test notifikasi WhatsApp, gunakan endpoint:
```bash
POST /api/test/whatsapp
{
  "phoneNumber": "085600121760",
  "message": "Test message"
}
```

## Troubleshooting

### Notifikasi tidak terkirim
1. **Cek token Fonnte**
   - Pastikan token valid dan tidak expired
   - Cek saldo/quota Fonnte

2. **Cek format nomor**
   - Pastikan nomor telpon valid
   - Format: 08XXXXXXXXX atau 628XXXXXXXXX

3. **Cek logs**
   ```bash
   # Cek logs di lokasi:
   C:/PROJEK/CEMOCAPPS/backend/logs/application/application.log
   
   # Cari error dengan keyword:
   "WhatsApp notification"
   "Fonnte"
   ```

### Token tidak dikonfigurasi
Jika token kosong, sistem akan:
- Log warning: "WhatsApp notification disabled: Fonnte token not configured"
- Skip notifikasi tanpa error
- User tetap berhasil dibuat

## Production Deployment

Untuk production, set environment variable di server:

```bash
# Linux systemd service
Environment="FONNTE_TOKEN=your_token_here"

# Docker
-e FONNTE_TOKEN=your_token_here

# Kubernetes
env:
  - name: FONNTE_TOKEN
    value: your_token_here
```

## Keamanan

⚠️ **PENTING:**
- Jangan commit token ke git
- Gunakan environment variable untuk production
- Jangan expose token di client-side
- Rotasi token secara berkala

## Monitoring

Log yang dicatat:
- ✅ Notifikasi berhasil: "WhatsApp welcome notification sent to [nomor]"
- ⚠️ Token kosong: "WhatsApp notification disabled: Fonnte token not configured"
- ❌ Error: "Failed to send WhatsApp notification to [nomor]: [error]"

## API Documentation

### sendWelcomeNotification
```java
public void sendWelcomeNotification(
    String phoneNumber,  // Format: 08xxx atau 628xxx
    String fullName,     // Nama lengkap user
    String username,     // Username untuk login
    String password,     // Password plaintext
    String roleName      // Role: ADMIN, KARYAWAN, dll
)
```

### formatPhoneNumber
```java
public String formatPhoneNumber(String phoneNumber)
// Input: 085600121760
// Output: 6285600121760
```

## Support

Untuk bantuan lebih lanjut:
- Dokumentasi Fonnte: https://fonnte.com/docs
- Support Fonnte: https://wa.me/6281222221111
