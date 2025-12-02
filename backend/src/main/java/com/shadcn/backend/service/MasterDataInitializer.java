package com.shadcn.backend.service;

import com.shadcn.backend.model.MasterAgama;
import com.shadcn.backend.repository.MasterAgamaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

/**
 * Service untuk inisialisasi data master (agama, dll)
 * Menginisialisasi data agama resmi di Indonesia berdasarkan UU No. 1/PNPS/1965
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MasterDataInitializer {
    
    private final MasterAgamaRepository agamaRepository;
    
    @Value("${master.data.agama.force-reinsert:false}")
    private boolean forceReinsertAgamaData;

    /**
     * Inisialisasi data agama resmi di Indonesia
     */
    @Transactional
    public void initializeAgamaData() {
        try {
            log.info("🕌 Mengecek data agama...");
            log.info("🔧 Konfigurasi Force Reinsert Agama: {}", forceReinsertAgamaData);
            
            // Cek apakah data agama sudah ada
            long existingAgamaCount = agamaRepository.count();
            
            if (existingAgamaCount > 0 && !forceReinsertAgamaData) {
                log.info("✅ Data agama sudah ada ({} agama)", existingAgamaCount);
                log.info("💡 Untuk force reinsert, set master.data.agama.force-reinsert=true");
                return;
            }
              if (forceReinsertAgamaData && existingAgamaCount > 0) {
                log.info("🔄 Force reinsert: Menghapus data agama lama dan insert ulang...");
                agamaRepository.deleteAll();
                agamaRepository.flush(); // Force immediate execution
                log.info("🗑️ Data agama lama berhasil dihapus");
            } else if (existingAgamaCount == 0) {
                log.info("📝 Menginisialisasi data agama resmi Indonesia...");
            }
            
            insertAgamaData();
            
            long agamaCount = agamaRepository.count();
            log.info("✅ Data agama berhasil diinisialisasi!");
            log.info("📊 Summary:");
            log.info("   • Total Agama: {} agama resmi", agamaCount);
            log.info("💡 Data agama siap untuk digunakan di dropdown frontend");
            
        } catch (Exception e) {
            log.error("❌ Error saat inisialisasi data agama: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Insert data agama resmi di Indonesia berdasarkan UU No. 1/PNPS/1965
     * dan Keputusan Presiden No. 1 Tahun 1965
     */
    private void insertAgamaData() {
        List<AgamaData> agamaDataList = getAgamaDataList();
        
        for (int i = 0; i < agamaDataList.size(); i++) {
            AgamaData data = agamaDataList.get(i);
            
            MasterAgama agama = new MasterAgama();
            agama.setNama(data.getNama());
            agama.setDeskripsi(data.getDeskripsi());
            agama.setIsActive(true);
            agama.setSortOrder(i + 1); // Urutan berdasarkan kepentingan sejarah
            
            agamaRepository.save(agama);
            log.debug("✓ Inserted agama: {}", data.getNama());
        }
        
        log.info("📝 Berhasil menginisialisasi {} agama resmi Indonesia", agamaDataList.size());
    }    /**
     * Data agama resmi di Indonesia
     * Berdasarkan UU No. 1/PNPS/1965 tentang Pencegahan Penyalahgunaan dan/atau Penodaan Agama
     * Total 6 agama yang diakui secara resmi oleh pemerintah Indonesia
     */
    private List<AgamaData> getAgamaDataList() {
        return Arrays.asList(            new AgamaData(
                "Islam",
                "Agama monoteis yang diajarkan oleh Nabi Muhammad SAW. Agama mayoritas di Indonesia dengan 5 rukun Islam dan 6 rukun iman sebagai pondasi keyakinan utama."
            ),            new AgamaData(
                "Kristen Protestan", 
                "Agama Kristen yang berkembang dari reformasi gereja abad ke-16. Agama minoritas terbesar kedua di Indonesia dengan berbagai denominasi seperti HKBP, GKI, GPIB."
            ),            new AgamaData(
                "Kristen Katolik",
                "Denominasi Kristen tertua yang dipimpin oleh Paus di Vatikan. Memiliki sejarah panjang di Indonesia sejak masa kolonial dengan organisasi KWI."
            ),            new AgamaData(
                "Hindu",
                "Agama tertua di dunia yang berkembang di India. Di Indonesia terutama dianut di Bali dan sebagian Jawa, Sumatra, Kalimantan dengan konsep Tri Hita Karana."
            ),            new AgamaData(
                "Buddha",
                "Agama yang didirikan oleh Siddhartha Gautama (Buddha) di India pada abad ke-6 SM. Memiliki sejarah panjang di Indonesia dengan peninggalan Candi Borobudur."
            ),            new AgamaData(
                "Konghucu",
                "Agama yang didasarkan pada ajaran Kong Hu Cu (Konfusius) dari Tiongkok. Diakui sebagai agama resmi di Indonesia pada tahun 2000 setelah era reformasi."
            )
        );
    }
    
    /**
     * Reset dan reinisialisasi data agama (untuk development)
     */
    @Transactional
    public void resetAndInitializeAgamaData() {
        log.info("🔄 Reset dan reinisialisasi data agama...");
        agamaRepository.deleteAll();
        insertAgamaData();
        log.info("✅ Reset dan reinisialisasi data agama selesai");
    }
    
    /**
     * Data class untuk agama
     */
    private static class AgamaData {
        private final String nama;
        private final String deskripsi;
        
        public AgamaData(String nama, String deskripsi) {
            this.nama = nama;
            this.deskripsi = deskripsi;
        }
        
        public String getNama() {
            return nama;
        }
        
        public String getDeskripsi() {
            return deskripsi;
        }
    }
}
