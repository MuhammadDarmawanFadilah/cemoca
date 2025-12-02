package com.shadcn.backend.service;

import com.shadcn.backend.dto.*;
import com.shadcn.backend.model.Biografi;
import com.shadcn.backend.model.BirthdayNotification;
import com.shadcn.backend.model.BirthdayNotification.NotificationStatus;
import com.shadcn.backend.repository.BiografiRepository;
import com.shadcn.backend.repository.BirthdayNotificationRepository;
import com.shadcn.backend.service.BirthdaySettingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class BirthdayNotificationService {
      private final BirthdayNotificationRepository birthdayNotificationRepository;
    private final BiografiRepository biografiRepository;
    private final WhatsAppService whatsAppService;
    private final BirthdaySettingsService birthdaySettingsService;
    
    @Value("${birthday.notification.enabled:true}")
    private Boolean birthdayNotificationEnabled;
    
    @Value("${birthday.notification.message:Selamat ulang tahun! Semoga panjang umur, sehat selalu, dan sukses dalam karir. Salam hangat dari Alumni Association.}")
    private String defaultBirthdayMessage;
    
    @Value("${birthday.notification.days-ahead:0}")
    private Integer daysAhead;
      /**
     * Parse date string in dd/MM format and return array [day, month]
     * Used for filtering by birth date ignoring year
     */
    private int[] parseDayMonthFormat(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        
        try {
            String[] parts = dateStr.trim().split("/");
            if (parts.length != 2) {
                log.warn("Invalid date format: {}. Expected dd/MM format", dateStr);
                return null;
            }
            
            int day = Integer.parseInt(parts[0]);
            int month = Integer.parseInt(parts[1]);
            
            // Validate day and month ranges
            if (day < 1 || day > 31 || month < 1 || month > 12) {
                log.warn("Invalid day/month values in date: {}. Day: {}, Month: {}", dateStr, day, month);
                return null;
            }
            
            return new int[]{day, month};
        } catch (Exception e) {
            log.warn("Failed to parse date format {}: {}", dateStr, e.getMessage());
            return null;
        }
    }
      @Transactional
    public void generateBirthdayNotificationsForYear(Integer year) {
        log.info("Generating birthday notifications for year {}", year);
        
        // First, delete existing notifications for this year to ensure clean regeneration
        birthdayNotificationRepository.deleteByYear(year);
        log.info("Deleted existing notifications for year {}", year);
        
        List<Biografi> biografiWithBirthdays = biografiRepository.findAllWithBirthdays();
        log.info("Found {} biografi records with birthdays", biografiWithBirthdays.size());
        
        for (Biografi biografi : biografiWithBirthdays) {
            if (biografi.getTanggalLahir() != null) {
                LocalDate birthdayDate = LocalDate.of(year, 
                    biografi.getTanggalLahir().getMonth(), 
                    biografi.getTanggalLahir().getDayOfMonth());
                
                LocalDate notificationDate = birthdayDate.minusDays(daysAhead);
                
                log.debug("Creating notification for {} - Birthday: {}, Notification: {}", 
                    biografi.getNamaLengkap(), birthdayDate, notificationDate);
                
                BirthdayNotification notification = new BirthdayNotification();
                notification.setBiografi(biografi);
                notification.setBirthdayDate(birthdayDate);
                notification.setNotificationDate(notificationDate);
                notification.setYear(year);
                notification.setStatus(NotificationStatus.PENDING);
                notification.setMessage(defaultBirthdayMessage);
                notification.setIsExcluded(false);
                
                birthdayNotificationRepository.save(notification);
            }
        }
        
        log.info("Completed generating birthday notifications for year {}", year);
    }
      @Transactional
    public void sendTodayBirthdayNotifications() {
        if (!birthdayNotificationEnabled) {
            log.info("Birthday notifications are disabled");
            return;
        }        // Get current settings to check includeAge preference
        var settings = birthdaySettingsService.getCurrentSettings();
        Boolean includeAge = settings != null ? settings.getIncludeAge() : true;
        
        log.info("Sending birthday notifications with includeAge setting: {}", includeAge);
        
        LocalDate today = LocalDate.now();
        List<BirthdayNotification> todayNotifications = birthdayNotificationRepository
            .findTodayPendingNotifications(today);
        
        log.info("Found {} birthday notifications to send today", todayNotifications.size());
        
        for (BirthdayNotification notification : todayNotifications) {
            try {
                sendBirthdayNotification(notification, includeAge);
            } catch (Exception e) {
                log.error("Failed to send birthday notification for biografi ID: {}", 
                    notification.getBiografi().getBiografiId(), e);
                notification.setStatus(NotificationStatus.FAILED);
                notification.setErrorMessage(e.getMessage());
                birthdayNotificationRepository.save(notification);
            }
        }
    }
      @Transactional
    public void sendBirthdayNotification(BirthdayNotification notification) {
        sendBirthdayNotification(notification, null);
    }
    
    @Transactional
    public void sendBirthdayNotification(BirthdayNotification notification, Boolean includeAge) {
        Biografi biografi = notification.getBiografi();
        
        if (biografi.getNomorTelepon() == null || biografi.getNomorTelepon().trim().isEmpty()) {
            throw new RuntimeException("Nomor telepon tidak tersedia");
        }
        
        String message = notification.getMessage();
        if (message == null || message.trim().isEmpty()) {
            message = defaultBirthdayMessage;
        }
        
        // Create personalized message with optional age
        String personalizedMessage = createPersonalizedMessage(biografi, message, includeAge);
        
        // Send WhatsApp message
        whatsAppService.sendMessage(biografi.getNomorTelepon(), personalizedMessage);
        
        // Update notification status
        notification.setStatus(NotificationStatus.SENT);
        notification.setSentAt(LocalDateTime.now());
        notification.setErrorMessage(null);
        birthdayNotificationRepository.save(notification);
        
        log.info("Birthday notification sent to {} ({})", 
            biografi.getNamaLengkap(), biografi.getNomorTelepon());
    }    private String createPersonalizedMessage(Biografi biografi, String message, Boolean includeAge) {
        log.debug("Creating personalized message for {} with includeAge: {}, message: {}", 
            biografi.getNamaLengkap(), includeAge, message);
        
        // Clean the message - remove any existing greeting parts to avoid duplication
        String cleanMessage = message;
        if (message != null) {
            // Remove common greeting patterns that might cause duplication
            cleanMessage = message.replaceAll("^Halo [^,]+,\\s*", "")
                                 .replaceAll("^Selamat ulang tahun yang ke-\\d+! 🎉\\s*", "")
                                 .replaceAll("^Selamat ulang tahun!\\s*", "")
                                 .trim();
        }
        
        String finalMessage;
        
        if (includeAge != null && includeAge && biografi.getTanggalLahir() != null) {
            // Calculate age properly considering the full date
            LocalDate birthDate = biografi.getTanggalLahir();
            LocalDate today = LocalDate.now();
            
            int age = today.getYear() - birthDate.getYear();
            // Adjust age if birthday hasn't occurred this year yet
            if (today.getDayOfYear() < birthDate.withYear(today.getYear()).getDayOfYear()) {
                age--;
            }
            
            log.debug("Including age {} in birthday message for {}", age, biografi.getNamaLengkap());
            finalMessage = String.format("Halo %s,\n\nSelamat ulang tahun yang ke-%d! 🎉\n\n%s", 
                biografi.getNamaLengkap(), age, cleanMessage);
        } else {
            log.debug("Not including age in birthday message for {} (includeAge: {}, birthDate: {})", 
                biografi.getNamaLengkap(), includeAge, biografi.getTanggalLahir());
            finalMessage = String.format("Halo %s,\n\nSelamat ulang tahun!\n\n%s", 
                biografi.getNamaLengkap(), cleanMessage);
        }
        
        log.debug("Final personalized message: {}", finalMessage);
        return finalMessage;
    }
    
    @Transactional    public void resendBirthdayNotification(Long notificationId) {
        BirthdayNotification notification = birthdayNotificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        // Get current birthday settings to check if age should be included
        Boolean includeAge = birthdaySettingsService.getCurrentSettings().getIncludeAge();
        
        sendBirthdayNotification(notification, includeAge);
        notification.setStatus(NotificationStatus.RESENT);        birthdayNotificationRepository.save(notification);
    }

    @Transactional
    public void excludeBiografiBirthdayNotification(Long biografiId, Boolean exclude) {
        // Find existing notification for this biografi for current year
        int currentYear = LocalDate.now().getYear();
        
        // Try to find existing notification by biografi
        Biografi biografi = biografiRepository.findById(biografiId)
            .orElseThrow(() -> new RuntimeException("Biografi not found"));
        
        // Find notification for this biografi in current year
        List<BirthdayNotification> notifications = birthdayNotificationRepository
            .findByBiografiAndYear(biografi, currentYear);
          if (!notifications.isEmpty()) {
            // Update existing notification
            BirthdayNotification notification = notifications.get(0);
            notification.setIsExcluded(exclude);
            if (exclude) {
                notification.setStatus(NotificationStatus.EXCLUDED);
            } else {
                // When un-excluding, restore the appropriate status based on current state
                LocalDate today = LocalDate.now();
                LocalDate birthdayDate = notification.getBirthdayDate();
                
                if (birthdayDate.isBefore(today)) {
                    // Birthday has passed, set to SENT if not failed
                    if (notification.getSentAt() != null) {
                        notification.setStatus(NotificationStatus.SENT);
                    } else {
                        notification.setStatus(NotificationStatus.PENDING);
                    }
                } else {
                    // Birthday hasn't happened yet, set to PENDING so it can be sent
                    notification.setStatus(NotificationStatus.PENDING);
                }
            }
            birthdayNotificationRepository.save(notification);
            log.info("Updated exclusion status for existing notification of biografi {} to {}", biografiId, exclude);
        } else if (exclude) {
            // Create new notification record with EXCLUDED status if excluding
            LocalDate birthday = biografi.getTanggalLahir();
            LocalDate notificationDate = LocalDate.of(currentYear, birthday.getMonth(), birthday.getDayOfMonth());
            
            BirthdayNotification notification = new BirthdayNotification();
            notification.setBiografi(biografi);
            notification.setNotificationDate(notificationDate);
            notification.setBirthdayDate(birthday.withYear(currentYear));
            notification.setYear(currentYear);
            notification.setStatus(NotificationStatus.EXCLUDED);
            notification.setIsExcluded(true);
            
            birthdayNotificationRepository.save(notification);
            log.info("Created new EXCLUDED notification for biografi {}", biografiId);
        }
        // If not excluding and no notification exists, do nothing (no need to create a record)
    }    @Transactional
    public void excludeBirthdayNotification(Long notificationId, Boolean exclude) {
        BirthdayNotification notification = birthdayNotificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        notification.setIsExcluded(exclude);
        if (exclude) {
            notification.setStatus(NotificationStatus.EXCLUDED);
        } else {
            // When un-excluding, restore the appropriate status based on current state
            LocalDate today = LocalDate.now();
            LocalDate birthdayDate = notification.getBirthdayDate();
            
            if (birthdayDate.isBefore(today)) {
                // Birthday has passed, set to SENT if not failed
                if (notification.getSentAt() != null) {
                    notification.setStatus(NotificationStatus.SENT);
                } else {
                    notification.setStatus(NotificationStatus.PENDING);
                }
            } else {
                // Birthday hasn't happened yet, set to PENDING so it can be sent
                notification.setStatus(NotificationStatus.PENDING);
            }
        }
        birthdayNotificationRepository.save(notification);
    }@Transactional
    public void resetBiografiNotificationToPending(Long biografiId) {
        // Find existing notification for this biografi for current year
        int currentYear = LocalDate.now().getYear();
        
        // Try to find existing notification by biografi
        Biografi biografi = biografiRepository.findById(biografiId)
            .orElseThrow(() -> new RuntimeException("Biografi not found"));
        
        // Find notification for this biografi in current year
        List<BirthdayNotification> notifications = birthdayNotificationRepository
            .findByBiografiAndYear(biografi, currentYear);
          if (!notifications.isEmpty()) {
            // Reset existing notification AND fix the dates if they're wrong
            BirthdayNotification notification = notifications.get(0);
            
            // Fix notification dates based on correct biografi birth date
            LocalDate birthday = biografi.getTanggalLahir();
            LocalDate correctNotificationDate = LocalDate.of(currentYear, birthday.getMonth(), birthday.getDayOfMonth());
            LocalDate correctBirthdayDate = birthday.withYear(currentYear);
            
            notification.setStatus(NotificationStatus.PENDING);
            notification.setSentAt(null);
            notification.setErrorMessage(null);
            notification.setNotificationDate(correctNotificationDate);
            notification.setBirthdayDate(correctBirthdayDate);
            notification.setIsExcluded(false); // Reset exclusion status as well
            
            birthdayNotificationRepository.save(notification);
            log.info("Reset existing notification for biografi {} to PENDING status and fixed dates to {}", biografiId, correctNotificationDate);
        } else {
            // Create new notification record for this biografi
            LocalDate birthday = biografi.getTanggalLahir();
            LocalDate notificationDate = LocalDate.of(currentYear, birthday.getMonth(), birthday.getDayOfMonth());
            
            BirthdayNotification notification = new BirthdayNotification();
            notification.setBiografi(biografi);
            notification.setNotificationDate(notificationDate);
            notification.setBirthdayDate(birthday.withYear(currentYear));
            notification.setYear(currentYear);
            notification.setStatus(NotificationStatus.PENDING);
            notification.setIsExcluded(false);
            
            birthdayNotificationRepository.save(notification);
            log.info("Created new PENDING notification for biografi {}", biografiId);
        }
    }    public Page<BirthdayNotificationDTO> getBirthdayNotifications(BirthdayNotificationFilter filter) {
        // For JPQL queries, use Java property names directly, not database column names
        String sortField = convertSortFieldToJpqlProperty(filter.getSortBy());
        Sort sort = Sort.by(Sort.Direction.fromString(filter.getSortDirection()), sortField);
        Pageable pageable = PageRequest.of(filter.getPage(), filter.getSize(), sort);
        
        // Convert string status to enum
        NotificationStatus status = null;
        if (filter.getStatus() != null && !filter.getStatus().isEmpty()) {
            try {
                status = NotificationStatus.valueOf(filter.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status value: {}", filter.getStatus());
            }
        }
        
        // Convert string dates to LocalDate
        LocalDate startDate = null;
        LocalDate endDate = null;
        if (filter.getStartDate() != null && !filter.getStartDate().isEmpty()) {
            try {
                startDate = LocalDate.parse(filter.getStartDate());
            } catch (Exception e) {
                log.warn("Invalid start date format: {}", filter.getStartDate());
            }
        }
        if (filter.getEndDate() != null && !filter.getEndDate().isEmpty()) {
            try {
                endDate = LocalDate.parse(filter.getEndDate());
            } catch (Exception e) {
                log.warn("Invalid end date format: {}", filter.getEndDate());
            }
        }

        // Convert string isExcluded to Boolean
        Boolean isExcluded = null;
        if (filter.getIsExcluded() != null && !filter.getIsExcluded().isEmpty()) {
            isExcluded = Boolean.valueOf(filter.getIsExcluded());
        }

        // Use the new DTO-returning method to avoid LazyInitializationException
        return birthdayNotificationRepository.findDTOsWithFilters(
            status,
            startDate,
            endDate,
            isExcluded,
            filter.getYear(),
            filter.getAlumniYear(),
            filter.getNama(),
            pageable
        );
    }    public List<BirthdayNotificationDTO> getUpcomingBirthdays(Integer days) {
        LocalDate today = LocalDate.now();
        LocalDate futureDate = today.plusDays(days);
        
        return birthdayNotificationRepository
            .findUpcomingBirthdayDTOs(today, futureDate);
    }    public List<BirthdayNotificationDTO> getPastBirthdays(Integer days) {
        LocalDate today = LocalDate.now();
        LocalDate pastDate = today.minusDays(days);
        LocalDate yesterday = today.minusDays(1); // Exclude today from past
        
        return birthdayNotificationRepository
            .findPastBirthdayDTOs(pastDate, yesterday);
    }
      /**
     * Get upcoming birthdays based on Biografi birth dates (not notification records)
     * This shows actual birthdays happening in the next X days
     */
    public List<BirthdayNotificationDTO> getUpcomingBirthdaysFromBiografi(Integer days) {
        LocalDate today = LocalDate.now();
        
        List<Biografi> biografiWithUpcomingBirthdays = biografiRepository
            .findUpcomingBirthdays(today, days);
        
        return biografiWithUpcomingBirthdays.stream()
            .map(this::convertBiografiToBirthdayDTO)
            .sorted((a, b) -> a.getNotificationDate().compareTo(b.getNotificationDate()))
            .collect(java.util.stream.Collectors.toList());
    }
    
    /**
     * Get past birthdays based on Biografi birth dates (not notification records)
     * This shows actual birthdays that happened in the last X days
     */
    public List<BirthdayNotificationDTO> getPastBirthdaysFromBiografi(Integer days) {
        LocalDate today = LocalDate.now();
        
        List<Biografi> biografiWithPastBirthdays = biografiRepository
            .findPastBirthdays(today, days);
        
        return biografiWithPastBirthdays.stream()
            .map(this::convertBiografiToBirthdayDTO)
            .sorted((a, b) -> b.getNotificationDate().compareTo(a.getNotificationDate())) // Descending for past
            .collect(java.util.stream.Collectors.toList());
    }    /**
     * Convert Biografi to BirthdayNotificationDTO for display purposes
     */
    private BirthdayNotificationDTO convertBiografiToBirthdayDTO(Biografi biografi) {
        LocalDate today = LocalDate.now();
        int currentYear = today.getYear();
        
        // Calculate this year's birthday
        LocalDate thisYearBirthday = LocalDate.of(currentYear, 
            biografi.getTanggalLahir().getMonth(), 
            biografi.getTanggalLahir().getDayOfMonth());
        
        // For birthday calculations:
        // - If this year's birthday has already passed or is today, use this year for past birthdays
        // - If this year's birthday hasn't happened yet, use this year for upcoming birthdays
        LocalDate relevantBirthday = thisYearBirthday;
        
        // Calculate age based on the relevant birthday
        int age = currentYear - biografi.getTanggalLahir().getYear();
        
        // Check if there's an existing notification for this biografi
        List<BirthdayNotification> existingNotifications = birthdayNotificationRepository
            .findByBiografiIdAndYear(biografi.getBiografiId(), currentYear);
        
        String status = "NO_NOTIFICATION";
        String statusDisplayName = "Tidak Ada Notifikasi";
        String message = "";
        java.time.LocalDateTime sentAt = null;
        String errorMessage = null;
        boolean isExcluded = false;
        
        if (!existingNotifications.isEmpty()) {
            BirthdayNotification notification = existingNotifications.get(0);
            status = notification.getStatus().toString();
            statusDisplayName = getStatusDisplayName(notification.getStatus());
            message = notification.getMessage() != null ? notification.getMessage() : "";
            sentAt = notification.getSentAt();
            errorMessage = notification.getErrorMessage();
            isExcluded = notification.getIsExcluded() != null ? notification.getIsExcluded() : false;
        }
        
        return new BirthdayNotificationDTO(
            existingNotifications.isEmpty() ? null : existingNotifications.get(0).getId(),
            biografi.getBiografiId(),
            biografi.getNamaLengkap(),
            biografi.getNomorTelepon(),
            biografi.getEmail(),
            biografi.getTanggalLahir(),
            relevantBirthday,
            relevantBirthday, // Use birthday as notification date for display
            currentYear,
            BirthdayNotification.NotificationStatus.valueOf(status.equals("NO_NOTIFICATION") ? "PENDING" : status),
            statusDisplayName,
            message,
            sentAt,
            errorMessage,
            isExcluded,
            biografi.getCreatedAt(),
            biografi.getUpdatedAt(),
            age
        );
    }
    
    private String getStatusDisplayName(BirthdayNotification.NotificationStatus status) {
        switch (status) {
            case SENT: return "Terkirim";
            case FAILED: return "Gagal";
            case PENDING: return "Menunggu";
            case EXCLUDED: return "Dikecualikan";
            case RESENT: return "Dikirim Ulang";
            default: return status.toString();
        }
    }
    
    @Transactional
    public void testBirthdayNotificationForBiografi(Long biografiId) {
        Biografi biografi = biografiRepository.findById(biografiId)
            .orElseThrow(() -> new RuntimeException("Biografi not found with ID: " + biografiId));
        
        if (biografi.getNomorTelepon() == null || biografi.getNomorTelepon().trim().isEmpty()) {
            throw new RuntimeException("Nomor telepon tidak tersedia untuk " + biografi.getNamaLengkap());
        }
        
        // Get current birthday settings to check if age should be included
        var settings = birthdaySettingsService.getActiveSettings();
        Boolean includeAge = settings != null ? settings.getIncludeAge() : true;
        
        String message = defaultBirthdayMessage;
        if (settings != null && settings.getMessage() != null && !settings.getMessage().trim().isEmpty()) {
            message = settings.getMessage();
        }
        
        // Create personalized message with optional age
        String personalizedMessage = createPersonalizedMessage(biografi, message, includeAge);
        
        // Send WhatsApp message
        whatsAppService.sendMessage(biografi.getNomorTelepon(), personalizedMessage);
        
        log.info("Test birthday notification sent to {} ({})", 
            biografi.getNamaLengkap(), biografi.getNomorTelepon());
    }

    @Transactional
    public void sendBirthdayNotificationForBiografi(Long biografiId) {
        Biografi biografi = biografiRepository.findById(biografiId)
            .orElseThrow(() -> new RuntimeException("Biografi not found with ID: " + biografiId));
        
        if (biografi.getNomorTelepon() == null || biografi.getNomorTelepon().trim().isEmpty()) {
            throw new RuntimeException("Nomor telepon tidak tersedia untuk " + biografi.getNamaLengkap());
        }
        
        // Get current birthday settings
        var settings = birthdaySettingsService.getActiveSettings();
        Boolean includeAge = settings != null ? settings.getIncludeAge() : true;
        
        String message = defaultBirthdayMessage;
        if (settings != null && settings.getMessage() != null && !settings.getMessage().trim().isEmpty()) {
            message = settings.getMessage();
        }
        
        // Create personalized message with optional age
        String personalizedMessage = createPersonalizedMessage(biografi, message, includeAge);
        
        try {
            // Send WhatsApp message
            whatsAppService.sendMessage(biografi.getNomorTelepon(), personalizedMessage);
            
            // Find or create notification record for current year
            int currentYear = LocalDate.now().getYear();
            List<BirthdayNotification> notifications = birthdayNotificationRepository
                .findByBiografiAndYear(biografi, currentYear);
            
            BirthdayNotification notification;
            if (!notifications.isEmpty()) {
                // Update existing notification
                notification = notifications.get(0);
            } else {
                // Create new notification record
                notification = new BirthdayNotification();
                notification.setBiografi(biografi);
                notification.setYear(currentYear);
                
                if (biografi.getTanggalLahir() != null) {
                    LocalDate birthday = LocalDate.of(currentYear, 
                        biografi.getTanggalLahir().getMonth(), 
                        biografi.getTanggalLahir().getDayOfMonth());
                    notification.setBirthdayDate(birthday);
                    notification.setNotificationDate(birthday.minusDays(daysAhead));
                }
                
                notification.setIsExcluded(false);
            }
            
            notification.setStatus(NotificationStatus.SENT);
            notification.setSentAt(LocalDateTime.now());
            notification.setMessage(personalizedMessage);
            notification.setErrorMessage(null);
            
            birthdayNotificationRepository.save(notification);
            
            log.info("Birthday notification sent successfully to {} ({})", 
                biografi.getNamaLengkap(), biografi.getNomorTelepon());
                
        } catch (Exception e) {
            log.error("Failed to send birthday notification to biografi {}: {}", biografiId, e.getMessage());
            
            // Update notification record with error status
            int currentYear = LocalDate.now().getYear();
            List<BirthdayNotification> notifications = birthdayNotificationRepository
                .findByBiografiAndYear(biografi, currentYear);
            
            BirthdayNotification notification;
            if (!notifications.isEmpty()) {
                notification = notifications.get(0);
            } else {
                notification = new BirthdayNotification();
                notification.setBiografi(biografi);
                notification.setYear(currentYear);
                notification.setIsExcluded(false);
                
                if (biografi.getTanggalLahir() != null) {
                    LocalDate birthday = LocalDate.of(currentYear, 
                        biografi.getTanggalLahir().getMonth(), 
                        biografi.getTanggalLahir().getDayOfMonth());
                    notification.setBirthdayDate(birthday);
                    notification.setNotificationDate(birthday.minusDays(daysAhead));
                }
            }
            
            notification.setStatus(NotificationStatus.FAILED);
            notification.setErrorMessage(e.getMessage());
            notification.setMessage(personalizedMessage);
            
            birthdayNotificationRepository.save(notification);
            
            throw new RuntimeException("Failed to send birthday notification: " + e.getMessage());
        }    }
    
    /**
     * Convert sort field names to JPQL property names (for use with JPQL queries)
     */
    private String convertSortFieldToJpqlProperty(String sortBy) {
        switch (sortBy) {
            case "notificationDate":
                return "notificationDate";
            case "birthdayDate":
                return "birthdayDate";
            case "namaLengkap":
                return "biografi.namaLengkap"; // Access through the joined entity
            case "createdAt":
                return "createdAt";
            case "updatedAt":
                return "updatedAt";
            case "sentAt":
                return "sentAt";
            case "isExcluded":
                return "isExcluded";
            default:
                return sortBy; // Return as-is if no mapping found
        }
    }
    
    /**
     * Convert JPA property names to database column names for native SQL queries
     */
    private String convertSortFieldToColumnName(String sortBy) {
        switch (sortBy) {
            case "notificationDate":
                return "notification_date";
            case "birthdayDate":
                return "birthday_date";
            case "namaLengkap":
                return "nama_lengkap";
            case "createdAt":
                return "created_at";
            case "updatedAt":
                return "updated_at";
            case "sentAt":
                return "sent_at";
            case "isExcluded":
                return "is_excluded";
            default:
                return sortBy; // Return as-is if no mapping found
        }
    }

    /**
     * Get birthday statistics for a given year
     */
    public BirthdayStatistics getBirthdayStatistics(Integer year) {
        // Get statistics from repository
        List<Object[]> stats = birthdayNotificationRepository.getBirthdayStatistics(year);
        
        if (stats.isEmpty()) {
            return new BirthdayStatistics(0L, 0L, 0L, 0L, 0L, year);
        }
        
        Object[] result = stats.get(0);
        Long total = ((Number) result[0]).longValue();
        Long sent = ((Number) result[1]).longValue();
        Long pending = ((Number) result[2]).longValue();
        Long failed = ((Number) result[3]).longValue();
        Long excluded = ((Number) result[4]).longValue();
        
        return new BirthdayStatistics(total, sent, pending, failed, excluded, year);
    }
      /**
     * Get birthday settings - delegate to BirthdaySettingsService
     */
    public BirthdaySettingsResponse getBirthdaySettings() {
        // For now, return a basic response. In a full implementation, this would
        // delegate to a separate BirthdaySettingsService
        BirthdaySettingsResponse response = new BirthdaySettingsResponse();
        response.setEnabled(birthdayNotificationEnabled);
        response.setMessage(defaultBirthdayMessage);
        response.setDaysAhead(daysAhead);
        response.setTime("08:00");
        response.setTimezone("Asia/Jakarta");
        return response;
    }
}
