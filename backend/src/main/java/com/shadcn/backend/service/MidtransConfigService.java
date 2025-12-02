package com.shadcn.backend.service;

import com.shadcn.backend.entity.MidtransConfig;
import com.shadcn.backend.repository.MidtransConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class MidtransConfigService {
    
    private static final Logger logger = LoggerFactory.getLogger(MidtransConfigService.class);
    
    @Autowired
    private MidtransConfigRepository midtransConfigRepository;
    
    // Fallback values from application.properties
    @Value("${midtrans.merchant.id:}")
    private String fallbackMerchantId;
    
    @Value("${midtrans.client.key:}")
    private String fallbackClientKey;
    
    @Value("${midtrans.server.key:}")
    private String fallbackServerKey;
    
    @Value("${midtrans.is.production:false}")
    private Boolean fallbackIsProduction;
    
    @Value("${midtrans.snap.url:}")
    private String fallbackSnapUrl;
    
    @Value("${midtrans.api.url:}")
    private String fallbackApiUrl;
    
    /**
     * Get active Midtrans configuration
     * Falls back to application.properties if no database config found
     */
    public MidtransConfig getActiveConfig() {
        Optional<MidtransConfig> configOpt = midtransConfigRepository.findActiveConfig();
        
        if (configOpt.isPresent()) {
            logger.debug("Using Midtrans config from database");
            return configOpt.get();
        }
        
        // Fallback to application.properties
        logger.debug("Using fallback Midtrans config from application.properties");
        MidtransConfig fallbackConfig = new MidtransConfig();
        fallbackConfig.setMerchantId(fallbackMerchantId);
        fallbackConfig.setClientKey(fallbackClientKey);
        fallbackConfig.setServerKey(fallbackServerKey);
        fallbackConfig.setIsProduction(fallbackIsProduction);
        fallbackConfig.setSnapUrl(fallbackSnapUrl);
        fallbackConfig.setApiUrl(fallbackApiUrl);
        fallbackConfig.setIsActive(true);
        
        return fallbackConfig;
    }
    
    /**
     * Get active configuration by environment
     */
    public MidtransConfig getActiveConfigByEnvironment(Boolean isProduction) {
        Optional<MidtransConfig> configOpt = midtransConfigRepository.findActiveConfigByEnvironment(isProduction);
        
        if (configOpt.isPresent()) {
            return configOpt.get();
        }
        
        // Fallback to general active config
        return getActiveConfig();
    }
    
    /**
     * Save or update Midtrans configuration
     */
    @Transactional
    public MidtransConfig saveConfig(MidtransConfig config) {
        // Deactivate all existing configs
        List<MidtransConfig> existingConfigs = midtransConfigRepository.findAll();
        for (MidtransConfig existingConfig : existingConfigs) {
            existingConfig.setIsActive(false);
            midtransConfigRepository.save(existingConfig);
        }
        
        // Save new config as active
        config.setIsActive(true);
        MidtransConfig savedConfig = midtransConfigRepository.save(config);
        
        logger.info("Saved new Midtrans configuration with ID: {}", savedConfig.getId());
        return savedConfig;
    }
    
    /**
     * Get all configurations
     */
    public List<MidtransConfig> getAllConfigs() {
        return midtransConfigRepository.findAll();
    }
    
    /**
     * Delete configuration
     */
    @Transactional
    public void deleteConfig(Long id) {
        midtransConfigRepository.deleteById(id);
        logger.info("Deleted Midtrans configuration with ID: {}", id);
    }
    
    /**
     * Activate specific configuration
     */
    @Transactional
    public void activateConfig(Long id) {
        // Deactivate all configs
        List<MidtransConfig> allConfigs = midtransConfigRepository.findAll();
        for (MidtransConfig config : allConfigs) {
            config.setIsActive(false);
            midtransConfigRepository.save(config);
        }
        
        // Activate specified config
        Optional<MidtransConfig> configOpt = midtransConfigRepository.findById(id);
        if (configOpt.isPresent()) {
            MidtransConfig config = configOpt.get();
            config.setIsActive(true);
            midtransConfigRepository.save(config);
            logger.info("Activated Midtrans configuration with ID: {}", id);
        }
    }
}