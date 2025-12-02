package com.shadcn.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "birthday_settings")
public class BirthdaySettings {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "enabled", nullable = false)
    private Boolean enabled = true;
    
    @Column(name = "notification_time", nullable = false)
    private String notificationTime = "0 0 8 * * *"; // Cron expression
    
    @Column(name = "timezone", nullable = false)
    private String timezone = "Asia/Jakarta";
    
    @Column(name = "message", columnDefinition = "TEXT")
    private String message = "Selamat ulang tahun! Semoga panjang umur, sehat selalu, dan sukses dalam karir. Salam hangat dari Alumni Association.";
    
    @Column(name = "days_ahead", nullable = false)
    private Integer daysAhead = 0;
    
    @Column(name = "include_age", nullable = false)
    private Boolean includeAge = true;
    
    @Column(name = "attachment_image_url")
    private String attachmentImageUrl;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "updated_by")
    private String updatedBy;
    
    // Constructors
    public BirthdaySettings() {}
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Boolean getEnabled() {
        return enabled;
    }
    
    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
    
    public String getNotificationTime() {
        return notificationTime;
    }
    
    public void setNotificationTime(String notificationTime) {
        this.notificationTime = notificationTime;
    }
    
    public String getTimezone() {
        return timezone;
    }
    
    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public Integer getDaysAhead() {
        return daysAhead;
    }
    
    public void setDaysAhead(Integer daysAhead) {
        this.daysAhead = daysAhead;
    }
    
    public Boolean getIncludeAge() {
        return includeAge;
    }
    
    public void setIncludeAge(Boolean includeAge) {
        this.includeAge = includeAge;
    }
    
    public String getAttachmentImageUrl() {
        return attachmentImageUrl;
    }
    
    public void setAttachmentImageUrl(String attachmentImageUrl) {
        this.attachmentImageUrl = attachmentImageUrl;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public String getUpdatedBy() {
        return updatedBy;
    }
    
    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
