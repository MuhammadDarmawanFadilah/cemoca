package com.shadcn.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.shadcn.backend.model.Berita;
import com.shadcn.backend.model.Eso;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.BeritaRepository;
import com.shadcn.backend.repository.EsoRepository;
import com.shadcn.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class SehatDataSeeder implements CommandLineRunner {
    
    private final BeritaRepository beritaRepository;
    private final EsoRepository esoRepository;
    private final UserRepository userRepository;
    
    @Value("${app.seeder.enabled:false}")
    private boolean seederEnabled;
    
    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (!seederEnabled) {
            log.info("Data seeder is disabled (app.seeder.enabled=false)");
            return;
        }
        
        log.info("Data seeder is enabled, starting to seed data...");
        seedBeritaData();
        seedEsoData();
    }
    
    private void seedBeritaData() {
        if (beritaRepository.count() > 0) {
            log.info("Berita data already exists, skipping seeder");
            return;
        }
        
        User admin = userRepository.findByUsername("admin")
            .orElse(userRepository.findAll().stream().findFirst().orElse(null));
        
        if (admin == null) {
            log.warn("No user found for seeding Berita data");
            return;
        }
        
        String[] judulData = {
            "Pentingnya Pola Hidup Sehat", "Tips Menjaga Kesehatan di Musim Hujan",
            "Manfaat Olahraga Rutin untuk Kesehatan Mental", "Nutrisi Seimbang untuk Tubuh Optimal",
            "Cara Mengelola Stres di Era Modern", "Pentingnya Istirahat Cukup untuk Produktivitas",
            "Manfaat Air Putih untuk Kesehatan", "Tips Menjaga Kesehatan Mata di Era Digital",
            "Pentingnya Vaksinasi untuk Semua Usia", "Cara Meningkatkan Sistem Imun Tubuh",
            "Manfaat Meditasi untuk Kesehatan Mental", "Tips Diet Sehat dan Berkelanjutan",
            "Pentingnya Medical Check-up Rutin", "Cara Mengatasi Insomnia Secara Alami",
            "Manfaat Yoga untuk Kesehatan Fisik dan Mental", "Tips Menjaga Kesehatan Jantung",
            "Pentingnya Kesehatan Gigi dan Mulut", "Cara Mencegah Penyakit Kronis",
            "Manfaat Berjemur Sinar Matahari Pagi", "Tips Hidup Sehat untuk Lansia"
        };
        
        String[] ringkasanData = {
            "Pola hidup sehat sangat penting untuk menjaga kesehatan tubuh dan pikiran. Artikel ini membahas tips dan manfaat dari pola hidup sehat.",
            "Musim hujan membawa berbagai tantangan kesehatan. Berikut adalah tips untuk menjaga kesehatan di musim hujan.",
            "Olahraga tidak hanya baik untuk fisik, tetapi juga untuk kesehatan mental. Pelajari manfaatnya di sini.",
            "Nutrisi seimbang adalah kunci untuk menjaga kesehatan tubuh. Pelajari cara memenuhi kebutuhan nutrisi harian.",
            "Stres adalah bagian dari kehidupan modern. Temukan cara efektif untuk mengelola stres dengan baik.",
            "Istirahat yang cukup sangat penting untuk kesehatan dan produktivitas. Pelajari tips mendapatkan tidur berkualitas.",
            "Air putih memiliki banyak manfaat untuk kesehatan tubuh. Ketahui berapa banyak air yang harus diminum setiap hari.",
            "Paparan layar berlebihan dapat merusak kesehatan mata. Temukan cara melindungi mata Anda.",
            "Vaksinasi adalah cara efektif mencegah penyakit. Ketahui vaksin apa saja yang diperlukan untuk setiap usia.",
            "Sistem imun yang kuat melindungi tubuh dari penyakit. Pelajari cara meningkatkan daya tahan tubuh.",
            "Meditasi memiliki banyak manfaat untuk kesehatan mental. Mulai praktik meditasi untuk hidup lebih tenang.",
            "Diet sehat tidak harus menyiksa. Temukan cara diet yang sehat dan dapat dipertahankan jangka panjang.",
            "Medical check-up rutin penting untuk deteksi dini penyakit. Ketahui pemeriksaan apa saja yang perlu dilakukan.",
            "Insomnia dapat diatasi tanpa obat. Pelajari cara alami untuk mendapatkan tidur berkualitas.",
            "Yoga menggabungkan latihan fisik dan mental. Temukan manfaat yoga untuk kesehatan Anda.",
            "Jantung adalah organ vital yang perlu dijaga. Pelajari cara menjaga kesehatan jantung sejak dini.",
            "Kesehatan gigi dan mulut mempengaruhi kesehatan tubuh secara keseluruhan. Ketahui cara merawatnya.",
            "Penyakit kronis dapat dicegah dengan gaya hidup sehat. Pelajari langkah-langkah pencegahannya.",
            "Sinar matahari pagi memiliki banyak manfaat untuk kesehatan. Ketahui waktu terbaik untuk berjemur.",
            "Lansia memiliki kebutuhan kesehatan khusus. Temukan tips hidup sehat untuk usia lanjut."
        };
        
        for (int i = 0; i < 20; i++) {
            Berita berita = new Berita();
            berita.setJudul(judulData[i]);
            berita.setRingkasan(ringkasanData[i]);
            berita.setKonten(ringkasanData[i] + " Artikel ini memberikan informasi lengkap dan praktis yang dapat langsung diterapkan dalam kehidupan sehari-hari untuk meningkatkan kualitas hidup Anda.");
            berita.setPenulis(admin.getFullName());
            berita.setStatus(Berita.StatusBerita.PUBLISHED);
            
            // Set media files (image for odd index, video for even)
            if (i % 2 == 0) {
                berita.setMediaLampiran("[\"video/bandicam 2025-09-23 09-27-59-844.mp4\"]");
            } else {
                berita.setGambarUrl("background/background.jpg");
            }
            
            beritaRepository.save(berita);
        }
        
        log.info("✅ Successfully seeded {} Berita records", 20);
    }
    
    private void seedEsoData() {
        if (esoRepository.count() > 0) {
            log.info("ESO data already exists, skipping seeder");
            return;
        }
        
        User admin = userRepository.findByUsername("admin")
            .orElse(userRepository.findAll().stream().findFirst().orElse(null));
        
        if (admin == null) {
            log.warn("No user found for seeding ESO data");
            return;
        }
        
        String[] titleData = {
            "Panduan Penggunaan Aplikasi Sehat Bersama", "Prosedur Konsultasi Online",
            "Cara Mengatur Pengingat Minum Obat", "Panduan Membuat Profil Pasien",
            "Cara Menambahkan Riwayat Kesehatan", "Panduan Mengunduh Hasil Konsultasi",
            "Cara Mengubah Data Profil", "Panduan Keamanan dan Privasi Data",
            "Cara Berbagi Riwayat Kesehatan dengan Dokter", "Panduan Notifikasi dan Pengingat",
            "Cara Menggunakan Fitur Chat dengan Dokter", "Panduan Pembayaran Konsultasi",
            "Cara Melihat Histori Konsultasi", "Panduan Pengaturan Akun",
            "Cara Menghubungi Customer Support", "Panduan Fitur Darurat",
            "Cara Menggunakan Fitur Video Call", "Panduan Resep Digital",
            "Cara Menyimpan Dokumen Medis", "Panduan Troubleshooting Umum"
        };
        
        String[] descriptionData = {
            "Panduan lengkap untuk menggunakan aplikasi Sehat Bersama, termasuk cara membuat profil pasien, mengatur pengingat minum obat, dan berkonsultasi dengan dokter.",
            "Prosedur untuk melakukan konsultasi online dengan dokter melalui aplikasi Sehat Bersama, termasuk cara membuat janji dan mempersiapkan konsultasi.",
            "Panduan step-by-step untuk mengatur pengingat minum obat di aplikasi Sehat Bersama agar tidak melewatkan jadwal minum obat.",
            "Langkah-langkah membuat profil pasien yang lengkap untuk memudahkan konsultasi dengan dokter.",
            "Cara menambahkan dan mengelola riwayat kesehatan Anda di aplikasi untuk referensi dokter.",
            "Panduan mengunduh hasil konsultasi, resep, dan dokumen medis lainnya dari aplikasi.",
            "Cara mengubah data profil seperti alamat, nomor telepon, dan informasi darurat.",
            "Informasi tentang keamanan data pribadi dan medis Anda di aplikasi Sehat Bersama.",
            "Cara berbagi riwayat kesehatan dengan dokter untuk konsultasi yang lebih efektif.",
            "Panduan mengatur notifikasi dan pengingat untuk jadwal konsultasi dan minum obat.",
            "Cara menggunakan fitur chat untuk berkomunikasi dengan dokter di luar jam konsultasi.",
            "Panduan melakukan pembayaran konsultasi menggunakan berbagai metode pembayaran.",
            "Cara melihat histori konsultasi sebelumnya untuk tracking kesehatan jangka panjang.",
            "Panduan mengatur preferensi akun termasuk bahasa, notifikasi, dan privasi.",
            "Cara menghubungi customer support jika mengalami masalah atau memiliki pertanyaan.",
            "Panduan menggunakan fitur darurat untuk situasi medis yang memerlukan penanganan cepat.",
            "Cara menggunakan fitur video call untuk konsultasi dengan dokter secara langsung.",
            "Panduan menerima dan mengelola resep digital dari dokter melalui aplikasi.",
            "Cara menyimpan dokumen medis seperti hasil lab dan foto untuk referensi dokter.",
            "Solusi untuk masalah umum yang mungkin dihadapi saat menggunakan aplikasi."
        };
        
        for (int i = 0; i < 20; i++) {
            Eso eso = Eso.builder()
                .title(titleData[i])
                .description(descriptionData[i])
                .author(admin)
                .build();
            
            // Set media files (video for first 5, image for rest)
            if (i < 5) {
                eso.setMediaPath("video/bandicam 2025-09-23 09-27-59-844.mp4");
                eso.setMediaType("video");
            } else {
                eso.setMediaPath("background/background.jpg");
                eso.setMediaType("image");
            }
            
            esoRepository.save(eso);
        }
        
        log.info("✅ Successfully seeded {} ESO records", 20);
    }
}
