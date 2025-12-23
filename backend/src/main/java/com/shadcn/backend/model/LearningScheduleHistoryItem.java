package com.shadcn.backend.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "learning_schedule_history_items",
        indexes = {
                @Index(name = "idx_learning_schedule_history_items_history_id", columnList = "history_id"),
                @Index(name = "idx_learning_schedule_history_items_agent_code", columnList = "agent_code"),
                @Index(name = "idx_learning_schedule_history_items_wa_status", columnList = "wa_status")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LearningScheduleHistoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "history_id", nullable = false)
    private LearningScheduleHistory history;

    @Column(name = "agent_code", length = 50)
    private String agentCode;

    @Column(name = "full_name", length = 150)
    private String fullName;

    @Column(name = "phone_no", length = 25)
    private String phoneNo;

    @Column(name = "policy_last_date")
    private LocalDate policyLastDate;

    @Column(name = "media_type", length = 16)
    private String mediaType;

    @Column(name = "learning_code", length = 160)
    private String learningCode;

    @Column(name = "wa_status", length = 24)
    private String waStatus;

    @Column(name = "wa_message_id", length = 120)
    private String waMessageId;

    @Column(name = "error_message", columnDefinition = "LONGTEXT")
    private String errorMessage;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
