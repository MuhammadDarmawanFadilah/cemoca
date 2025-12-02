package com.shadcn.backend.service;

import com.shadcn.backend.dto.KotaResponseDTO;
import com.shadcn.backend.dto.ProvinsiResponseDTO;
import com.shadcn.backend.dto.ProvinsiRequest;
import com.shadcn.backend.dto.KotaRequest;
import com.shadcn.backend.model.Kota;
import com.shadcn.backend.model.Provinsi;
import com.shadcn.backend.repository.KotaRepository;
import com.shadcn.backend.repository.ProvinsiRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LocationService {

    @Autowired
    private ProvinsiRepository provinsiRepository;

    @Autowired
    private KotaRepository kotaRepository;

    // ============ EXISTING READ METHODS ============
    
    // Get all provinces
    public List<ProvinsiResponseDTO> getAllProvinsi() {
        List<Provinsi> provinsiList = provinsiRepository.findAllOrderByNama();
        return provinsiList.stream()
                .map(this::convertToProvinsiResponseDTO)
                .collect(Collectors.toList());
    }

    // Get provinces without kota list (lighter response)
    public List<ProvinsiResponseDTO> getAllProvinsiOnly() {
        List<Provinsi> provinsiList = provinsiRepository.findAllOrderByNama();
        return provinsiList.stream()
                .map(provinsi -> {
                    ProvinsiResponseDTO dto = new ProvinsiResponseDTO();
                    dto.setId(provinsi.getId());
                    dto.setKode(provinsi.getKode());
                    dto.setNama(provinsi.getNama());
                    dto.setKotaList(null); // Don't load kota list for performance
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // ============ NEW CRUD METHODS FOR PROVINSI ============
    
    @Transactional(readOnly = true)
    public Page<ProvinsiResponseDTO> getAllProvinsiWithPagination(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Provinsi> provinsiPage = provinsiRepository.findWithFilters(search, pageable);
        return provinsiPage.map(this::convertToProvinsiResponseDTOWithoutKota);
    }
    
    @Transactional(readOnly = true)
    public ProvinsiResponseDTO getProvinsiById(Long id) {
        Provinsi provinsi = provinsiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Provinsi not found with id: " + id));
        return convertToProvinsiResponseDTO(provinsi);
    }
    
    @Transactional
    public ProvinsiResponseDTO createProvinsi(ProvinsiRequest request) {
        // Check if kode already exists
        if (provinsiRepository.existsByKode(request.getKode())) {
            throw new RuntimeException("Provinsi dengan kode '" + request.getKode() + "' sudah ada");
        }
        
        // Check if nama already exists
        if (provinsiRepository.existsByNama(request.getNama())) {
            throw new RuntimeException("Provinsi dengan nama '" + request.getNama() + "' sudah ada");
        }
        
        Provinsi provinsi = new Provinsi();
        provinsi.setKode(request.getKode());
        provinsi.setNama(request.getNama());
        
        Provinsi saved = provinsiRepository.save(provinsi);
        return convertToProvinsiResponseDTOWithoutKota(saved);
    }
    
    @Transactional
    public ProvinsiResponseDTO updateProvinsi(Long id, ProvinsiRequest request) {
        Provinsi existing = provinsiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Provinsi not found with id: " + id));
        
        // Check if kode already exists (excluding current record)
        if (provinsiRepository.existsByKodeAndIdNot(request.getKode(), id)) {
            throw new RuntimeException("Provinsi dengan kode '" + request.getKode() + "' sudah ada");
        }
        
        // Check if nama already exists (excluding current record)
        if (provinsiRepository.existsByNamaAndIdNot(request.getNama(), id)) {
            throw new RuntimeException("Provinsi dengan nama '" + request.getNama() + "' sudah ada");
        }
        
        existing.setKode(request.getKode());
        existing.setNama(request.getNama());
        
        Provinsi saved = provinsiRepository.save(existing);
        return convertToProvinsiResponseDTOWithoutKota(saved);
    }
    
    @Transactional
    public void deleteProvinsi(Long id) {
        if (!provinsiRepository.existsById(id)) {
            throw new RuntimeException("Provinsi not found with id: " + id);
        }
        
        // Check if provinsi has kota
        List<Kota> kotaList = kotaRepository.findByProvinsiIdOrderByNama(id);
        if (!kotaList.isEmpty()) {
            throw new RuntimeException("Tidak dapat menghapus provinsi yang masih memiliki " + kotaList.size() + " kota/kabupaten");
        }
        
        provinsiRepository.deleteById(id);
    }

    // ============ NEW CRUD METHODS FOR KOTA ============
    
    @Transactional(readOnly = true)
    public Page<KotaResponseDTO> getAllKotaWithPagination(String search, Long provinsiId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Kota> kotaPage = kotaRepository.findWithFilters(search, provinsiId, pageable);
        return kotaPage.map(this::convertToKotaResponseDTO);
    }
    
    @Transactional(readOnly = true)
    public KotaResponseDTO getKotaById(Long id) {
        Kota kota = kotaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kota not found with id: " + id));
        return convertToKotaResponseDTO(kota);
    }
    
    @Transactional
    public KotaResponseDTO createKota(KotaRequest request) {
        // Check if kode already exists
        if (kotaRepository.existsByKode(request.getKode())) {
            throw new RuntimeException("Kota dengan kode '" + request.getKode() + "' sudah ada");
        }
        
        // Check if nama already exists
        if (kotaRepository.existsByNama(request.getNama())) {
            throw new RuntimeException("Kota dengan nama '" + request.getNama() + "' sudah ada");
        }
        
        // Get provinsi
        Provinsi provinsi = provinsiRepository.findById(request.getProvinsiId())
                .orElseThrow(() -> new RuntimeException("Provinsi not found with id: " + request.getProvinsiId()));
        
        Kota kota = new Kota();
        kota.setKode(request.getKode());
        kota.setNama(request.getNama());
        kota.setTipe(request.getTipe());
        kota.setProvinsi(provinsi);
        
        Kota saved = kotaRepository.save(kota);
        return convertToKotaResponseDTO(saved);
    }
    
    @Transactional
    public KotaResponseDTO updateKota(Long id, KotaRequest request) {
        Kota existing = kotaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kota not found with id: " + id));
        
        // Check if kode already exists (excluding current record)
        if (kotaRepository.existsByKodeAndIdNot(request.getKode(), id)) {
            throw new RuntimeException("Kota dengan kode '" + request.getKode() + "' sudah ada");
        }
        
        // Check if nama already exists (excluding current record)
        if (kotaRepository.existsByNamaAndIdNot(request.getNama(), id)) {
            throw new RuntimeException("Kota dengan nama '" + request.getNama() + "' sudah ada");
        }
        
        // Get provinsi
        Provinsi provinsi = provinsiRepository.findById(request.getProvinsiId())
                .orElseThrow(() -> new RuntimeException("Provinsi not found with id: " + request.getProvinsiId()));
        
        existing.setKode(request.getKode());
        existing.setNama(request.getNama());
        existing.setTipe(request.getTipe());
        existing.setProvinsi(provinsi);
        
        Kota saved = kotaRepository.save(existing);
        return convertToKotaResponseDTO(saved);
    }
    
    @Transactional
    public void deleteKota(Long id) {
        if (!kotaRepository.existsById(id)) {
            throw new RuntimeException("Kota not found with id: " + id);
        }
        
        kotaRepository.deleteById(id);
    }    // ============ EXISTING METHODS ============

    // Helper methods for conversion
    private ProvinsiResponseDTO convertToProvinsiResponseDTO(Provinsi provinsi) {
        ProvinsiResponseDTO dto = new ProvinsiResponseDTO();
        dto.setId(provinsi.getId());
        dto.setKode(provinsi.getKode());
        dto.setNama(provinsi.getNama());
        
        // Convert kota list if available
        if (provinsi.getKotaList() != null) {
            List<KotaResponseDTO> kotaList = provinsi.getKotaList().stream()
                    .map(this::convertToKotaResponseDTO)
                    .collect(Collectors.toList());
            dto.setKotaList(kotaList);
            dto.setKotaCount(kotaList.size());
        } else {
            // If kota list is not loaded, set count to 0 for consistency
            dto.setKotaCount(0);
        }
        
        return dto;
    }private ProvinsiResponseDTO convertToProvinsiResponseDTOWithoutKota(Provinsi provinsi) {
        ProvinsiResponseDTO dto = new ProvinsiResponseDTO();
        dto.setId(provinsi.getId());
        dto.setKode(provinsi.getKode());
        dto.setNama(provinsi.getNama());
        dto.setKotaList(null); // Don't load kota list for performance
        
        // Add kota count for admin interface
        if (provinsi.getKotaList() != null) {
            dto.setKotaCount(provinsi.getKotaList().size());
        } else {
            // If kota list is not loaded, query the count separately
            int kotaCount = kotaRepository.countByProvinsiId(provinsi.getId());
            dto.setKotaCount(kotaCount);
        }
        
        return dto;
    }

    private KotaResponseDTO convertToKotaResponseDTO(Kota kota) {
        KotaResponseDTO dto = new KotaResponseDTO();
        dto.setId(kota.getId());
        dto.setKode(kota.getKode());
        dto.setNama(kota.getNama());
        dto.setTipe(kota.getTipe());
        dto.setProvinsiNama(kota.getProvinsi().getNama());
        return dto;
    }

    // Get kota by provinsi ID
    public List<KotaResponseDTO> getKotaByProvinsiId(Long provinsiId) {
        List<Kota> kotaList = kotaRepository.findByProvinsiIdOrderByNama(provinsiId);
        return kotaList.stream()
                .map(this::convertToKotaResponseDTO)
                .collect(Collectors.toList());
    }

    // Get kota by provinsi name
    public List<KotaResponseDTO> getKotaByProvinsiNama(String provinsiNama) {
        List<Kota> kotaList = kotaRepository.findByProvinsiNamaOrderByNama(provinsiNama);
        return kotaList.stream()
                .map(this::convertToKotaResponseDTO)
                .collect(Collectors.toList());
    }

    // Get provinsi by name
    public Optional<ProvinsiResponseDTO> getProvinsiByNama(String nama) {
        Optional<Provinsi> provinsi = provinsiRepository.findByNama(nama);
        return provinsi.map(this::convertToProvinsiResponseDTO);
    }

    // Method for first-time initialization only
    @Transactional
    public void initializeLocationData() {
        System.out.println("LocationService: Initializing location data...");
        insertProvinsiAndKotaData();
        System.out.println("LocationService: Location data initialization completed.");
    }    // Method to reset and re-initialize data (FOR DEVELOPMENT ONLY)
    @Transactional
    public void resetAndInitializeData() {
        try {
            System.out.println("LocationService: Resetting all location data...");
            
            // Delete all existing data in correct order (child first)
            kotaRepository.deleteAll();
            kotaRepository.flush(); // Force immediate execution
            
            provinsiRepository.deleteAll();
            provinsiRepository.flush(); // Force immediate execution
            
            System.out.println("LocationService: All location data deleted. Re-initializing...");
            
            // Re-run initialization
            insertProvinsiAndKotaData();
            
            System.out.println("LocationService: Location data reset and re-initialization completed.");
        } catch (Exception e) {
            System.err.println("LocationService: Error during reset: " + e.getMessage());
            throw e; // Re-throw to trigger transaction rollback
        }
    }private void insertProvinsiAndKotaData() {
        // Import location data from LocationDataInitializer logic
        Map<String, List<String>> provinsiKotaMap = createProvinsiKotaMap();

        int provinsiIndex = 1;
        for (Map.Entry<String, List<String>> entry : provinsiKotaMap.entrySet()) {
            String provinsiNama = entry.getKey();
            List<String> kotaList = entry.getValue();

            // Create and save provinsi
            Provinsi provinsi = new Provinsi();
            provinsi.setKode(String.format("PROV%02d", provinsiIndex));
            provinsi.setNama(provinsiNama);
            provinsi = provinsiRepository.save(provinsi);

            System.out.println("✓ Inserted provinsi: " + provinsiNama + " (ID: " + provinsi.getId() + ")");

            // Create and save all kota/kabupaten for this provinsi
            int kotaIndex = 1;
            for (String kotaNama : kotaList) {
                Kota kota = new Kota();
                kota.setKode(String.format("PROV%02d%03d", provinsiIndex, kotaIndex));
                kota.setNama(kotaNama);
                kota.setProvinsi(provinsi);
                kotaRepository.save(kota);
                kotaIndex++;
            }

            System.out.println("  → Inserted " + kotaList.size() + " kota/kabupaten");
            provinsiIndex++;
        }
    }    private Map<String, List<String>> createProvinsiKotaMap() {
        Map<String, List<String>> provinsiKotaMap = new HashMap<>();
        
        // Add major provinces with their cities
        provinsiKotaMap.put("DKI Jakarta", Arrays.asList(
            "Jakarta Barat", "Jakarta Pusat", "Jakarta Selatan", "Jakarta Timur", "Jakarta Utara", "Kepulauan Seribu"
        ));
        
        provinsiKotaMap.put("Jawa Barat", Arrays.asList(
            "Bandung", "Bekasi", "Bogor", "Cirebon", "Depok", "Sukabumi", "Tasikmalaya", "Banjar",
            "Bandung Barat", "Ciamis", "Cianjur", "Garut", "Indramayu", "Karawang", "Kuningan",
            "Majalengka", "Pangandaran", "Purwakarta", "Subang", "Sumedang", "Cimahi"
        ));
        
        provinsiKotaMap.put("Jawa Tengah", Arrays.asList(
            "Semarang", "Solo", "Yogyakarta", "Magelang", "Pekalongan", "Salatiga", "Tegal",
            "Banjarnegara", "Banyumas", "Batang", "Blora", "Boyolali", "Brebes", "Cilacap",
            "Demak", "Grobogan", "Jepara", "Karanganyar", "Kebumen", "Kendal", "Klaten",
            "Kudus", "Pemalang", "Purbalingga", "Purworejo", "Rembang", "Sragen", "Temanggung", "Wonogiri", "Wonosobo"
        ));
        
        provinsiKotaMap.put("Jawa Timur", Arrays.asList(
            "Surabaya", "Malang", "Kediri", "Madiun", "Mojokerto", "Pasuruan", "Probolinggo", "Batu",
            "Bangkalan", "Banyuwangi", "Blitar", "Bojonegoro", "Bondowoso", "Gresik", "Jember",
            "Jombang", "Lamongan", "Lumajang", "Magetan", "Nganjuk", "Ngawi", "Pacitan",
            "Pamekasan", "Ponorogo", "Sampang", "Sidoarjo", "Situbondo", "Sumenep", "Trenggalek", "Tuban", "Tulungagung"
        ));
        
        provinsiKotaMap.put("Banten", Arrays.asList(
            "Cilegon", "Serang", "Tangerang", "Tangerang Selatan", "Lebak", "Pandeglang"
        ));

        return provinsiKotaMap;
    }
}
