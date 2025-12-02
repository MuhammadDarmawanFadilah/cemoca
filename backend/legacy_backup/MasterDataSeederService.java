package com.shadcn.backend.service;

import com.shadcn.backend.model.MasterSpesialisasi;
import com.shadcn.backend.model.MasterPosisi;
import com.shadcn.backend.model.MasterHobi;
import com.shadcn.backend.repository.MasterSpesialisasiRepository;
import com.shadcn.backend.repository.MasterPosisiRepository;
import com.shadcn.backend.repository.MasterHobiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MasterDataSeederService implements CommandLineRunner {

    private final MasterSpesialisasiRepository spesialisasiRepository;
    private final MasterPosisiRepository posisiRepository;
    private final MasterHobiRepository hobiRepository;

    @Value("${master.data.spesialisasi.force-reinsert:false}")
    private boolean forceReinsertSpesialisasi;

    @Value("${master.data.posisi.force-reinsert:false}")
    private boolean forceReinsertPosisi;

    @Value("${master.data.hobi.force-reinsert:false}")
    private boolean forceReinsertHobi;

    @Override
    public void run(String... args) throws Exception {
        log.info("🔄 Starting Master Data Seeding...");
        
        seedSpesialisasiKedokteran();
        seedPosisiPekerjaan();
        seedHobiMinat();
        
        log.info("✅ Master Data Seeding Completed!");
    }    private void seedSpesialisasiKedokteran() {
        if (!forceReinsertSpesialisasi && spesialisasiRepository.count() > 0) {
            log.info("📋 Spesialisasi data already exists, skipping...");
            return;
        }

        if (forceReinsertSpesialisasi) {
            log.info("📋 Force reinserting Spesialisasi Kedokteran data...");
            spesialisasiRepository.deleteAll();
        } else {
            log.info("📋 Seeding Spesialisasi Kedokteran data...");
        }

        List<String> spesialisasiList = Arrays.asList(
            "Dokter Umum",
            "Spesialis Anak (Sp.A)",
            "Spesialis Penyakit Dalam (Sp.PD)",
            "Spesialis Bedah (Sp.B)",
            "Spesialis Jantung dan Pembuluh Darah (Sp.JP)",
            "Spesialis Mata (Sp.M)",
            "Spesialis THT-KL (Sp.THT-KL)",
            "Spesialis Kulit dan Kelamin (Sp.KK)",
            "Spesialis Kandungan (Sp.OG)",
            "Spesialis Saraf (Sp.S)",
            "Spesialis Psikiatri (Sp.KJ)",
            "Spesialis Radiologi (Sp.Rad)",
            "Spesialis Anestesiologi (Sp.An)",
            "Spesialis Patologi Anatomi (Sp.PA)",
            "Spesialis Patologi Klinik (Sp.PK)",
            "Spesialis Mikrobiologi Klinik (Sp.MK)",
            "Spesialis Forensik (Sp.F)",
            "Spesialis Rehabilitasi Medik (Sp.RM)",
            "Spesialis Kedokteran Nuklir (Sp.KN)",
            "Spesialis Kedokteran Jiwa (Sp.KJ)",
            "Spesialis Bedah Saraf (Sp.BS)",
            "Spesialis Bedah Plastik (Sp.BP)",
            "Spesialis Bedah Anak (Sp.BA)",
            "Spesialis Bedah Toraks dan Kardiovaskular (Sp.BTKV)",
            "Spesialis Urologi (Sp.U)",
            "Spesialis Ortopedi dan Traumatologi (Sp.OT)",
            "Spesialis Kedokteran Fisik dan Rehabilitasi (Sp.KFR)",
            "Spesialis Onkologi Radiasi (Sp.OnkRad)",
            "Spesialis Gizi Klinik (Sp.GK)",
            "Spesialis Kedokteran Okupasi (Sp.OK)",
            "Spesialis Kedokteran Olahraga (Sp.KO)",
            "Spesialis Parasitologi (Sp.ParK)",
            "Spesialis Farmakologi Klinik (Sp.FK)",
            "Dokter Gigi Umum",
            "Spesialis Bedah Mulut (Sp.BM)",
            "Spesialis Konservasi Gigi (Sp.KG)",
            "Spesialis Periodonsia (Sp.Perio)",
            "Spesialis Prosthodonsia (Sp.Pros)",
            "Spesialis Ortodonsia (Sp.Ort)",
            "Spesialis Kedokteran Gigi Anak (Sp.KGA)",
            "Spesialis Penyakit Mulut (Sp.PM)",
            "Spesialis Radiologi Kedokteran Gigi (Sp.RKG)",
            "Tenaga Kesehatan Lainnya",
            "Peneliti Medis",
            "Dosen Kedokteran",
            "Tidak Praktik (Non-Medis)"
        );

        int sortOrder = 1;
        for (String nama : spesialisasiList) {
            MasterSpesialisasi spesialisasi = new MasterSpesialisasi();
            spesialisasi.setNama(nama);
            spesialisasi.setDeskripsi("Spesialisasi kedokteran: " + nama);
            spesialisasi.setIsActive(true);
            spesialisasi.setSortOrder(sortOrder++);
            spesialisasi.setCreatedAt(LocalDateTime.now());
            spesialisasi.setUpdatedAt(LocalDateTime.now());
            
            spesialisasiRepository.save(spesialisasi);
        }
        
        log.info("✅ Spesialisasi Kedokteran seeded: {} items", spesialisasiList.size());
    }    private void seedPosisiPekerjaan() {
        if (!forceReinsertPosisi && posisiRepository.count() > 0) {
            log.info("💼 Posisi data already exists, skipping...");
            return;
        }

        if (forceReinsertPosisi) {
            log.info("💼 Force reinserting Posisi & Pekerjaan data...");
            posisiRepository.deleteAll();
        } else {
            log.info("💼 Seeding Posisi & Pekerjaan data...");
        }

        // Combine both position lists from BiografiForm
        List<PosisiData> posisiList = Arrays.asList(
            // Profesi Kesehatan
            new PosisiData("Dokter Umum", "Kesehatan", "Profesi dokter umum"),
            new PosisiData("Dokter Spesialis Anak", "Kesehatan", "Profesi dokter spesialis anak"),
            new PosisiData("Dokter Spesialis Penyakit Dalam", "Kesehatan", "Profesi dokter spesialis penyakit dalam"),
            new PosisiData("Dokter Spesialis Bedah", "Kesehatan", "Profesi dokter spesialis bedah"),
            new PosisiData("Dokter Spesialis Jantung", "Kesehatan", "Profesi dokter spesialis jantung"),
            new PosisiData("Dokter Spesialis Mata", "Kesehatan", "Profesi dokter spesialis mata"),
            new PosisiData("Dokter Spesialis THT", "Kesehatan", "Profesi dokter spesialis THT"),
            new PosisiData("Dokter Spesialis Kulit", "Kesehatan", "Profesi dokter spesialis kulit"),
            new PosisiData("Dokter Spesialis Kandungan", "Kesehatan", "Profesi dokter spesialis kandungan"),
            new PosisiData("Dokter Gigi", "Kesehatan", "Profesi dokter gigi"),
            new PosisiData("Dokter Gigi Spesialis", "Kesehatan", "Profesi dokter gigi spesialis"),
            new PosisiData("Perawat", "Kesehatan", "Profesi perawat"),
            new PosisiData("Bidan", "Kesehatan", "Profesi bidan"),
            new PosisiData("Apoteker", "Kesehatan", "Profesi apoteker"),
            new PosisiData("Fisioterapis", "Kesehatan", "Profesi fisioterapis"),
            new PosisiData("Ahli Gizi", "Kesehatan", "Profesi ahli gizi"),
            new PosisiData("Radiografer", "Kesehatan", "Profesi radiografer"),
            new PosisiData("Analis Kesehatan", "Kesehatan", "Profesi analis kesehatan"),

            // Profesi Pendidikan
            new PosisiData("Guru SD", "Pendidikan", "Profesi guru sekolah dasar"),
            new PosisiData("Guru SMP", "Pendidikan", "Profesi guru sekolah menengah pertama"),
            new PosisiData("Guru SMA/SMK", "Pendidikan", "Profesi guru sekolah menengah atas/kejuruan"),
            new PosisiData("Dosen", "Pendidikan", "Profesi dosen perguruan tinggi"),
            new PosisiData("Kepala Sekolah", "Pendidikan", "Jabatan kepala sekolah"),
            new PosisiData("Pengawas Sekolah", "Pendidikan", "Jabatan pengawas sekolah"),
            new PosisiData("Tutor", "Pendidikan", "Profesi tutor/pengajar privat"),
            new PosisiData("Instruktur", "Pendidikan", "Profesi instruktur kursus"),

            // Profesi Hukum & Keamanan
            new PosisiData("Advokat/Pengacara", "Hukum", "Profesi advokat/pengacara"),
            new PosisiData("Lawyer/Pengacara", "Hukum", "Profesi lawyer/pengacara"),
            new PosisiData("Legal Counsel", "Hukum", "Posisi legal counsel perusahaan"),
            new PosisiData("Notaris", "Hukum", "Profesi notaris"),
            new PosisiData("Hakim", "Hukum", "Profesi hakim"),
            new PosisiData("Jaksa", "Hukum", "Profesi jaksa"),
            new PosisiData("Polisi", "Keamanan", "Profesi kepolisian"),
            new PosisiData("TNI", "Keamanan", "Profesi tentara nasional"),
            new PosisiData("Paralegal", "Hukum", "Posisi paralegal"),
            new PosisiData("Compliance Officer", "Hukum", "Posisi compliance officer"),
            new PosisiData("Security Officer", "Keamanan", "Posisi security officer"),
            new PosisiData("Security", "Keamanan", "Posisi security"),

            // Profesi Teknik & IT
            new PosisiData("Software Engineer", "IT", "Profesi software engineer"),
            new PosisiData("Senior Software Engineer", "IT", "Posisi senior software engineer"),
            new PosisiData("Lead Developer", "IT", "Posisi lead developer"),
            new PosisiData("Full Stack Developer", "IT", "Profesi full stack developer"),
            new PosisiData("Frontend Developer", "IT", "Profesi frontend developer"),
            new PosisiData("Backend Developer", "IT", "Profesi backend developer"),
            new PosisiData("Mobile Developer", "IT", "Profesi mobile developer"),
            new PosisiData("DevOps Engineer", "IT", "Profesi DevOps engineer"),
            new PosisiData("Data Scientist", "IT", "Profesi data scientist"),
            new PosisiData("Data Analyst", "IT", "Profesi data analyst"),
            new PosisiData("Business Analyst", "IT", "Profesi business analyst"),
            new PosisiData("System Analyst", "IT", "Profesi system analyst"),
            new PosisiData("UI/UX Designer", "IT", "Profesi UI/UX designer"),
            new PosisiData("Product Designer", "IT", "Profesi product designer"),
            new PosisiData("Graphic Designer", "IT", "Profesi graphic designer"),
            new PosisiData("System Administrator", "IT", "Profesi system administrator"),
            new PosisiData("Network Administrator", "IT", "Profesi network administrator"),
            new PosisiData("Database Administrator", "IT", "Profesi database administrator"),
            new PosisiData("IT Support", "IT", "Posisi IT support"),
            new PosisiData("Quality Assurance", "IT", "Posisi quality assurance"),
            new PosisiData("Network Engineer", "IT", "Profesi network engineer"),
            new PosisiData("Cyber Security Specialist", "IT", "Profesi cyber security specialist"),

            // Manajemen & Kepemimpinan
            new PosisiData("CEO/Chief Executive Officer", "Manajemen", "Posisi CEO/Chief Executive Officer"),
            new PosisiData("COO/Chief Operating Officer", "Manajemen", "Posisi COO/Chief Operating Officer"),
            new PosisiData("CFO/Chief Financial Officer", "Manajemen", "Posisi CFO/Chief Financial Officer"),
            new PosisiData("CTO/Chief Technology Officer", "Manajemen", "Posisi CTO/Chief Technology Officer"),
            new PosisiData("General Manager", "Manajemen", "Posisi general manager"),
            new PosisiData("Operations Manager", "Manajemen", "Posisi operations manager"),
            new PosisiData("Project Manager", "Manajemen", "Posisi project manager"),
            new PosisiData("Product Manager", "Manajemen", "Posisi product manager"),
            new PosisiData("Regional Manager", "Manajemen", "Posisi regional manager"),
            new PosisiData("Branch Manager", "Manajemen", "Posisi branch manager"),
            new PosisiData("Team Leader", "Manajemen", "Posisi team leader"),
            new PosisiData("Supervisor", "Manajemen", "Posisi supervisor"),
            new PosisiData("Coordinator", "Manajemen", "Posisi coordinator"),

            // Keuangan & Akuntansi
            new PosisiData("Akuntan", "Keuangan", "Profesi akuntan"),
            new PosisiData("Auditor", "Keuangan", "Profesi auditor"),
            new PosisiData("Financial Analyst", "Keuangan", "Posisi financial analyst"),
            new PosisiData("Accounting Manager", "Keuangan", "Posisi accounting manager"),
            new PosisiData("Tax Consultant", "Keuangan", "Profesi tax consultant"),
            new PosisiData("Budget Analyst", "Keuangan", "Posisi budget analyst"),
            new PosisiData("Credit Analyst", "Keuangan", "Posisi credit analyst"),
            new PosisiData("Investment Analyst", "Keuangan", "Posisi investment analyst"),
            new PosisiData("Treasury Officer", "Keuangan", "Posisi treasury officer"),
            new PosisiData("Finance Manager", "Keuangan", "Posisi finance manager"),
            new PosisiData("Bank Teller", "Keuangan", "Posisi bank teller"),

            // Pemasaran & Penjualan
            new PosisiData("Marketing Manager", "Marketing", "Posisi marketing manager"),
            new PosisiData("Marketing Specialist", "Marketing", "Posisi marketing specialist"),
            new PosisiData("Digital Marketing Specialist", "Marketing", "Posisi digital marketing specialist"),
            new PosisiData("Content Marketing", "Marketing", "Posisi content marketing"),
            new PosisiData("Social Media Specialist", "Marketing", "Posisi social media specialist"),
            new PosisiData("SEO Specialist", "Marketing", "Posisi SEO specialist"),
            new PosisiData("Brand Manager", "Marketing", "Posisi brand manager"),
            new PosisiData("Sales Manager", "Sales", "Posisi sales manager"),
            new PosisiData("Sales Executive", "Sales", "Posisi sales executive"),
            new PosisiData("Sales Representative", "Sales", "Posisi sales representative"),
            new PosisiData("Business Development", "Sales", "Posisi business development"),
            new PosisiData("Account Manager", "Sales", "Posisi account manager"),
            new PosisiData("Customer Success Manager", "Sales", "Posisi customer success manager"),

            // Sumber Daya Manusia
            new PosisiData("HR Manager", "HR", "Posisi HR manager"),
            new PosisiData("Human Resources", "HR", "Profesi human resources"),
            new PosisiData("HR Business Partner", "HR", "Posisi HR business partner"),
            new PosisiData("Recruiter", "HR", "Posisi recruiter"),
            new PosisiData("Training Specialist", "HR", "Posisi training specialist"),
            new PosisiData("Compensation & Benefits", "HR", "Posisi compensation & benefits"),
            new PosisiData("Employee Relations", "HR", "Posisi employee relations"),

            // Operasional & Logistik
            new PosisiData("Operations Supervisor", "Operasional", "Posisi operations supervisor"),
            new PosisiData("Supply Chain Manager", "Operasional", "Posisi supply chain manager"),
            new PosisiData("Procurement Officer", "Operasional", "Posisi procurement officer"),
            new PosisiData("Warehouse Manager", "Operasional", "Posisi warehouse manager"),
            new PosisiData("Quality Control", "Operasional", "Posisi quality control"),
            new PosisiData("Production Manager", "Operasional", "Posisi production manager"),

            // Layanan Pelanggan
            new PosisiData("Customer Service Representative", "Customer Service", "Posisi customer service representative"),
            new PosisiData("Call Center Agent", "Customer Service", "Posisi call center agent"),
            new PosisiData("Technical Support", "Customer Service", "Posisi technical support"),
            new PosisiData("Help Desk", "Customer Service", "Posisi help desk"),

            // Kreatif & Media
            new PosisiData("Content Creator", "Kreatif", "Profesi content creator"),
            new PosisiData("Video Editor", "Kreatif", "Profesi video editor"),
            new PosisiData("Photographer", "Kreatif", "Profesi photographer"),
            new PosisiData("Fotografer", "Kreatif", "Profesi fotografer"),
            new PosisiData("Copywriter", "Kreatif", "Profesi copywriter"),
            new PosisiData("Journalist", "Media", "Profesi journalist"),
            new PosisiData("Jurnalis", "Media", "Profesi jurnalis"),
            new PosisiData("Reporter", "Media", "Profesi reporter"),
            new PosisiData("Public Relations", "Kreatif", "Posisi public relations"),
            new PosisiData("Influencer", "Kreatif", "Profesi influencer"),
            new PosisiData("Seniman", "Kreatif", "Profesi seniman"),
            new PosisiData("Desainer Grafis", "Kreatif", "Profesi desainer grafis"),

            // Konsultan
            new PosisiData("Management Consultant", "Konsultan", "Profesi management consultant"),
            new PosisiData("IT Consultant", "Konsultan", "Profesi IT consultant"),
            new PosisiData("Business Consultant", "Konsultan", "Profesi business consultant"),
            new PosisiData("Financial Consultant", "Konsultan", "Profesi financial consultant"),
            new PosisiData("Consultant", "Konsultan", "Profesi consultant"),

            // Profesi Pemerintahan
            new PosisiData("PNS (Pegawai Negeri Sipil)", "Pemerintahan", "Profesi pegawai negeri sipil"),
            new PosisiData("ASN (Aparatur Sipil Negara)", "Pemerintahan", "Profesi aparatur sipil negara"),
            new PosisiData("Bupati/Walikota", "Pemerintahan", "Jabatan bupati/walikota"),
            new PosisiData("Camat", "Pemerintahan", "Jabatan camat"),
            new PosisiData("Lurah/Kepala Desa", "Pemerintahan", "Jabatan lurah/kepala desa"),

            // Profesi Lainnya
            new PosisiData("Entrepreneur", "Bisnis", "Profesi entrepreneur"),
            new PosisiData("Wirausaha", "Bisnis", "Profesi wirausaha"),
            new PosisiData("Freelancer", "Lainnya", "Profesi freelancer"),
            new PosisiData("Peneliti", "Penelitian", "Profesi peneliti"),
            new PosisiData("Analis", "Lainnya", "Profesi analis"),
            new PosisiData("Administrator", "Admin", "Posisi administrator"),
            new PosisiData("Sekretaris", "Admin", "Posisi sekretaris"),
            new PosisiData("Resepsionis", "Admin", "Posisi resepsionis"),
            new PosisiData("Arsitek", "Teknik", "Profesi arsitek"),
            new PosisiData("Insinyur Sipil", "Teknik", "Profesi insinyur sipil"),
            new PosisiData("Insinyur Mesin", "Teknik", "Profesi insinyur mesin"),
            new PosisiData("Insinyur Elektro", "Teknik", "Profesi insinyur elektro"),
            new PosisiData("Farmasis", "Kesehatan", "Profesi farmasis"),
            new PosisiData("Psikolog", "Kesehatan", "Profesi psikolog"),
            new PosisiData("Terapis", "Kesehatan", "Profesi terapis"),
            new PosisiData("Pilot", "Transportasi", "Profesi pilot"),
            new PosisiData("Pramugari", "Transportasi", "Profesi pramugari"),
            new PosisiData("Driver", "Transportasi", "Profesi driver"),
            new PosisiData("Chef/Koki", "Kuliner", "Profesi chef/koki"),
            new PosisiData("Petani", "Pertanian", "Profesi petani"),
            new PosisiData("Peternak", "Pertanian", "Profesi peternak"),
            new PosisiData("Nelayan", "Perikanan", "Profesi nelayan"),
            new PosisiData("Ibu Rumah Tangga", "Lainnya", "Status ibu rumah tangga"),
            new PosisiData("Mahasiswa", "Lainnya", "Status mahasiswa"),
            new PosisiData("Belum Bekerja", "Lainnya", "Status belum bekerja"),
            new PosisiData("Cleaning Service", "Lainnya", "Posisi cleaning service"),
            new PosisiData("Lainnya", "Lainnya", "Posisi lainnya")
        );

        int sortOrder = 1;
        for (PosisiData posisiData : posisiList) {
            MasterPosisi posisi = new MasterPosisi();
            posisi.setNama(posisiData.nama);
            posisi.setKategori(posisiData.kategori);
            posisi.setDeskripsi(posisiData.deskripsi);
            posisi.setIsActive(true);
            posisi.setSortOrder(sortOrder++);
            posisi.setCreatedAt(LocalDateTime.now());
            posisi.setUpdatedAt(LocalDateTime.now());
            
            posisiRepository.save(posisi);
        }
        
        log.info("✅ Posisi & Pekerjaan seeded: {} items", posisiList.size());
    }    private void seedHobiMinat() {
        if (!forceReinsertHobi && hobiRepository.count() > 0) {
            log.info("🎨 Hobi data already exists, skipping...");
            return;
        }

        if (forceReinsertHobi) {
            log.info("🎨 Force reinserting Hobi & Minat data...");
            hobiRepository.deleteAll();
        } else {
            log.info("🎨 Seeding Hobi & Minat data...");
        }

        List<HobiData> hobiList = Arrays.asList(
            new HobiData("Membaca", "Literasi", "Hobi membaca buku dan literatur"),
            new HobiData("Menulis", "Literasi", "Hobi menulis artikel, blog, atau karya tulis"),
            new HobiData("Olahraga", "Olahraga", "Aktivitas olahraga secara umum"),
            new HobiData("Sepak Bola", "Olahraga", "Olahraga sepak bola"),
            new HobiData("Basket", "Olahraga", "Olahraga basket"),
            new HobiData("Voli", "Olahraga", "Olahraga voli"),
            new HobiData("Badminton", "Olahraga", "Olahraga badminton"),
            new HobiData("Tenis", "Olahraga", "Olahraga tenis"),
            new HobiData("Renang", "Olahraga", "Olahraga renang"),
            new HobiData("Berenang", "Olahraga", "Aktivitas berenang"),
            new HobiData("Lari", "Olahraga", "Olahraga lari"),
            new HobiData("Jogging", "Olahraga", "Aktivitas jogging"),
            new HobiData("Gym/Fitness", "Olahraga", "Aktivitas gym dan fitness"),
            new HobiData("Yoga", "Olahraga", "Aktivitas yoga"),
            new HobiData("Hiking", "Outdoor", "Aktivitas hiking"),
            new HobiData("Mendaki Gunung", "Outdoor", "Aktivitas mendaki gunung"),
            new HobiData("Bersepeda", "Outdoor", "Aktivitas bersepeda"),
            new HobiData("Fotografi", "Kreatif", "Hobi fotografi"),
            new HobiData("Videografi", "Kreatif", "Hobi videografi"),
            new HobiData("Melukis", "Seni", "Seni melukis"),
            new HobiData("Menggambar", "Seni", "Seni menggambar"),
            new HobiData("Memasak", "Kuliner", "Hobi memasak"),
            new HobiData("Memanggang", "Kuliner", "Hobi memanggang"),
            new HobiData("Berkebun", "Outdoor", "Hobi berkebun"),
            new HobiData("Bermusik", "Musik", "Aktivitas bermusik"),
            new HobiData("Bermain Gitar", "Musik", "Hobi bermain gitar"),
            new HobiData("Bermain Piano", "Musik", "Hobi bermain piano"),
            new HobiData("Menyanyi", "Musik", "Hobi menyanyi"),
            new HobiData("Menari", "Seni", "Seni menari"),
            new HobiData("Traveling", "Travel", "Hobi traveling"),
            new HobiData("Wisata Kuliner", "Travel", "Hobi wisata kuliner"),
            new HobiData("Nonton Film", "Hiburan", "Hobi nonton film"),
            new HobiData("Main Game", "Teknologi", "Hobi main game"),
            new HobiData("Gaming", "Teknologi", "Aktivitas gaming"),
            new HobiData("Programming", "Teknologi", "Hobi programming"),
            new HobiData("Coding", "Teknologi", "Aktivitas coding"),
            new HobiData("Desain", "Kreatif", "Hobi desain"),
            new HobiData("Handicraft", "Kreatif", "Aktivitas handicraft"),
            new HobiData("Koleksi", "Lainnya", "Hobi koleksi"),
            new HobiData("Memancing", "Outdoor", "Hobi memancing"),
            new HobiData("Berkuda", "Outdoor", "Aktivitas berkuda"),
            new HobiData("Diving", "Olahraga Air", "Aktivitas diving"),
            new HobiData("Surfing", "Olahraga Air", "Olahraga surfing"),
            new HobiData("Skateboard", "Olahraga", "Olahraga skateboard"),
            new HobiData("Vlogging", "Konten Digital", "Aktivitas vlogging"),
            new HobiData("Blogging", "Konten Digital", "Aktivitas blogging"),
            new HobiData("Podcast", "Konten Digital", "Aktivitas podcast"),
            new HobiData("Public Speaking", "Komunikasi", "Aktivitas public speaking"),
            new HobiData("Volunteering", "Sosial", "Aktivitas volunteering"),
            new HobiData("Sosial Media", "Digital", "Aktivitas sosial media"),
            new HobiData("Shopping", "Lifestyle", "Aktivitas shopping"),
            new HobiData("Fashion", "Lifestyle", "Minat fashion"),
            new HobiData("Beauty", "Lifestyle", "Minat beauty"),
            new HobiData("Skincare", "Lifestyle", "Minat skincare"),
            new HobiData("Otomotif", "Teknik", "Minat otomotif"),
            new HobiData("Modifikasi Mobil", "Otomotif", "Hobi modifikasi mobil"),
            new HobiData("Modifikasi Motor", "Otomotif", "Hobi modifikasi motor")
        );

        int sortOrder = 1;
        for (HobiData hobiData : hobiList) {
            MasterHobi hobi = new MasterHobi();
            hobi.setNama(hobiData.nama);
            hobi.setKategori(hobiData.kategori);
            hobi.setDeskripsi(hobiData.deskripsi);
            hobi.setIsActive(true);
            hobi.setSortOrder(sortOrder++);
            hobi.setCreatedAt(LocalDateTime.now());
            hobi.setUpdatedAt(LocalDateTime.now());
            
            hobiRepository.save(hobi);
        }
        
        log.info("✅ Hobi & Minat seeded: {} items", hobiList.size());
    }

    // Helper classes
    private static class PosisiData {
        final String nama;
        final String kategori;
        final String deskripsi;

        PosisiData(String nama, String kategori, String deskripsi) {
            this.nama = nama;
            this.kategori = kategori;
            this.deskripsi = deskripsi;
        }
    }

    private static class HobiData {
        final String nama;
        final String kategori;
        final String deskripsi;

        HobiData(String nama, String kategori, String deskripsi) {
            this.nama = nama;
            this.kategori = kategori;
            this.deskripsi = deskripsi;
        }
    }
}
