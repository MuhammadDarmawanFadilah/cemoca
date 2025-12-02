package com.shadcn.backend.service;

import com.shadcn.backend.model.*;
import com.shadcn.backend.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class WilayahCacheService {
    
    @Autowired
    private WilayahProvinsiRepository provinsiRepository;
    
    @Autowired
    private WilayahKotaRepository kotaRepository;
    
    @Autowired
    private WilayahKecamatanRepository kecamatanRepository;
    
    @Autowired
    private WilayahKelurahanRepository kelurahanRepository;
    
    @Autowired
    private WilayahService wilayahService;
    
    /**
     * Get or fetch provinsi by code
     */
    @Transactional
    public WilayahProvinsi getOrFetchProvinsi(String kode) {
        Optional<WilayahProvinsi> cached = provinsiRepository.findByKode(kode);
        
        if (cached.isPresent()) {
            log.debug("Found provinsi in cache: {} - {}", kode, cached.get().getNama());
            return cached.get();
        }
        
        // Fetch from API and cache
        log.info("Provinsi {} not in cache, fetching from wilayah.id API", kode);
        return fetchAndCacheProvinsi(kode);
    }
    
    /**
     * Get or fetch kota by code
     */
    @Transactional
    public WilayahKota getOrFetchKota(String kode) {
        Optional<WilayahKota> cached = kotaRepository.findByKode(kode);
        
        if (cached.isPresent()) {
            log.debug("Found kota in cache: {} - {}", kode, cached.get().getNama());
            return cached.get();
        }
        
        // Fetch from API and cache
        log.info("Kota {} not in cache, fetching from wilayah.id API", kode);
        return fetchAndCacheKota(kode);
    }
    
    /**
     * Get or fetch kecamatan by code
     */
    @Transactional
    public WilayahKecamatan getOrFetchKecamatan(String kode) {
        Optional<WilayahKecamatan> cached = kecamatanRepository.findByKode(kode);
        
        if (cached.isPresent()) {
            log.debug("Found kecamatan in cache: {} - {}", kode, cached.get().getNama());
            return cached.get();
        }
        
        // Fetch from API and cache
        log.info("Kecamatan {} not in cache, fetching from wilayah.id API", kode);
        return fetchAndCacheKecamatan(kode);
    }
    
    /**
     * Get or fetch kelurahan by code
     */
    @Transactional
    public WilayahKelurahan getOrFetchKelurahan(String kode) {
        Optional<WilayahKelurahan> cached = kelurahanRepository.findByKode(kode);
        
        if (cached.isPresent()) {
            log.debug("Found kelurahan in cache: {} - {}", kode, cached.get().getNama());
            return cached.get();
        }
        
        // Fetch from API and cache
        log.info("Kelurahan {} not in cache, fetching from wilayah.id API", kode);
        return fetchAndCacheKelurahan(kode);
    }
      /**
     * Fetch provinsi from API and cache it
     */
    @SuppressWarnings("unchecked")
    private WilayahProvinsi fetchAndCacheProvinsi(String kode) {
        try {
            // Get all provinsi and find the one with matching code
            Map<String, Object> response = wilayahService.getProvinces();
            
            if (response.containsKey("error") && (Boolean) response.get("error")) {
                throw new RuntimeException("Error from wilayah.id API: " + response.get("message"));
            }
              java.util.List<Map<String, Object>> provinsiList = 
                (java.util.List<Map<String, Object>>) response.get("data");
            
            Optional<Map<String, Object>> provinsiOpt = provinsiList.stream()
                .filter(p -> kode.equals(p.get("code")))
                .findFirst();
                
            if (provinsiOpt.isPresent()) {
                var provinsi = provinsiOpt.get();
                WilayahProvinsi entity = new WilayahProvinsi();
                entity.setKode((String) provinsi.get("code"));
                entity.setNama((String) provinsi.get("name"));
                
                WilayahProvinsi saved = provinsiRepository.save(entity);
                log.info("Cached new provinsi: {} - {}", saved.getKode(), saved.getNama());
                return saved;
            } else {
                throw new RuntimeException("Provinsi dengan kode " + kode + " tidak ditemukan di wilayah.id");
            }
        } catch (Exception e) {
            log.error("Error fetching provinsi {}: {}", kode, e.getMessage());
            throw new RuntimeException("Gagal mengambil data provinsi: " + e.getMessage());
        }
    }
    
    /**
     * Fetch kota from API and cache it
     */
    @SuppressWarnings("unchecked")
    private WilayahKota fetchAndCacheKota(String kode) {
        try {
            // Extract provinsi code from kota code (e.g., "33.02" -> "33")
            String provinsiKode = kode.split("\\.")[0];
            
            // Get regencies for this province
            Map<String, Object> response = wilayahService.getRegencies(provinsiKode);
            
            if (response.containsKey("error") && (Boolean) response.get("error")) {
                throw new RuntimeException("Error from wilayah.id API: " + response.get("message"));
            }
              java.util.List<Map<String, Object>> kotaList = 
                (java.util.List<Map<String, Object>>) response.get("data");
            
            Optional<Map<String, Object>> kotaOpt = kotaList.stream()
                .filter(k -> kode.equals(k.get("code")))
                .findFirst();
                
            if (kotaOpt.isPresent()) {
                var kota = kotaOpt.get();
                WilayahKota entity = new WilayahKota();
                entity.setKode((String) kota.get("code"));
                entity.setNama((String) kota.get("name"));
                entity.setProvinsiKode(provinsiKode);
                
                WilayahKota saved = kotaRepository.save(entity);
                log.info("Cached new kota: {} - {}", saved.getKode(), saved.getNama());
                return saved;
            } else {
                throw new RuntimeException("Kota dengan kode " + kode + " tidak ditemukan di wilayah.id");
            }
        } catch (Exception e) {
            log.error("Error fetching kota {}: {}", kode, e.getMessage());
            throw new RuntimeException("Gagal mengambil data kota: " + e.getMessage());
        }
    }
    
    /**
     * Fetch kecamatan from API and cache it
     */
    @SuppressWarnings("unchecked")
    private WilayahKecamatan fetchAndCacheKecamatan(String kode) {
        try {
            // Extract kota code from kecamatan code (e.g., "33.02.27" -> "33.02")
            String[] parts = kode.split("\\.");
            String kotaKode = parts[0] + "." + parts[1];
            
            // Get districts for this regency
            Map<String, Object> response = wilayahService.getDistricts(kotaKode);
            
            if (response.containsKey("error") && (Boolean) response.get("error")) {
                throw new RuntimeException("Error from wilayah.id API: " + response.get("message"));
            }
              java.util.List<Map<String, Object>> kecamatanList = 
                (java.util.List<Map<String, Object>>) response.get("data");
            
            Optional<Map<String, Object>> kecamatanOpt = kecamatanList.stream()
                .filter(k -> kode.equals(k.get("code")))
                .findFirst();
                
            if (kecamatanOpt.isPresent()) {
                var kecamatan = kecamatanOpt.get();
                WilayahKecamatan entity = new WilayahKecamatan();
                entity.setKode((String) kecamatan.get("code"));
                entity.setNama((String) kecamatan.get("name"));
                entity.setKotaKode(kotaKode);
                
                WilayahKecamatan saved = kecamatanRepository.save(entity);
                log.info("Cached new kecamatan: {} - {}", saved.getKode(), saved.getNama());
                return saved;
            } else {
                throw new RuntimeException("Kecamatan dengan kode " + kode + " tidak ditemukan di wilayah.id");
            }
        } catch (Exception e) {
            log.error("Error fetching kecamatan {}: {}", kode, e.getMessage());
            throw new RuntimeException("Gagal mengambil data kecamatan: " + e.getMessage());
        }
    }
    
    /**
     * Fetch kelurahan from API and cache it
     */
    @SuppressWarnings("unchecked")
    private WilayahKelurahan fetchAndCacheKelurahan(String kode) {
        try {
            // Extract kecamatan code from kelurahan code (e.g., "33.02.27.1003" -> "33.02.27")
            String[] parts = kode.split("\\.");
            String kecamatanKode = parts[0] + "." + parts[1] + "." + parts[2];
            
            // Get villages for this district
            Map<String, Object> response = wilayahService.getVillages(kecamatanKode);
            
            if (response.containsKey("error") && (Boolean) response.get("error")) {
                throw new RuntimeException("Error from wilayah.id API: " + response.get("message"));
            }
              java.util.List<Map<String, Object>> kelurahanList = 
                (java.util.List<Map<String, Object>>) response.get("data");
            
            Optional<Map<String, Object>> kelurahanOpt = kelurahanList.stream()
                .filter(k -> kode.equals(k.get("code")))
                .findFirst();
                
            if (kelurahanOpt.isPresent()) {
                var kelurahan = kelurahanOpt.get();
                WilayahKelurahan entity = new WilayahKelurahan();
                entity.setKode((String) kelurahan.get("code"));
                entity.setNama((String) kelurahan.get("name"));
                entity.setKecamatanKode(kecamatanKode);
                entity.setKodePos((String) kelurahan.get("postal_code"));
                
                WilayahKelurahan saved = kelurahanRepository.save(entity);
                log.info("Cached new kelurahan: {} - {}", saved.getKode(), saved.getNama());
                return saved;
            } else {
                throw new RuntimeException("Kelurahan dengan kode " + kode + " tidak ditemukan di wilayah.id");
            }
        } catch (Exception e) {
            log.error("Error fetching kelurahan {}: {}", kode, e.getMessage());
            throw new RuntimeException("Gagal mengambil data kelurahan: " + e.getMessage());
        }
    }
    
    /**
     * Get nama by kode for display purposes
     */
    public String getNamaByKode(String kode) {
        if (kode == null || kode.isEmpty()) {
            return "";
        }
        
        try {
            // Determine type by code pattern
            String[] parts = kode.split("\\.");
            
            switch (parts.length) {
                case 1: // Provinsi
                    return getOrFetchProvinsi(kode).getNama();
                case 2: // Kota
                    return getOrFetchKota(kode).getNama();
                case 3: // Kecamatan
                    return getOrFetchKecamatan(kode).getNama();
                case 4: // Kelurahan
                    return getOrFetchKelurahan(kode).getNama();
                default:
                    return kode; // Return code if pattern doesn't match
            }
        } catch (Exception e) {
            log.warn("Could not resolve name for kode {}: {}", kode, e.getMessage());
            return kode; // Return code if lookup fails
        }
    }
    
    /**
     * Cache all data for a complete address
     */
    @Transactional
    public void cacheCompleteAddress(String provinsiKode, String kotaKode, String kecamatanKode, String kelurahanKode) {
        if (provinsiKode != null && !provinsiKode.isEmpty()) {
            getOrFetchProvinsi(provinsiKode);
        }
        if (kotaKode != null && !kotaKode.isEmpty()) {
            getOrFetchKota(kotaKode);
        }
        if (kecamatanKode != null && !kecamatanKode.isEmpty()) {
            getOrFetchKecamatan(kecamatanKode);
        }
        if (kelurahanKode != null && !kelurahanKode.isEmpty()) {
            getOrFetchKelurahan(kelurahanKode);
        }
    }
}
