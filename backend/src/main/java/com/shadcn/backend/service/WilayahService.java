package com.shadcn.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

@Service
public class WilayahService {
    
    private static final Logger logger = LoggerFactory.getLogger(WilayahService.class);
    
    @Value("${app.wilayah.api.base-url}")
    private String wilayahApiBaseUrl;
    
    @Value("${app.wilayah.api.timeout:30000}")
    private int apiTimeout;
    
    @Value("${app.wilayah.api.enabled:true}")
    private boolean apiEnabled;
    
    private final RestTemplate restTemplate;
    
    public WilayahService() {
        this.restTemplate = new RestTemplate();
    }
      @Cacheable(value = "provinces", unless = "#result == null")
    public Map<String, Object> getProvinces() {
        if (!apiEnabled) {
            return createErrorResponse("Wilayah API is disabled");
        }
        
        try {
            logger.info("Fetching provinces from wilayah.id API");
            String url = wilayahApiBaseUrl + "/provinces.json";
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            logger.info("Successfully fetched {} provinces", 
                response != null && response.containsKey("data") ? 
                ((java.util.List<?>) response.get("data")).size() : 0);
            return response;
        } catch (RestClientException e) {
            logger.error("Error fetching provinces from wilayah.id: {}", e.getMessage());
            return createErrorResponse("Failed to fetch provinces: " + e.getMessage());
        }
    }
      @Cacheable(value = "regencies", key = "#provinceCode", unless = "#result == null")
    public Map<String, Object> getRegencies(String provinceCode) {
        if (!apiEnabled) {
            return createErrorResponse("Wilayah API is disabled");
        }
        
        try {
            logger.info("Fetching regencies for province: {}", provinceCode);
            String url = wilayahApiBaseUrl + "/regencies/" + provinceCode + ".json";
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            logger.info("Successfully fetched {} regencies for province {}", 
                response != null && response.containsKey("data") ? 
                ((java.util.List<?>) response.get("data")).size() : 0, provinceCode);
            return response;
        } catch (RestClientException e) {
            logger.error("Error fetching regencies for province {}: {}", provinceCode, e.getMessage());
            return createErrorResponse("Failed to fetch regencies: " + e.getMessage());
        }
    }
      @Cacheable(value = "districts", key = "#regencyCode", unless = "#result == null")
    public Map<String, Object> getDistricts(String regencyCode) {
        if (!apiEnabled) {
            return createErrorResponse("Wilayah API is disabled");
        }
        
        try {
            logger.info("Fetching districts for regency: {}", regencyCode);
            String url = wilayahApiBaseUrl + "/districts/" + regencyCode + ".json";
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            logger.info("Successfully fetched {} districts for regency {}", 
                response != null && response.containsKey("data") ? 
                ((java.util.List<?>) response.get("data")).size() : 0, regencyCode);
            return response;
        } catch (RestClientException e) {
            logger.error("Error fetching districts for regency {}: {}", regencyCode, e.getMessage());
            return createErrorResponse("Failed to fetch districts: " + e.getMessage());
        }
    }
      @Cacheable(value = "villages", key = "#districtCode", unless = "#result == null")
    public Map<String, Object> getVillages(String districtCode) {
        if (!apiEnabled) {
            return createErrorResponse("Wilayah API is disabled");
        }
        
        try {
            logger.info("Fetching villages for district: {}", districtCode);
            String url = wilayahApiBaseUrl + "/villages/" + districtCode + ".json";
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            logger.info("Successfully fetched {} villages for district {}", 
                response != null && response.containsKey("data") ? 
                ((java.util.List<?>) response.get("data")).size() : 0, districtCode);
            return response;
        } catch (RestClientException e) {
            logger.error("Error fetching villages for district {}: {}", districtCode, e.getMessage());
            return createErrorResponse("Failed to fetch villages: " + e.getMessage());
        }
    }
    
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", true);
        errorResponse.put("message", message);
        errorResponse.put("data", new java.util.ArrayList<>());
        return errorResponse;
    }
}
