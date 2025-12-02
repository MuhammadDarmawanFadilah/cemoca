package com.shadcn.backend.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
      @Column(nullable = false, length = 255)
    private String title;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private NotificationType type;
    
    // Store recipients as JSON string instead of separate table
    @Column(name = "recipients", columnDefinition = "TEXT")
    private String recipientsJson;
    
    @Column(length = 500)
    private String imageUrl;    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private NotificationStatus status;
    
    @Column(length = 1000)
    private String errorMessage;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "created_at")
    private LocalDateTime createdAt;
      @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "sent_at")
    private LocalDateTime sentAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = NotificationStatus.PENDING;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
      public enum NotificationType {
        TEXT, IMAGE
    }
    
    public enum NotificationStatus {
        PENDING, SENT, FAILED
    }
    
    // Helper methods for recipients conversion
    @Transient
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    public List<String> getRecipients() {
        if (recipientsJson == null || recipientsJson.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(recipientsJson, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            return new ArrayList<>();
        }
    }
    
    public void setRecipients(List<String> recipients) {
        if (recipients == null) {
            this.recipientsJson = null;
        } else {
            try {
                this.recipientsJson = objectMapper.writeValueAsString(recipients);
            } catch (JsonProcessingException e) {
                this.recipientsJson = null;
            }
        }
    }
}
