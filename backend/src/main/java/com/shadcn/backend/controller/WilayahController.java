package com.shadcn.backend.controller;

import com.shadcn.backend.service.WilayahCacheService;
import com.shadcn.backend.service.WilayahService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/wilayah")
public class WilayahController {
    
    @Autowired
    private WilayahService wilayahService;

    @Autowired
    private WilayahCacheService wilayahCacheService;
    
    /**
     * Get all provinces
     * Proxy for https://wilayah.id/api/provinces.json
     */
    @GetMapping("/provinces")
    public ResponseEntity<Map<String, Object>> getProvinces() {
        Map<String, Object> response = wilayahService.getProvinces();
        
        if (response.containsKey("error")) {
            return ResponseEntity.status(500).body(response);
        }
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get regencies by province code
     * Proxy for https://wilayah.id/api/regencies/{provinceCode}.json
     */
    @GetMapping("/regencies/{provinceCode}")
    public ResponseEntity<Map<String, Object>> getRegencies(@PathVariable String provinceCode) {
        Map<String, Object> response = wilayahService.getRegencies(provinceCode);
        
        if (response.containsKey("error")) {
            return ResponseEntity.status(500).body(response);
        }
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get districts by regency code
     * Proxy for https://wilayah.id/api/districts/{regencyCode}.json
     */
    @GetMapping("/districts/{regencyCode}")
    public ResponseEntity<Map<String, Object>> getDistricts(@PathVariable String regencyCode) {
        Map<String, Object> response = wilayahService.getDistricts(regencyCode);
        
        if (response.containsKey("error")) {
            return ResponseEntity.status(500).body(response);
        }
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get villages by district code (includes postal codes)
     * Proxy for https://wilayah.id/api/villages/{districtCode}.json
     */
    @GetMapping("/villages/{districtCode}")
    public ResponseEntity<Map<String, Object>> getVillages(@PathVariable String districtCode) {
        Map<String, Object> response = wilayahService.getVillages(districtCode);
        
        if (response.containsKey("error")) {
            return ResponseEntity.status(500).body(response);
        }
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get wilayah name by code (from cache or API)
     */
    @GetMapping("/name/{kode}")
    public ResponseEntity<Map<String, String>> getWilayahName(@PathVariable String kode) {
        try {
            String nama = wilayahCacheService.getNamaByKode(kode);
            Map<String, String> response = Map.of(
                "kode", kode,
                "nama", nama
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = Map.of(
                "error", "Failed to get wilayah name: " + e.getMessage(),
                "kode", kode,
                "nama", kode // Fallback to code if lookup fails
            );
            return ResponseEntity.status(500).body(error);
        }
    }    /**
     * Batch get wilayah names by codes
     * Expected format: {"kode1": "type1", "kode2": "type2"}
     * Returns: {"kode1": "nama1", "kode2": "nama2"}
     */
    @PostMapping("/names")
    public ResponseEntity<Map<String, String>> getWilayahNames(@RequestBody Map<String, String> kodeMap) {
        Map<String, String> response = new java.util.HashMap<>();
        
        for (Map.Entry<String, String> entry : kodeMap.entrySet()) {
            String kode = entry.getKey();
            // entry.getValue() contains type information (currently not used)
            
            if (kode != null && !kode.isEmpty()) {
                try {
                    String nama = wilayahCacheService.getNamaByKode(kode);
                    response.put(kode, nama);
                } catch (Exception e) {
                    response.put(kode, kode); // Fallback to code
                }
            }
        }
        
        return ResponseEntity.ok(response);
    }
}
