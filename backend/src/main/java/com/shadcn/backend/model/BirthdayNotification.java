package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "birthday_notifications", indexes = {
    @Index(name = "idx_birthday_biografi", columnList = "biografiId"),
    @Index(name = "idx_birthday_date", columnList = "notificationDate"),
    @Index(name = "idx_birthday_status", columnList = "status"),
    @Index(name = "idx_birthday_year", columnList = "year")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BirthdayNotification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "biografiId", nullable = false)
    private Biografi biografi;
    
    @Column(nullable = false)
    private LocalDate notificationDate;
    
    @Column(nullable = false)
    private LocalDate birthdayDate;
    
    @Column(nullable = false)
    private Integer year;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationStatus status = NotificationStatus.PENDING;
    
    @Column(columnDefinition = "TEXT")
    private String message;
    
    @Column
    private LocalDateTime sentAt;
    
    @Column(columnDefinition = "TEXT")
    private String errorMessage;
    
    @Column(nullable = false)
    private Boolean isExcluded = false;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    private void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    public enum NotificationStatus {
        PENDING("Menunggu"),
        SENT("Terkirim"),
        FAILED("Gagal"),
        EXCLUDED("Dikecualikan"),
        RESENT("Dikirim Ulang");
        
        private final String displayName;
        
        NotificationStatus(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
}
