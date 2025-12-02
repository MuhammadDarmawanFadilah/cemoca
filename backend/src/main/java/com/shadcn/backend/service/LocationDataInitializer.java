package com.shadcn.backend.service;

import com.shadcn.backend.model.Kota;
import com.shadcn.backend.model.Provinsi;
import com.shadcn.backend.repository.KotaRepository;
import com.shadcn.backend.repository.ProvinsiRepository;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// @Service - DISABLED: Moved to DefaultDataService for centralized initialization
// This service is disabled to prevent duplicate initialization conflicts
public class LocationDataInitializer {

    // @Autowired - DISABLED: Service moved to DefaultDataService
    private ProvinsiRepository provinsiRepository;

    // @Autowired - DISABLED: Service moved to DefaultDataService
    private KotaRepository kotaRepository;// @PostConstruct - DISABLED: Initialization moved to DefaultDataService
    // @Transactional
    public void initializeLocationData() {
        System.out.println("LocationDataInitializer: Starting initialization...");
        // Only initialize if data doesn't exist
        long provinsiCount = provinsiRepository.count();
        System.out.println("LocationDataInitializer: Current provinsi count = " + provinsiCount);
        
        if (provinsiCount == 0) {
            System.out.println("LocationDataInitializer: No provinces found, inserting data...");
            insertProvinsiAndKotaData();
            System.out.println("LocationDataInitializer: Data insertion completed.");
        } else {
            System.out.println("LocationDataInitializer: Provinces already exist, skipping initialization.");
        }
    }

    private void insertProvinsiAndKotaData() {
        // Define provinsi and their kota/kabupaten
        Map<String, List<String>> provinsiKotaMap = createProvinsiKotaMap();

        for (Map.Entry<String, List<String>> entry : provinsiKotaMap.entrySet()) {
            String provinsiNama = entry.getKey();
            List<String> kotaList = entry.getValue();

            // Create and save provinsi
            Provinsi provinsi = new Provinsi();
            provinsi.setKode(generateProvinsiKode(provinsiNama));
            provinsi.setNama(provinsiNama);
            provinsi = provinsiRepository.save(provinsi);

            // Create and save kota for this provinsi
            for (String kotaNama : kotaList) {
                Kota kota = new Kota();
                kota.setKode(generateKotaKode(provinsiNama, kotaNama));
                kota.setNama(kotaNama);
                kota.setTipe(determineKotaTipe(kotaNama));
                kota.setProvinsi(provinsi);
                kotaRepository.save(kota);
            }
        }
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

        // Sumatera Barat
        map.put("Sumatera Barat", Arrays.asList(
            "Padang", "Bukittinggi", "Padangpanjang", "Pariaman", "Payakumbuh",
            "Sawahlunto", "Solok", "Agam", "Dharmasraya", "Kepulauan Mentawai",
            "Lima Puluh Kota", "Padang Pariaman", "Pasaman", "Pasaman Barat",
            "Pesisir Selatan", "Sijunjung", "Solok", "Solok Selatan", "Tanah Datar"
        ));

        // Riau
        map.put("Riau", Arrays.asList(
            "Pekanbaru", "Dumai", "Bengkalis", "Indragiri Hilir", "Indragiri Hulu",
            "Kampar", "Kepulauan Meranti", "Kuantan Singingi", "Pelalawan",
            "Rokan Hilir", "Rokan Hulu", "Siak"
        ));

        // Kepulauan Riau
        map.put("Kepulauan Riau", Arrays.asList(
            "Batam", "Tanjungpinang", "Bintan", "Karimun", "Kepulauan Anambas",
            "Lingga", "Natuna"
        ));

        // Jambi
        map.put("Jambi", Arrays.asList(
            "Jambi", "Sungai Penuh", "Batanghari", "Bungo", "Kerinci", "Merangin",
            "Muaro Jambi", "Sarolangun", "Tanjung Jabung Barat", "Tanjung Jabung Timur", "Tebo"
        ));

        // Sumatera Selatan
        map.put("Sumatera Selatan", Arrays.asList(
            "Palembang", "Lubuklinggau", "Pagar Alam", "Prabumulih", "Banyuasin",
            "Empat Lawang", "Lahat", "Muara Enim", "Musi Banyuasin", "Musi Rawas",
            "Musi Rawas Utara", "Ogan Ilir", "Ogan Komering Ilir", "Ogan Komering Ulu",
            "Ogan Komering Ulu Selatan", "Ogan Komering Ulu Timur"
        ));

        // Bangka Belitung
        map.put("Bangka Belitung", Arrays.asList(
            "Pangkalpinang", "Bangka", "Bangka Barat", "Bangka Selatan",
            "Bangka Tengah", "Belitung", "Belitung Timur"
        ));

        // Bengkulu
        map.put("Bengkulu", Arrays.asList(
            "Bengkulu", "Bengkulu Selatan", "Bengkulu Tengah", "Bengkulu Utara",
            "Kaur", "Kepahiang", "Lebong", "Mukomuko", "Rejang Lebong", "Seluma"
        ));

        // Lampung
        map.put("Lampung", Arrays.asList(
            "Bandar Lampung", "Metro", "Lampung Barat", "Lampung Selatan",
            "Lampung Tengah", "Lampung Timur", "Lampung Utara", "Mesuji",
            "Pesawaran", "Pesisir Barat", "Pringsewu", "Tanggamus", "Tulang Bawang",
            "Tulang Bawang Barat", "Way Kanan"
        ));

        // DKI Jakarta
        map.put("DKI Jakarta", Arrays.asList(
            "Jakarta Pusat", "Jakarta Utara", "Jakarta Barat", "Jakarta Selatan",
            "Jakarta Timur", "Kepulauan Seribu"
        ));

        // Jawa Barat
        map.put("Jawa Barat", Arrays.asList(
            "Bandung", "Bekasi", "Bogor", "Cimahi", "Cirebon", "Depok", "Sukabumi",
            "Tasikmalaya", "Banjar", "Bandung", "Bandung Barat", "Bekasi", "Bogor",
            "Ciamis", "Cianjur", "Cirebon", "Garut", "Indramayu", "Karawang",
            "Kuningan", "Majalengka", "Pangandaran", "Purwakarta", "Subang",
            "Sukabumi", "Sumedang", "Tasikmalaya"
        ));

        // Jawa Tengah
        map.put("Jawa Tengah", Arrays.asList(
            "Semarang", "Magelang", "Pekalongan", "Purwokerto", "Salatiga", "Solo",
            "Surakarta", "Tegal", "Banjarnegara", "Banyumas", "Batang", "Blora",
            "Boyolali", "Brebes", "Cilacap", "Demak", "Grobogan", "Jepara",
            "Karanganyar", "Kebumen", "Kendal", "Klaten", "Kudus", "Magelang",
            "Pati", "Pekalongan", "Pemalang", "Purbalingga", "Purworejo", "Rembang",
            "Semarang", "Sragen", "Sukoharjo", "Tegal", "Temanggung", "Wonogiri",
            "Wonosobo"
        ));

        // DI Yogyakarta
        map.put("DI Yogyakarta", Arrays.asList(
            "Yogyakarta", "Bantul", "Gunungkidul", "Kulon Progo", "Sleman"
        ));

        // Jawa Timur
        map.put("Jawa Timur", Arrays.asList(
            "Surabaya", "Malang", "Batu", "Blitar", "Kediri", "Madiun", "Mojokerto",
            "Pasuruan", "Probolinggo", "Bangkalan", "Banyuwangi", "Blitar", "Bojonegoro",
            "Bondowoso", "Gresik", "Jember", "Jombang", "Kediri", "Lamongan",
            "Lumajang", "Madiun", "Magetan", "Malang", "Mojokerto", "Nganjuk",
            "Ngawi", "Pacitan", "Pamekasan", "Pasuruan", "Ponorogo", "Probolinggo",
            "Sampang", "Sidoarjo", "Situbondo", "Sumenep", "Trenggalek", "Tuban",
            "Tulungagung"
        ));

        // Banten
        map.put("Banten", Arrays.asList(
            "Serang", "Cilegon", "Tangerang", "Tangerang Selatan", "Lebak",
            "Pandeglang", "Serang", "Tangerang"
        ));

        // Bali
        map.put("Bali", Arrays.asList(
            "Denpasar", "Badung", "Bangli", "Buleleng", "Gianyar", "Jembrana",
            "Karangasem", "Klungkung", "Tabanan"
        ));

        // Nusa Tenggara Barat
        map.put("Nusa Tenggara Barat", Arrays.asList(
            "Mataram", "Bima", "Dompu", "Lombok Barat", "Lombok Tengah",
            "Lombok Timur", "Lombok Utara", "Sumbawa", "Sumbawa Barat"
        ));        // Nusa Tenggara Timur
        map.put("Nusa Tenggara Timur", Arrays.asList(
            "Kupang", "Alor", "Belu", "Ende", "Flores Timur", "Lembata",
            "Manggarai", "Manggarai Barat", "Manggarai Timur", "Nagekeo", "Ngada",
            "Rote Ndao", "Sabu Raijua", "Sikka", "Sumba Barat", "Sumba Barat Daya",
            "Sumba Tengah", "Sumba Timur", "Timor Tengah Selatan", "Timor Tengah Utara"
        ));

        // Kalimantan Barat
        map.put("Kalimantan Barat", Arrays.asList(
            "Pontianak", "Singkawang", "Bengkayang", "Kapuas Hulu", "Kayong Utara",
            "Ketapang", "Kubu Raya", "Landak", "Melawi", "Pontianak", "Sambas",
            "Sanggau", "Sekadau", "Sintang"
        ));

        // Kalimantan Tengah
        map.put("Kalimantan Tengah", Arrays.asList(
            "Palangka Raya", "Barito Selatan", "Barito Timur", "Barito Utara",
            "Gunung Mas", "Kapuas", "Katingan", "Kotawaringin Barat", "Kotawaringin Timur",
            "Lamandau", "Murung Raya", "Pulang Pisau", "Sukamara", "Seruyan"
        ));

        // Kalimantan Selatan
        map.put("Kalimantan Selatan", Arrays.asList(
            "Banjarmasin", "Banjarbaru", "Balangan", "Banjar", "Barito Kuala",
            "Hulu Sungai Selatan", "Hulu Sungai Tengah", "Hulu Sungai Utara",
            "Kotabaru", "Tabalong", "Tanah Bumbu", "Tanah Laut", "Tapin"
        ));

        // Kalimantan Timur
        map.put("Kalimantan Timur", Arrays.asList(
            "Samarinda", "Balikpapan", "Bontang", "Berau", "Kutai Barat",
            "Kutai Kartanegara", "Kutai Timur", "Mahakam Ulu", "Paser",
            "Penajam Paser Utara"
        ));

        // Kalimantan Utara
        map.put("Kalimantan Utara", Arrays.asList(
            "Tarakan", "Bulungan", "Malinau", "Nunukan", "Tana Tidung"
        ));

        // Sulawesi Utara
        map.put("Sulawesi Utara", Arrays.asList(
            "Manado", "Bitung", "Kotamobagu", "Tomohon", "Bolaang Mongondow",
            "Bolaang Mongondow Selatan", "Bolaang Mongondow Timur", "Bolaang Mongondow Utara",
            "Kepulauan Sangihe", "Kepulauan Siau Tagulandang Biaro", "Kepulauan Talaud",
            "Minahasa", "Minahasa Selatan", "Minahasa Tenggara", "Minahasa Utara"
        ));

        // Sulawesi Tengah
        map.put("Sulawesi Tengah", Arrays.asList(
            "Palu", "Banggai", "Banggai Kepulauan", "Buol", "Donggala", "Morowali",
            "Morowali Utara", "Parigi Moutong", "Poso", "Sigi", "Tojo Una-Una", "Tolitoli"
        ));

        // Sulawesi Selatan
        map.put("Sulawesi Selatan", Arrays.asList(
            "Makassar", "Palopo", "Parepare", "Bantaeng", "Barru", "Bone",
            "Bulukumba", "Enrekang", "Gowa", "Jeneponto", "Kepulauan Selayar",
            "Luwu", "Luwu Timur", "Luwu Utara", "Maros", "Pangkajene dan Kepulauan",
            "Pinrang", "Sidenreng Rappang", "Sinjai", "Soppeng", "Takalar",
            "Tana Toraja", "Toraja Utara", "Wajo"
        ));

        // Sulawesi Tenggara
        map.put("Sulawesi Tenggara", Arrays.asList(
            "Kendari", "Bau-Bau", "Bombana", "Buton", "Buton Selatan", "Buton Tengah",
            "Buton Utara", "Kolaka", "Kolaka Timur", "Kolaka Utara", "Konawe",
            "Konawe Kepulauan", "Konawe Selatan", "Konawe Utara", "Muna", "Muna Barat",
            "Wakatobi"
        ));

        // Gorontalo
        map.put("Gorontalo", Arrays.asList(
            "Gorontalo", "Bone Bolango", "Boalemo", "Gorontalo", "Gorontalo Utara",
            "Pohuwato"
        ));

        // Sulawesi Barat
        map.put("Sulawesi Barat", Arrays.asList(
            "Mamuju", "Majene", "Mamasa", "Mamuju", "Mamuju Tengah", "Mamuju Utara",
            "Polewali Mandar"
        ));

        // Maluku
        map.put("Maluku", Arrays.asList(
            "Ambon", "Tual", "Buru", "Buru Selatan", "Kepulauan Aru", "Maluku Barat Daya",
            "Maluku Tengah", "Maluku Tenggara", "Maluku Tenggara Barat", "Seram Bagian Barat",
            "Seram Bagian Timur"
        ));

        // Maluku Utara
        map.put("Maluku Utara", Arrays.asList(
            "Ternate", "Tidore Kepulauan", "Halmahera Barat", "Halmahera Selatan",
            "Halmahera Tengah", "Halmahera Timur", "Halmahera Utara", "Kepulauan Sula",
            "Pulau Morotai", "Pulau Taliabu"
        ));

        // Papua
        map.put("Papua", Arrays.asList(
            "Jayapura", "Asmat", "Biak Numfor", "Boven Digoel", "Deiyai", "Dogiyai",
            "Intan Jaya", "Jayapura", "Jayawijaya", "Keerom", "Kepulauan Yapen",
            "Lanny Jaya", "Mamberamo Raya", "Mamberamo Tengah", "Mappi", "Merauke",
            "Mimika", "Nabire", "Nduga", "Paniai", "Pegunungan Bintang", "Puncak",
            "Puncak Jaya", "Sarmi", "Supiori", "Tolikara", "Waropen", "Yahukimo", "Yalimo"
        ));

        // Papua Barat
        map.put("Papua Barat", Arrays.asList(
            "Manokwari", "Sorong", "Fakfak", "Kaimana", "Manokwari", "Manokwari Selatan",
            "Maybrat", "Pegunungan Arfak", "Raja Ampat", "Sorong", "Sorong Selatan",
            "Tambrauw", "Teluk Bintuni", "Teluk Wondama"
        ));

        // Papua Tengah
        map.put("Papua Tengah", Arrays.asList(
            "Nabire", "Dogiyai", "Deiyai", "Intan Jaya", "Mimika", "Nabire",
            "Paniai", "Puncak", "Puncak Jaya"
        ));

        // Papua Pegunungan
        map.put("Papua Pegunungan", Arrays.asList(
            "Jayawijaya", "Lanny Jaya", "Nduga", "Pegunungan Bintang", "Tolikara",
            "Yahukimo", "Yalimo"
        ));

        // Papua Selatan
        map.put("Papua Selatan", Arrays.asList(
            "Merauke", "Asmat", "Boven Digoel", "Mappi", "Merauke"
        ));

        // Papua Barat Daya
        map.put("Papua Barat Daya", Arrays.asList(
            "Sorong", "Fakfak", "Kaimana", "Maybrat", "Raja Ampat", "Sorong",
            "Sorong Selatan", "Tambrauw"
        ));

        return map;
    }

    private String generateProvinsiKode(String provinsiNama) {
        // Simple implementation - use first few letters
        return provinsiNama.replaceAll("[^A-Za-z]", "").substring(0, Math.min(4, provinsiNama.length())).toUpperCase();
    }

    private String generateKotaKode(String provinsiNama, String kotaNama) {
        String provKode = generateProvinsiKode(provinsiNama);
        String kotaKode = kotaNama.replaceAll("[^A-Za-z]", "").substring(0, Math.min(4, kotaNama.length())).toUpperCase();
        return provKode + "-" + kotaKode;
    }

    private String determineKotaTipe(String kotaNama) {
        if (kotaNama.toLowerCase().contains("kota") || 
            kotaNama.toLowerCase().contains("jakarta") ||
            kotaNama.toLowerCase().contains("yogyakarta")) {
            return "KOTA";
        } else if (kotaNama.toLowerCase().contains("kabupaten")) {
            return "KABUPATEN";
        } else {
            // Default assumption for most entries
            return "KABUPATEN";
        }
    }
}
