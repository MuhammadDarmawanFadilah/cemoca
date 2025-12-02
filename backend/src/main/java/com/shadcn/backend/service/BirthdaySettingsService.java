package com.shadcn.backend.service;

import com.shadcn.backend.entity.BirthdaySettings;
import com.shadcn.backend.repository.BirthdaySettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.util.Optional;

@Slf4j
@Service
public class BirthdaySettingsService {
    
    @Autowired
    private BirthdaySettingsRepository birthdaySettingsRepository;
    
    // Default values from properties
    @Value("${birthday.notification.enabled:true}")
    private Boolean defaultEnabled;
    
    @Value("${birthday.notification.time:0 0 8 * * *}")
    private String defaultNotificationTime;
    
    @Value("${birthday.notification.timezone:Asia/Jakarta}")
    private String defaultTimezone;
    
    @Value("${birthday.notification.message:Selamat ulang tahun! Semoga panjang umur, sehat selalu, dan sukses dalam karir. Salam hangat dari Alumni Association.}")
    private String defaultMessage;
    
    @Value("${birthday.notification.days-ahead:0}")
    private Integer defaultDaysAhead;
    
    @Value("${birthday.notification.include-age:true}")
    private Boolean defaultIncludeAge;
      /**
     * Get current birthday settings, fallback to defaults from properties
     */
    public BirthdaySettings getCurrentSettings() {
        Optional<BirthdaySettings> dbSettings = birthdaySettingsRepository.findLatestSettings();
        if (dbSettings.isPresent()) {
            log.debug("Retrieved settings from database: includeAge={}", dbSettings.get().getIncludeAge());
            return dbSettings.get();
        } else {
            BirthdaySettings defaultSettings = createDefaultSettings();
            log.debug("No settings found in database, using defaults: includeAge={}", defaultSettings.getIncludeAge());
            return defaultSettings;
        }
    }
    
    /**
     * Get active birthday settings (enabled only)
     */
    public BirthdaySettings getActiveSettings() {
        return birthdaySettingsRepository.findActiveSettings()
                .orElseGet(() -> {
                    BirthdaySettings defaultSettings = createDefaultSettings();
                    if (defaultSettings.getEnabled()) {
                        return defaultSettings;
                    }
                    return null;
                });
    }
    
    /**
     * Create default settings from properties
     */
    private BirthdaySettings createDefaultSettings() {
        BirthdaySettings settings = new BirthdaySettings();
        settings.setEnabled(defaultEnabled);
        settings.setNotificationTime(defaultNotificationTime);
        settings.setTimezone(defaultTimezone);
        settings.setMessage(defaultMessage);
        settings.setDaysAhead(defaultDaysAhead);
        settings.setIncludeAge(defaultIncludeAge);
        return settings;
    }
      /**
     * Update birthday settings
     */
    @Transactional
    public BirthdaySettings updateSettings(BirthdaySettings settings, String updatedBy) {
        log.info("Updating birthday settings: includeAge={}, enabled={}, message={}", 
            settings.getIncludeAge(), settings.getEnabled(), settings.getMessage());
        
        settings.setUpdatedBy(updatedBy);
        BirthdaySettings savedSettings = birthdaySettingsRepository.save(settings);
        
        log.info("Birthday settings saved successfully with ID: {}", savedSettings.getId());
        return savedSettings;
    }
    
    /**
     * Reset to default settings
     */
    @Transactional
    public BirthdaySettings resetToDefaults(String updatedBy) {
        BirthdaySettings defaultSettings = createDefaultSettings();
        defaultSettings.setUpdatedBy(updatedBy);
        return birthdaySettingsRepository.save(defaultSettings);
    }
}
