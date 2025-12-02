package com.shadcn.backend.dto;

import com.shadcn.backend.model.BirthdayNotification;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class BirthdayNotificationDTO {
    private Long id;
    private Long biografiId;
    private String namaLengkap;
    private String nomorTelepon;
    private String email;
    private LocalDate tanggalLahir;
    private LocalDate birthdayDate;
    private LocalDate notificationDate;
    private Integer year;
    private BirthdayNotification.NotificationStatus status;
    private String statusDisplayName;
    private String message;
    private LocalDateTime sentAt;
    private String errorMessage;
    private Boolean isExcluded;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer age;
    
    // Constructors
    public BirthdayNotificationDTO() {}
    
    public BirthdayNotificationDTO(Long id, Long biografiId, String namaLengkap, String nomorTelepon,
                                 String email, LocalDate tanggalLahir, LocalDate birthdayDate, 
                                 LocalDate notificationDate, Integer year,
                                 BirthdayNotification.NotificationStatus status, String statusDisplayName,
                                 String message, LocalDateTime sentAt, String errorMessage, 
                                 Boolean isExcluded, LocalDateTime createdAt, LocalDateTime updatedAt,
                                 Integer age) {
        this.id = id;
        this.biografiId = biografiId;
        this.namaLengkap = namaLengkap;
        this.nomorTelepon = nomorTelepon;
        this.email = email;
        this.tanggalLahir = tanggalLahir;
        this.birthdayDate = birthdayDate;
        this.notificationDate = notificationDate;
        this.year = year;
        this.status = status;
        this.statusDisplayName = statusDisplayName;
        this.message = message;
        this.sentAt = sentAt;
        this.errorMessage = errorMessage;
        this.isExcluded = isExcluded;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.age = age;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getBiografiId() { return biografiId; }
    public void setBiografiId(Long biografiId) { this.biografiId = biografiId; }
    
    public String getNamaLengkap() { return namaLengkap; }
    public void setNamaLengkap(String namaLengkap) { this.namaLengkap = namaLengkap; }
    
    public String getNomorTelepon() { return nomorTelepon; }
    public void setNomorTelepon(String nomorTelepon) { this.nomorTelepon = nomorTelepon; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public LocalDate getTanggalLahir() { return tanggalLahir; }
    public void setTanggalLahir(LocalDate tanggalLahir) { this.tanggalLahir = tanggalLahir; }
    
    public LocalDate getBirthdayDate() { return birthdayDate; }
    public void setBirthdayDate(LocalDate birthdayDate) { this.birthdayDate = birthdayDate; }
    
    public LocalDate getNotificationDate() { return notificationDate; }
    public void setNotificationDate(LocalDate notificationDate) { this.notificationDate = notificationDate; }
    
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    
    public BirthdayNotification.NotificationStatus getStatus() { return status; }
    public void setStatus(BirthdayNotification.NotificationStatus status) { this.status = status; }
    
    public String getStatusDisplayName() { return statusDisplayName; }
    public void setStatusDisplayName(String statusDisplayName) { this.statusDisplayName = statusDisplayName; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
    
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    
    public Boolean getIsExcluded() { return isExcluded; }
    public void setIsExcluded(Boolean isExcluded) { this.isExcluded = isExcluded; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
}