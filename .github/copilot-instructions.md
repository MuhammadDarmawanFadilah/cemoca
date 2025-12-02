# Instruksi Pengembangan Aplikasi Koperasi Desa

## Overview Proyek
**Nama Aplikasi**: Aplikasi Koperasi Desa  
**Template Base**: Aplikasi Alumni dengan arsitektur Spring Boot + Next.js  
**Teknologi Stack**:
- Backend: Java 21, Spring Boot 3.2.0, MySQL
- Frontend: Next.js 15.3.0, Shadcn/ui, TailwindCSS
- Support: Desktop/Mobile responsive, Dark/Light theme

## Analisis Template Existing
Template aplikasi alumni memiliki fitur-fitur berikut yang dapat dijadikan referensi:
- Authentication & Authorization (User, Role)
- CRUD Operations dengan JPA/Hibernate
- File Upload & Management
- RESTful API dengan pagination
- Wilayah management dengan integrasi wilayah.id
- Dashboard dengan charts dan statistics
- PWA Support
- Responsive design dengan dark/light theme

## Tahapan Pengembangan

### FASE 1: SETUP PROJECT & CLEANUP
#### Backend Cleanup
1. **Database Schema Cleanup**
   - Hapus tabel yang tidak diperlukan (alumni-specific tables)
   - Pertahankan: users, roles, master data tables, file upload tables
   - Buat database baru: `koperasi_desa`

2. **Model & Entity Cleanup**
   - Hapus model Alumni, Biografi, Berita, Pelaksanaan, dll
   - Pertahankan: User, Role, Wilayah entities
   - Cleanup repository & service yang tidak diperlukan

3. **Controller Cleanup**
   - Hapus controller yang tidak diperlukan
   - Pertahankan: AuthController, WilayahController, UserController

#### Frontend Cleanup
1. **Page Cleanup**
   - Hapus semua page kecuali: login, dashboard
   - Cleanup components yang tidak diperlukan
   - Pertahankan: layout, theme provider, authentication components

2. **Navigation Update**
   - Update sidebar/navigation untuk menu koperasi
   - Remove alumni-specific menu items

### FASE 2: BACKEND DEVELOPMENT

#### 2.1 Database Design & Models
1. **Kategori Entity**
   ```java
   @Entity
   public class Kategori {
       private Long id;
       private String nama;
       private String deskripsi;
       private LocalDateTime createdAt;
       private LocalDateTime updatedAt;
   }
   ```

2. **Barang Entity**
   ```java
   @Entity
   public class Barang {
       private Long id;
       private String nama;
       private Double berat;
       private Kategori kategori;
       private Integer stock;
       private BigDecimal harga;
       private Integer poin;
       private String gambar;
       private LocalDateTime createdAt;
       private LocalDateTime updatedAt;
   }
   ```

3. **Member Entity** (gunakan template Wilayah management)
   ```java
   @Entity
   public class Member {
       private Long id;
       private String nama;
       private String alamat;
       private WilayahProvinsi provinsi;
       private WilayahKota kota;
       private WilayahKecamatan kecamatan;
       private WilayahKelurahan kelurahan;
       private String telepon;
       private String email;
       private LocalDateTime createdAt;
       private LocalDateTime updatedAt;
   }
   ```

4. **Karyawan Entity** (extend dari User dengan role KARYAWAN)
   ```java
   // Extend existing User entity dengan fields tambahan
   // Atau buat relasi OneToOne dengan User
   ```

5. **Pesanan & Detail Pesanan Entity**
   ```java
   @Entity
   public class Pesanan {
       private Long id;
       private Member member;
       private User karyawan;
       private BigDecimal totalHarga;
       private Integer totalPoin;
       private StatusPesanan status;
       private LocalDateTime tanggalPesanan;
       private List<DetailPesanan> details;
   }

   @Entity
   public class DetailPesanan {
       private Long id;
       private Pesanan pesanan;
       private Barang barang;
       private Integer jumlah;
       private BigDecimal hargaSatuan;
       private BigDecimal subtotal;
   }
   ```

#### 2.2 Repository Layer
1. Buat repository untuk setiap entity
2. Implement custom queries jika diperlukan
3. Extend existing UserRepository untuk karyawan management

#### 2.3 Service Layer
1. **KategoriService** - CRUD kategori
2. **BarangService** - CRUD barang dengan upload gambar
3. **MemberService** - CRUD member dengan wilayah integration
4. **KaryawanService** - extend UserService
5. **PesananService** - business logic untuk pesanan & keranjang

#### 2.4 Controller Layer
1. **KategoriController** - REST API untuk kategori
2. **BarangController** - REST API untuk barang
3. **MemberController** - REST API untuk member
4. **KaryawanController** - REST API untuk karyawan
5. **PesananController** - REST API untuk pesanan

#### 2.5 Security & Authorization
1. Update SecurityConfig untuk role-based access
2. Add KARYAWAN role
3. Protect endpoints sesuai kebutuhan

### FASE 3: FRONTEND DEVELOPMENT

#### 3.1 Authentication & Dashboard
1. **Login Page** - gunakan existing login
2. **Dashboard** - update untuk metrics koperasi
   - Total barang
   - Total member
   - Pesanan hari ini
   - Revenue charts

#### 3.2 Master Data Management
1. **Kategori Management**
   - List kategoris dengan DataTable
   - Form add/edit kategori
   - Delete confirmation

2. **Barang Management**
   - List barang dengan filter by kategori
   - Form add/edit barang dengan upload gambar
   - Stock management

#### 3.3 Member & Karyawan Management
1. **Member Management** (gunakan template Biografi management)
   - List members dengan search & filter
   - Form add/edit member dengan wilayah selector
   - Member card generation (gunakan template kartu alumni)

2. **Karyawan Management**
   - List karyawans
   - Form add/edit karyawan
   - Role assignment

#### 3.4 Pesanan Management
1. **Keranjang & Checkout**
   - Product catalog dengan add to cart
   - Shopping cart component
   - Checkout form

2. **Pesanan Management**
   - List pesanan dengan status
   - Detail pesanan view
   - Update status pesanan

#### 3.5 Member Card Feature
1. **Kartu Member** (adaptasi dari kartu alumni)
   - Design kartu member
   - QR code generation
   - PDF export functionality

### FASE 4: INTEGRATION & TESTING

#### 4.1 API Integration
1. Connect frontend dengan backend APIs
2. Implement proper error handling
3. Add loading states

#### 4.2 File Upload Integration
1. Setup image upload untuk barang
2. Update existing upload service
3. Implement image optimization

#### 4.3 Wilayah Integration
1. Ensure wilayah.id integration works for member address
2. Test dropdown cascade functionality

#### 4.4 Testing
1. Test semua CRUD operations
2. Test pesanan flow end-to-end
3. Test responsive design
4. Test dark/light theme

### FASE 5: FINALIZATION

#### 5.1 UI/UX Polish
1. Consistent styling dengan shadcn/ui
2. Proper form validations
3. Toast notifications
4. Loading indicators

#### 5.2 Performance Optimization
1. Implement caching where needed
2. Optimize database queries
3. Image optimization

#### 5.3 Deployment Preparation
1. Update environment configurations
2. Database migration scripts
3. Build optimization

## File Structure Target

### Backend
```
src/main/java/com/shadcn/backend/
├── config/           # Existing configs
├── controller/
│   ├── AuthController.java      # Existing
│   ├── BarangController.java    # New
│   ├── KategoriController.java  # New
│   ├── MemberController.java    # New
│   ├── KaryawanController.java  # New
│   └── PesananController.java   # New
├── model/
│   ├── User.java               # Existing
│   ├── Role.java               # Existing
│   ├── Barang.java             # New
│   ├── Kategori.java           # New
│   ├── Member.java             # New
│   ├── Pesanan.java            # New
│   └── DetailPesanan.java      # New
├── repository/      # Corresponding repositories
├── service/         # Corresponding services
└── dto/            # Data Transfer Objects
```

### Frontend
```
src/app/
├── (auth)/
│   └── login/              # Existing
├── dashboard/              # Updated
├── master-data/
│   ├── kategori/          # New
│   └── barang/            # New
├── member/                # New
├── karyawan/              # New
├── pesanan/               # New
└── kartu-member/          # New
```

## Commands untuk Memulai

### Database Setup
```sql
CREATE DATABASE koperasi_desa;
```

### Backend Start
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### Frontend Start
```bash
cd frontend
npm install
npm run dev
```

## Catatan Penting
1. Pertahankan existing authentication system
2. Gunakan existing wilayah integration untuk member address
3. Adaptasi kartu alumni menjadi kartu member
4. Maintain responsive design dan theme support
5. Follow existing code patterns dan naming conventions
6. Gunakan existing components shadcn/ui sebanyak mungkin

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
- **READ LOGS if there are errors**: C:\PROJEK\penjualan\backend\logs\application.log
- **Just write "Success" when finished**

## Success Criteria
- [ ] Aplikasi bisa login sebagai karyawan
- [ ] CRUD kategori berfungsi
- [ ] CRUD barang dengan upload gambar berfungsi
- [ ] CRUD member dengan wilayah selector berfungsi
- [ ] CRUD karyawan berfungsi
- [ ] Pesanan flow (catalog → cart → checkout) berfungsi
- [ ] Kartu member bisa digenerate dan diexport
- [ ] Responsive design di desktop dan mobile
- [ ] Dark/light theme berfungsi
- [ ] Backend dan frontend bisa running tanpa error