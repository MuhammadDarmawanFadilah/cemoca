package com.shadcn.backend.config;

import com.shadcn.backend.model.Kota;
import com.shadcn.backend.model.Provinsi;
import com.shadcn.backend.repository.KotaRepository;
import com.shadcn.backend.repository.ProvinsiRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// @Component - Disabled: Moved to DefaultDataService for centralized initialization
public class LocationDataLoader implements CommandLineRunner {

    @Autowired
    private ProvinsiRepository provinsiRepository;

    @Autowired
    private KotaRepository kotaRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        System.out.println("LocationDataLoader: Starting location data initialization...");
        
        long provinsiCount = provinsiRepository.count();
        System.out.println("LocationDataLoader: Current provinsi count = " + provinsiCount);
        
        if (provinsiCount == 0) {
            System.out.println("LocationDataLoader: No provinces found, inserting data...");
            insertProvinsiAndKotaData();
            System.out.println("LocationDataLoader: Data insertion completed.");
        } else {
            System.out.println("LocationDataLoader: Provinces already exist, skipping initialization.");
        }
    }

    private void insertProvinsiAndKotaData() {
        // Define provinsi and their kota/kabupaten
        Map<String, List<String>> provinsiKotaMap = createProvinsiKotaMap();

        int provinsiCount = 0;
        int kotaCount = 0;

        for (Map.Entry<String, List<String>> entry : provinsiKotaMap.entrySet()) {
            String provinsiNama = entry.getKey();
            List<String> kotaList = entry.getValue();

            // Create and save provinsi
            Provinsi provinsi = new Provinsi();
            provinsi.setKode(generateProvinsiKode(provinsiNama));
            provinsi.setNama(provinsiNama);
            provinsi = provinsiRepository.save(provinsi);
            provinsiCount++;

            System.out.println("Inserted provinsi: " + provinsiNama + " with " + kotaList.size() + " kota/kabupaten");

            // Create and save kota for this provinsi
            for (String kotaNama : kotaList) {
                Kota kota = new Kota();
                kota.setKode(generateKotaKode(provinsiNama, kotaNama));
                kota.setNama(kotaNama);
                kota.setTipe(determineKotaTipe(kotaNama));
                kota.setProvinsi(provinsi);
                kotaRepository.save(kota);
                kotaCount++;
            }
        }

        System.out.println("LocationDataLoader: Successfully inserted " + provinsiCount + " provinces and " + kotaCount + " cities");
    }

    private Map<String, List<String>> createProvinsiKotaMap() {
        Map<String, List<String>> map = new HashMap<>();

        // Aceh
        map.put("Aceh", Arrays.asList(
            "Banda Aceh", "Langsa", "Lhokseumawe", "Meulaboh", "Sabang", "Subulussalam",
            "Aceh Besar", "Aceh Barat", "Aceh Barat Daya", "Aceh Jaya", "Aceh Selatan",
            "Aceh Singkil", "Aceh Tamiang", "Aceh Tengah", "Aceh Tenggara", "Aceh Timur",
            "Aceh Utara", "Bener Meriah", "Bireuen", "Gayo Lues", "Nagan Raya",
            "Pidie", "Pidie Jaya", "Simeulue"
        ));

        // Sumatera Utara
        map.put("Sumatera Utara", Arrays.asList(
            "Medan", "Binjai", "Gunungsitoli", "Padangsidimpuan", "Pematangsiantar",
            "Sibolga", "Tanjungbalai", "Tebing Tinggi", "Asahan", "Batu Bara",
            "Dairi", "Deli Serdang", "Humbang Hasundutan", "Karo", "Labuhanbatu",
            "Labuhanbatu Selatan", "Labuhanbatu Utara", "Langkat", "Mandailing Natal",
            "Nias", "Nias Barat", "Nias Selatan", "Nias Utara", "Padang Lawas",
            "Padang Lawas Utara", "Pakpak Bharat", "Samosir", "Serdang Bedagai",
            "Simalungun", "Tapanuli Selatan", "Tapanuli Tengah", "Tapanuli Utara",
            "Toba Samosir"
        ));

        // Jawa Tengah
        map.put("Jawa Tengah", Arrays.asList(
            "Semarang", "Magelang", "Pekalongan", "Salatiga", "Surakarta", "Tegal",
            "Banjarnegara", "Banyumas", "Batang", "Blora", "Boyolali", "Brebes", 
            "Cilacap", "Demak", "Grobogan", "Jepara", "Karanganyar", "Kebumen", 
            "Kendal", "Klaten", "Kudus", "Magelang", "Pati", "Pekalongan", 
            "Pemalang", "Purbalingga", "Purworejo", "Rembang", "Semarang", 
            "Sragen", "Sukoharjo", "Tegal", "Temanggung", "Wonogiri", "Wonosobo"
        ));

        // DKI Jakarta
        map.put("DKI Jakarta", Arrays.asList(
            "Jakarta Pusat", "Jakarta Utara", "Jakarta Barat", "Jakarta Selatan",
            "Jakarta Timur", "Kepulauan Seribu"
        ));

        // Jawa Barat
        map.put("Jawa Barat", Arrays.asList(
            "Bandung", "Bekasi", "Bogor", "Cimahi", "Cirebon", "Depok", "Sukabumi",
            "Tasikmalaya", "Banjar", "Bandung Barat", "Ciamis", "Cianjur", 
            "Garut", "Indramayu", "Karawang", "Kuningan", "Majalengka", 
            "Pangandaran", "Purwakarta", "Subang", "Sumedang"
        ));

        // DI Yogyakarta
        map.put("DI Yogyakarta", Arrays.asList(
            "Yogyakarta", "Bantul", "Gunungkidul", "Kulon Progo", "Sleman"
        ));

        // Jawa Timur
        map.put("Jawa Timur", Arrays.asList(
            "Surabaya", "Malang", "Batu", "Blitar", "Kediri", "Madiun", "Mojokerto",
            "Pasuruan", "Probolinggo", "Bangkalan", "Banyuwangi", "Bojonegoro",
            "Bondowoso", "Gresik", "Jember", "Jombang", "Lamongan", "Lumajang", 
            "Magetan", "Nganjuk", "Ngawi", "Pacitan", "Pamekasan", "Ponorogo", 
            "Sampang", "Sidoarjo", "Situbondo", "Sumenep", "Trenggalek", 
            "Tuban", "Tulungagung"
        ));

        // Banten
        map.put("Banten", Arrays.asList(
            "Serang", "Cilegon", "Tangerang", "Tangerang Selatan", "Lebak",
            "Pandeglang"
        ));

        // Bali
        map.put("Bali", Arrays.asList(
            "Denpasar", "Badung", "Bangli", "Buleleng", "Gianyar", "Jembrana",
            "Karangasem", "Klungkung", "Tabanan"
        ));

        return map;
    }

    private String generateProvinsiKode(String provinsiNama) {
        // Simple implementation - use first few letters
        String kode = provinsiNama.replaceAll("[^A-Za-z]", "").substring(0, Math.min(4, provinsiNama.replaceAll("[^A-Za-z]", "").length())).toUpperCase();
        return kode;
    }

    private String generateKotaKode(String provinsiNama, String kotaNama) {
        String provKode = generateProvinsiKode(provinsiNama);
        String cleanKotaNama = kotaNama.replaceAll("[^A-Za-z]", "");
        String kotaKode = cleanKotaNama.substring(0, Math.min(4, cleanKotaNama.length())).toUpperCase();
        return provKode + "-" + kotaKode;
    }

    private String determineKotaTipe(String kotaNama) {
        if (kotaNama.toLowerCase().contains("kota") || 
            kotaNama.toLowerCase().contains("jakarta") ||
            kotaNama.toLowerCase().contains("yogyakarta")) {
            return "KOTA";
        } else {
            // Default assumption for most entries
            return "KABUPATEN";
        }
    }
}
