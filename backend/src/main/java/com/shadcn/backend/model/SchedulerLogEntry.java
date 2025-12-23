package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "scheduler_logs")
public class SchedulerLogEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(length = 16)
    private String level;

    @Column(length = 255)
    private String logger;

    @Column(length = 64)
    private String event;

    private Long configId;

    private Long historyId;

    @Column(length = 64)
    private String schedulerType;

    @Column(length = 64)
    private String companyCode;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(columnDefinition = "TEXT")
    private String stackTrace;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
